/**
 * Copyright 2024 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BeeCallbacks } from 'bee-agent-framework/agents/bee/types';
import { getSerializedObjectSafe } from './internals/helpers/get-serialized-object-safe.js';
import { createSpan } from './internals/create-span.js';
import {
  createClient,
  Span,
  TraceRequestBody,
  TraceResponse
} from './internals/api/create-client.js';
import { sendTrace } from './internals/api/send-trace.js';
import { IdNameManager } from './internals/helpers/id-name-manager.js';
import { InferCallbackValue } from 'bee-agent-framework/emitter/types';
import { getErrorSafe } from './internals/helpers/get-error-safe.js';
import { RunContext } from 'bee-agent-framework/context';
import { observeApiCircuitBreaker } from './internals/helpers/circuit-breaker.js';
import { GenerateCallbacks } from 'bee-agent-framework/llms/base';
import { ObserveError } from './errors.js';
import { createAbortController } from 'bee-agent-framework/internals/helpers/cancellation';
import { Role } from 'bee-agent-framework/llms/primitives/message';
import { BeeAgent } from 'bee-agent-framework/agents/bee/agent';
import { Version } from 'bee-agent-framework';
import { Version as ConnectorVersion } from './version.js';
import { ChatLLM } from 'bee-agent-framework/llms/chat';

const SIGNAL_TIMEOUT_DEFAULT = 10000;

interface ConnectorConfig {
  /** Base Observe API settings */
  api: {
    /** Custom keys that will be removed from the events sending data */
    ignored_keys?: string[];
    /** Observe API base URL */
    baseUrl: string;
    /** Base authorization strategy via the AUTH key */
    apiAuthKey: string;
  };
  /** Custom MLFLOW experimentId / runId can be defined */
  experimentTracker?: {
    experimentId?: string;
    runId?: string;
  };
  /**
   * Callback provides the output of the Observe API send request operation.
   * It is trigged when the agent finish the run method and send data to the API
   */
  // cb: (error: Error | undefined, data?: TraceRespnose) => Promise<void>;
  cb: {
    (error: ObserveError, data: undefined): Promise<void>;
    (error: undefined, data: TraceResponse): Promise<void>;
  };
}

