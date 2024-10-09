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

import { beforeAll, describe, expect, test } from 'vitest';
import { Version } from 'bee-agent-framework';
import { Version as ConnectorVersion } from '../../src/version.js';
import {
  beeObserveApiSetting,
  buildAgent,
  getSpans,
  IntegrationType,
  loadNestedSpans,
  runSync
} from '../utils.js';
import { createClient, TraceResponse } from '../../src/internals/api/create-client.js';

const prompt = 'What is the capital city of the Czech Republic?';
const agent = buildAgent({});
let traceResponse: TraceResponse | undefined = undefined;
let computedIterations: {
  groupId: string;
  type: IntegrationType;
}[] = [];

describe('Trace', () => {
  beforeAll(async () => {
    traceResponse = await runSync({ agent, prompt });
  });

  test('should create Trace with all important data', async () => {
    // test request properties
    expect(traceResponse?.result.request).toMatchObject({
      message: prompt,
      connector: {
        version: ConnectorVersion
      },
      framework: {
        version: Version
      }
    });

    // test history in request
    expect(traceResponse?.result.request.history?.length).toBeGreaterThan(0);

    // test response length
    expect(traceResponse?.result.response?.text.length).toBeGreaterThan(0);
  });

  describe('Iterations', () => {
    beforeAll(async () => {
      const traceId = traceResponse?.result.id || '';
      // load all spans
      const { results: spans } = await getSpans({
        traceId,
        client: createClient(beeObserveApiSetting)
      });
      expect(spans.length).toBeGreaterThan(0);

      // build iterations for testing
      const iterations = spans
        .filter((span) => !span.parent_id && !['success', 'error'].includes(span.name))
        .map((span) => {
          return {
            span,
            children: loadNestedSpans(span, spans).flat()
          };
        })
        .filter((span) => span.children.length > 1);

      computedIterations = iterations.map((iteration) => {
        return {
          groupId: iteration.span.context.span_id,
          type: iteration.children.find((span) => span.name === 'toolStart')
            ? IntegrationType.TOOL
            : IntegrationType.FINAL_ANSWER
        };
      });
    });
    test('Validate computed iterations', async () => {
      // should have a valid groupId for each iteration
      computedIterations.forEach((iteration) => {
        expect(iteration.groupId).toBeTruthy(); // Check that groupId exists and is valid
      });

      // should have type "final" only for the last iteration
      computedIterations.forEach((iteration, index) => {
        const expectedType =
          index === computedIterations.length - 1
            ? IntegrationType.FINAL_ANSWER
            : IntegrationType.TOOL;
        expect(iteration.type).toBe(expectedType); // Check type
      });
    });
  });
});
