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

import { Span } from './api/create-client.js';

interface CreateSpanProps {
  id: string;
  name: string;
  target: string;
  startedAt: Date;
  ctx?: any;
  data?: any;
  error?: string;
  parent?: { id: string };
}

export function createSpan({
  target,
  name,
  data,
  error,
  ctx,
  parent,
  id,
  startedAt
}: CreateSpanProps): Span {
  return {
    name: name,
    attributes: {
      target,
      data: { ...data },
      ctx: { ...ctx }
    },
    context: {
      span_id: id
    },
    parent_id: parent?.id,
    status_code: error ? 'ERROR' : 'OK',
    status_message: error ? error : '',
    start_time: startedAt.toISOString(),
    end_time: new Date().toISOString()
  };
}
