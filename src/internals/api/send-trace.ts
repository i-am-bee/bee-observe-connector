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

import { APIError } from '../../errors.js';
import { traceSerializer } from '../helpers/trace-serializer.js';
import { Client, TraceRequestBody, TraceResponse } from './create-client.js';

export async function sendTrace({
  body,
  signal,
  client,
  ignored_keys
}: {
  body: TraceRequestBody;
  signal: AbortSignal;
  client: Client;
  ignored_keys: string[];
}): Promise<TraceResponse> {
  const { data, error } = await client.POST('/trace', {
    body: body,
    signal,
    bodySerializer: traceSerializer({ ignored_keys })
  });

  if (error) {
    const { message, code, ...cause } = error;
    throw new APIError({ message: error.message, code: error.code }, { cause });
  }

  return data;
}
