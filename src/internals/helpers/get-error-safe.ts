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

import { FrameworkError } from 'bee-agent-framework/errors';

export function getErrorSafe(data: unknown): string | undefined {
  const error = data && typeof data === 'object' && 'error' in data ? data.error : data;

  if (error instanceof FrameworkError) {
    return FrameworkError.ensure(error).explain();
  }
  return undefined;
}
