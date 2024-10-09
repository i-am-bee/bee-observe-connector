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
import { describe, expect, test } from 'vitest';
import { ObserveError } from './errors.js';

describe('errors', () => {
  describe('ensure', () => {
    test.each([
      [0],
      ['string'],
      [new Error('test')],
      [new FrameworkError('test')],
      [new ObserveError('test')]
    ])('should return the ObserveError from the %s input', (error) => {
      expect(ObserveError.ensure(error)).toBeInstanceOf(ObserveError);
    });
  });
});