export function createObserveConnector(config: ConnectorConfig) {
  return (context: RunContext<BeeAgent>) => {
    const {
      emitter,
      runParams: [{ prompt }],
      signal,
      instance
    } = context;
    const basePath = emitter.namespace.join('.');

    const spans: Span[] = [];
    let generatedMessage: TraceRequestBody['response'] | undefined = undefined;
    let history: { content: string; role: string }[] | undefined = undefined;
    const groupIterations: string[] = [];

    const idNameManager = new IdNameManager();

    const newTokenEventName: keyof GenerateCallbacks = `newToken`;
    const successEventName: keyof GenerateCallbacks = `success`;
    const finishEventName: keyof GenerateCallbacks = `finish`;
    const startEventName: keyof GenerateCallbacks = `start`;

    const onNewTokenMap = new Map<string, number>();

    /**
     * This block sends the collected data to the Observe API
     * The created trace response can be processed using the provided callback function
     */
    emitter.match(
      (event) => event.path === `${basePath}.run.${finishEventName}`,
      async () => {
        try {
          const responseData = await observeApiCircuitBreaker.getRunner(sendTrace)({
            body: {
              spans,
              request: {
                message:
                  prompt ??
                  instance.memory.messages
                    .slice()
                    .reverse()
                    .find((message) => message.role === Role.USER)?.text,
                ...(history && { history }),
                connector: {
                  version: ConnectorVersion
                },
                framework: {
                  version: Version
                }
              },
              ...(generatedMessage !== undefined && {
                response: generatedMessage
              }),
              ...((config.experimentTracker?.experimentId || config.experimentTracker?.runId) && {
                experiment_tracker: {
                  experiment_id: config.experimentTracker.experimentId,
                  run_id: config.experimentTracker.runId
                }
              })
            },
            signal: createAbortController(signal, AbortSignal.timeout(SIGNAL_TIMEOUT_DEFAULT))
              .signal,
            client: createClient({
              baseUrl: config.api.baseUrl,
              apiAuthKey: config.api.apiAuthKey
            }),
            ignored_keys: config.api.ignored_keys || []
          });
          await config.cb(undefined, responseData);
        } catch (error) {
          await config.cb(ObserveError.ensure(error), undefined);
        }
      }
    );

    /**
     * This block collects all "not run category" events with their data and prepares spans for the Observe API.
     * The huge number of `newToken` events are skipped and only the last one for each parent event is saved because of `generated_token_count` information
     * The framework event tree structure is different from the open-telemetry tree structure and must be transformed from groupId and parentGroupId pattern via idNameManager
     * The artificial "iteration" main tree level is computed from the `meta.groupId`
     */
    emitter.match('*.*', (data, meta) => {
      // allow `run.error` event due to the runtime error information
      if (meta.path.includes('.run.') && meta.path !== `${basePath}.run.error`) return;
      if (!meta.trace?.runId) {
        throw new ObserveError(`Fatal error. Missing runId for event: ${meta.path}`);
      }

      /**
       * create groupId span level (id does not exist)
       * I use only the top-level groups like iterations other nested groups like tokens would introduce unuseful complexity
       */
      if (meta.groupId && !meta.trace.parentRunId && !groupIterations.includes(meta.groupId)) {
        spans.push(
          createSpan({
            id: meta.groupId,
            name: meta.groupId,
            target: 'groupId',
            startedAt: meta.createdAt
          })
        );
        groupIterations.push(meta.groupId);
      }

      const { spanId, parentSpanId } = idNameManager.getIds({
        path: meta.path,
        id: meta.id,
        runId: meta.trace.runId,
        parentRunId: meta.trace.parentRunId,
        groupId: meta.groupId
      });

      const serializedData = getSerializedObjectSafe(data);

      const span = createSpan({
        id: spanId,
        name: meta.name,
        target: meta.path,
        ...(parentSpanId && { parent: { id: parentSpanId } }),
        ctx: getSerializedObjectSafe(meta.context),
        data: serializedData,
        error: getErrorSafe(data),
        startedAt: meta.createdAt
      });

      const lastIteration = groupIterations[groupIterations.length - 1];

      // delete the `newToken` event if exists and create the new one
      const iterationOnNewTokenIndex = onNewTokenMap.get(lastIteration);
      if (iterationOnNewTokenIndex && meta.name === newTokenEventName) {
        spans.splice(iterationOnNewTokenIndex, 1);
      }

      spans.push(span);

      // save the last `newToken` event for each iteration
      if (meta.name === newTokenEventName && groupIterations.length > 0) {
        onNewTokenMap.set(lastIteration, spans.length - 1);
      }
    });

    // The generated response and message history are collected from the `success` event
    emitter.on(successEventName, (data) => {
      const { data: dataObject, memory } = data as InferCallbackValue<
        BeeCallbacks[typeof successEventName]
      >;

      generatedMessage = {
        role: dataObject.role,
        text: dataObject.text
      };
      history = memory.messages.map((msg) => ({ content: msg.text, role: msg.role }));
    });

    // Read rawPrompt from llm input only for supported adapters and create the custom event with it
    emitter.match(
      (event) => event.creator instanceof ChatLLM && event.name === startEventName,
      ({ input }: InferCallbackValue<GenerateCallbacks[typeof startEventName]>, meta) => {
        if (
          'messagesToPrompt' in meta.creator &&
          typeof meta.creator.messagesToPrompt === 'function' &&
          meta.creator instanceof ChatLLM &&
          meta.trace
        ) {
          const rawPrompt = meta.creator.messagesToPrompt(input);
          // create a custom path to prevent event duplication
          const path = `${meta.path}.custom`;

          const { spanId, parentSpanId } = idNameManager.getIds({
            path,
            id: meta.id,
            runId: meta.trace.runId,
            parentRunId: meta.trace.parentRunId,
            groupId: meta.groupId
          });

          spans.push(
            createSpan({
              id: spanId,
              name: `${meta.name}Custom`,
              target: path,
              startedAt: meta.createdAt,
              ...(parentSpanId && { parent: { id: parentSpanId } }),
              data: {
                rawPrompt,
                creator: meta.creator.createSnapshot()
              }
            })
          );
        }
      }
    );
  };
}
