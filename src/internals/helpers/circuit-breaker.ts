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

import { ObserveError } from '../../errors.js';

const defaultCircuitBreakerOptions = {
  failureThreshold: 5, // maximum number of failures accepted before opening the circuit breaker.
  waitDurationInOpenState: 2000 // number of milliseconds before the breaker will move from `open` to `half-open`
};

export interface CircuitBreakerOptions {
  /** maximum number of failures accepted before opening the circuit breaker. */
  failureThreshold: number;
  /** number of milliseconds before the breaker will move from `open` to `half-open` */
  waitDurationInOpenState: number;
  /** number of permitted calls when the CircuitBreaker is half open. */
  permittedNumberOfCallsInHalfOpenState?: number;
  /** Custom predicate if error is considered a failure */
  isFailure?: (err: unknown) => boolean;
  /** Callback trigged when circuit breaker opens */
  onOpen?: (isReopened: boolean) => void;
}

export enum State {
  OPEN = 'open',
  HALF_OPEN = 'half-open',
  CLOSED = 'closed'
}

export class CircuitBreaker {
  #options: Omit<Required<CircuitBreakerOptions>, 'onOpen'> & {
    onOpen?: CircuitBreakerOptions['onOpen'];
  };

  #state = State.CLOSED;
  #currentlyRunningCircuits = 0;
  #failures = 0;

  constructor(options: CircuitBreakerOptions) {
    this.#options = {
      ...options,
      permittedNumberOfCallsInHalfOpenState: options.permittedNumberOfCallsInHalfOpenState ?? 1,
      isFailure: options.isFailure ?? (() => true)
    };
  }

  get state() {
    return this.#state;
  }

  async run<TCircuit extends (...args: any) => any>(
    circuit: TCircuit,
    ...args: Parameters<TCircuit>
  ): Promise<Awaited<ReturnType<TCircuit>>> {
    if (this.#state === State.OPEN) {
      throw new ObserveError('Circuit breaker is OPEN');
    }

    if (
      this.#state === State.HALF_OPEN &&
      this.#currentlyRunningCircuits >= this.#options.permittedNumberOfCallsInHalfOpenState
    ) {
      throw new ObserveError(
        'Circuit breaker is HALF_OPEN and number of calls has exceeded the limit'
      );
    }

    this.#currentlyRunningCircuits++;
    try {
      // eslint-disable-next-line prefer-spread
      const result = await circuit.apply(null, args);
      this.#onSuccess();
      return result;
    } catch (err) {
      this.#onError(err);
      throw err;
    } finally {
      this.#currentlyRunningCircuits--;
    }
  }

  getRunner<TCircuit extends (...args: any) => any>(circuit: TCircuit) {
    return (...args: Parameters<TCircuit>) => this.run(circuit, ...args);
  }

  #onSuccess() {
    this.#failures = 0;
    this.#state = State.CLOSED;
  }

  #onError(err: unknown) {
    if (!this.#options.isFailure(err)) {
      this.#onSuccess();
      return;
    }

    if (this.#state === State.HALF_OPEN) {
      this.#open(true);
    } else if (this.#state === State.CLOSED) {
      this.#failures++;
      if (this.#failures >= this.#options.failureThreshold) {
        this.#open(false);
      }
    }
  }

  #open(isReopened: boolean) {
    this.#options.onOpen?.(isReopened);
    this.#state = State.OPEN;
    setTimeout(() => {
      this.#state = State.HALF_OPEN;
    }, this.#options.waitDurationInOpenState);
  }
}

// instance with the default options
export const observeApiCircuitBreaker = new CircuitBreaker(defaultCircuitBreakerOptions);
