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

import { expect, test, describe, vi } from 'vitest';
import { setTimeout as setTimeoutPromise } from 'node:timers/promises';
import { CircuitBreaker, CircuitBreakerOptions, State } from './circuit-breaker.js';
import { ObserveError } from '../../errors.js';

describe('circuit breaker', () => {
  test('should call circuit when closed', async () => {
    const circuit = vi.fn(() => true);
    const breaker = new CircuitBreaker({ failureThreshold: 1, waitDurationInOpenState: 1000 });

    await breaker.run(circuit);

    expect(circuit).toBeCalled();
    expect(breaker.state).toBe(State.CLOSED);
  });

  test('should not open when failureThreshold not met', async () => {
    const circuit = vi.fn(() => Promise.reject(new Error('test')));
    const breaker = new CircuitBreaker({ failureThreshold: 2, waitDurationInOpenState: 1000 });

    await expect(breaker.run(circuit)).rejects.toThrowError('test');
    expect(breaker.state).toBe(State.CLOSED);
  });

  test('should open when failureThreshold is met', async () => {
    const circuit = vi.fn(() => Promise.reject(new Error('test')));
    const breaker = new CircuitBreaker({ failureThreshold: 1, waitDurationInOpenState: 1000 });

    await expect(breaker.run(circuit)).rejects.toThrowError('test');
    expect(breaker.state).toBe(State.OPEN);
  });

  test('should immediatelly reject when ran in open state', async () => {
    const circuit = vi.fn(() => Promise.reject(new Error('test')));
    const breaker = new CircuitBreaker({ failureThreshold: 1, waitDurationInOpenState: 1000 });

    await expect(breaker.run(circuit)).rejects.toThrowError('test');
    expect(breaker.state).toBe(State.OPEN);

    circuit.mockClear();

    await expect(breaker.run(circuit)).rejects.toThrow(ObserveError);
    expect(circuit).not.toBeCalled();
  });

  test('should call "onOpen" with false when opened from closed state', async () => {
    const circuit = vi.fn(() => Promise.reject(new Error('test')));
    const onOpen = vi.fn(() => {});
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      waitDurationInOpenState: 1000,
      onOpen
    });

    await expect(breaker.run(circuit)).rejects.toThrowError('test');
    expect(onOpen).toBeCalledWith(false);
  });

  test('should not count failure if ignored by "isFailure" option', async () => {
    const circuit = vi.fn(() => Promise.reject(new Error('test')));
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      waitDurationInOpenState: 1000,
      isFailure: () => false
    });

    await expect(breaker.run(circuit)).rejects.toThrowError('test');
    expect(breaker.state).toBe(State.CLOSED);
  });

  test('should still be open when timeout not yet met', async () => {
    const circuit = vi.fn(() => Promise.reject(new Error('test')));
    const breaker = new CircuitBreaker({ failureThreshold: 1, waitDurationInOpenState: 1000 });

    await expect(breaker.run(circuit)).rejects.toThrowError('test');
    expect(breaker.state).toBe(State.OPEN);

    await setTimeoutPromise(500);

    expect(breaker.state).toBe(State.OPEN);
  });

  test('should transition to half-open after timeout', async () => {
    const circuit = vi.fn(() => Promise.reject(new Error('test')));
    const breaker = new CircuitBreaker({ failureThreshold: 1, waitDurationInOpenState: 1000 });

    await expect(breaker.run(circuit)).rejects.toThrowError('test');
    expect(breaker.state).toBe(State.OPEN);

    await setTimeoutPromise(1000);

    expect(breaker.state).toBe(State.HALF_OPEN);
  });

  describe('in half-open state', () => {
    test('should transition back to open when circuit fails again', async () => {
      const circuit = vi.fn(() => Promise.reject(new Error('test')));
      const breaker = new CircuitBreaker({ failureThreshold: 2, waitDurationInOpenState: 1000 });

      await expect(breaker.run(circuit)).rejects.toThrowError('test');
      await expect(breaker.run(circuit)).rejects.toThrowError('test');
      expect(breaker.state).toBe(State.OPEN);

      await setTimeoutPromise(1000);

      expect(breaker.state).toBe(State.HALF_OPEN);

      await expect(breaker.run(circuit)).rejects.toThrowError('test');
      expect(breaker.state).toBe(State.OPEN);
    });

    test('should call "onOpen" with true when reopened', async () => {
      const circuit = vi.fn(() => Promise.reject(new Error('test')));
      const onOpen = vi.fn<NonNullable<CircuitBreakerOptions['onOpen']>>(() => {});
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        waitDurationInOpenState: 1000,
        onOpen
      });

      await expect(breaker.run(circuit)).rejects.toThrowError('test');

      await setTimeoutPromise(1000);

      await expect(breaker.run(circuit)).rejects.toThrowError('test');

      expect(onOpen.mock.calls).toEqual([[false], [true]]);
    });

    test('should allow only one concurrent run to circuit', async () => {
      const circuit = vi.fn<() => Promise<void>>(() => Promise.reject(new Error('test')));
      const breaker = new CircuitBreaker({ failureThreshold: 1, waitDurationInOpenState: 1000 });

      await expect(breaker.run(circuit)).rejects.toThrowError('test');

      await setTimeoutPromise(1000);

      circuit.mockClear();
      circuit.mockImplementation(() => Promise.resolve());

      await Promise.all([
        expect(breaker.run(circuit)).resolves.toBe(undefined),
        expect(breaker.run(circuit)).rejects.toThrow(ObserveError)
      ]);
      expect(circuit).toBeCalledTimes(1);
    });

    test('should close if trial run succeeds', async () => {
      const circuit = vi.fn<() => Promise<void>>(() => Promise.reject(new Error('test')));
      const breaker = new CircuitBreaker({ failureThreshold: 1, waitDurationInOpenState: 1000 });

      await expect(breaker.run(circuit)).rejects.toThrowError('test');

      await setTimeoutPromise(1000);

      circuit.mockClear();
      circuit.mockImplementation(() => Promise.resolve());

      await expect(breaker.run(circuit)).resolves.toBe(undefined);
      expect(breaker.state).toBe(State.CLOSED);
    });
  });
});
