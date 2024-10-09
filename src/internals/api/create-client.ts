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

import createClientOpenapi from 'openapi-fetch';

import { paths } from './schema.js';

export type TraceRequestBody =
  paths['/trace']['post']['requestBody']['content']['application/json'];

export type Span = TraceRequestBody['spans'][0];

export type TraceResponse =
  paths['/trace']['post']['responses']['200']['content']['application/json'];

export type Client = ReturnType<typeof createClientOpenapi<paths>>;

let client: Client | null = null;

export function createClient({ baseUrl, apiAuthKey }: { baseUrl: string; apiAuthKey: string }) {
  if (!client) {
    client = createClientOpenapi<paths>({
      baseUrl,
      headers: {
        ['x-bee-authorization']: apiAuthKey,
        'Content-Type': 'application/json'
      }
    });
  }

  return client;
}
