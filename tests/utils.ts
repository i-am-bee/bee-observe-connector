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

import { OllamaChatLLM } from 'bee-agent-framework/adapters/ollama/chat';
import { BeeAgent } from 'bee-agent-framework/agents/bee/agent';
import { TokenMemory } from 'bee-agent-framework/memory/tokenMemory';
import { DuckDuckGoSearchTool } from 'bee-agent-framework/tools/search/duckDuckGoSearch';
import { paths } from '@/internals/api/schema.js';
import { APIError } from '@/errors.js';
import { Client, TraceResponse } from '@/internals/api/create-client.js';
import { createObserveConnector } from '@/create-observe-connector.js';

// default values for local testing against the docker defined in the `./compose.yml` file
export const beeObserveApiSetting = {
  baseUrl: 'http://127.0.0.1:4002',
  apiAuthKey: 'testing-api-key'
};

export const llm = new OllamaChatLLM({
  modelId: 'llama3.1',
  parameters: {
    temperature: 0,
    stop: ['<|eot_id|>'],
    num_predict: 512
  }
}); // default is llama3.1 (8B), it is recommended to use 70B model

const tt = new TokenMemory({ llm });

export function buildAgent({ memory }: { memory?: TokenMemory }) {
  return new BeeAgent({
    llm, // for more explore 'bee-agent-framework/adapters'
    memory: memory ?? new TokenMemory({ llm }), // for more explore 'bee-agent-framework/memory'
    tools: [new DuckDuckGoSearchTool()] // for more explore 'bee-agent-framework/tools'
  });
}

interface RunSyncProps {
  agent: BeeAgent;
  prompt: string;
}
export async function runSync({ agent, prompt }: RunSyncProps): Promise<TraceResponse> {
  return new Promise((resolve, reject) => {
    agent
      .run({ prompt })
      .middleware(
        createObserveConnector({
          api: beeObserveApiSetting,
          cb: async (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        })
      )
      .catch((err) => reject(err));
  });
}

export function loadNestedSpans(span: any, spans: any[]) {
  const nestedSpans = spans.filter((nestedSpan) => nestedSpan.parent_id === span.context.span_id);
  return nestedSpans.length > 0
    ? [span, ...nestedSpans.map((nestedSpan) => loadNestedSpans(nestedSpan, spans))].flat()
    : [span];
}

export enum IntegrationType {
  TOOL = 'tool',
  FINAL_ANSWER = 'final_answer'
}

export async function getSpans({
  traceId,
  client
}: {
  traceId: string;
  client: Client;
}): Promise<paths['/span']['get']['responses']['200']['content']['application/json']> {
  const { data, error } = await client.GET('/span', {
    params: {
      query: {
        trace_id: traceId
      }
    }
  });

  if (error) {
    const { message, code, ...cause } = error;
    throw new APIError({ message: error.message, code: error.code }, { cause });
  }

  return data;
}
