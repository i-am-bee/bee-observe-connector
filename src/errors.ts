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

import { FrameworkError } from 'bee-agent-framework';

export class ObserveError extends FrameworkError {
  static ensure(error: unknown): ObserveError {
    return error instanceof ObserveError
      ? error
      : error instanceof Error
        ? new ObserveError('Observe error has occurred.', [error])
        : new ObserveError('Observe error has occurred.');
  }
}

export class APIError extends Error {
  public code: string;

  constructor({ message, code }: { message: string; code: string }, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
  }
}
