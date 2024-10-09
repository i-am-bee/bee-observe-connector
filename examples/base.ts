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

import { createObserveConnector } from '@/create-observe-connector.js';
import { ObserveError } from '@/errors.js';
import { beeObserveApiSetting, buildAgent } from '@tests/utils.js';

/**
 * The null value can be passed to the prompt if the message is already in the memory.
 * See the memory using here: https://github.com/i-am-bee/bee-agent-framework/blob/main/docs/memory.md#usage-with-agents
 * and how to define a history here: https://github.com/i-am-bee/bee-agent-framework/blob/main/docs/memory.md#usage-with-llms
 * */
const prompt = 'What is the capital city of the Czech Republic?';
const agent = buildAgent({});

await agent.run({ prompt }).middleware(
  createObserveConnector({
    api: beeObserveApiSetting,
    cb: async (err, data) => {
      if (err) {
        if (err instanceof ObserveError) {
          console.log(err.explain());
        } else {
          console.error(err);
        }
      } else {
        console.log(data);
      }
    }
  })
);
