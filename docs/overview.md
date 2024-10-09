# Overview

## createObserveConnector

The main function collects data from the framework emitter (see the [Processed emitter events](#processed-emitter-events) section for more information) and sends them to the Observe API. See [Open API](#open-api) and [CircuitBreaker](#circuitbreaker).
The `createObserveConnector` function returns the framework Middleware function that has access to the whole run context including the emitter.

## Processed emitter events

The emitter is listened to 4 times for different purposes:

- (event) => event.path === `${basePath}.run.${finishEventName}` = this block listens only for the last run `finish` event. This code is called when all events are parsed to span trace structure and it sends them to the Observe API. The API response can be processed via the provided callback function.
- `'*.*'` = This main the most important block collects all "not run category" events with their data and prepares spans for the Observe API. It creates the top-level iteration spans as well. Each iteration has 1 tool call or the final answer.
- `successEventName` = The special data are collected in this block like (the run response, run message history)
- `event.creator instanceof ChatLLM && event.name === startEventName` = create a custom event that has important data about a run per iteration like information about the used model, or the raw prompt (the final prompt you can use directly for the LLM testing).

## CircuitBreaker

The Circuit Breaker pattern is used to prevent cascading failures in distributed systems by monitoring service calls and "breaking" the circuit if failures or slow responses occur. This allows the system to fail fast, returning errors immediately instead of waiting for timeouts, and reduces the load on struggling services. It helps maintain overall system stability by preventing resource exhaustion and enabling services to recover.

This pattern is used for trace-creating requests.

## Open API

The API client is generated from the bee-observe Open API specification.
Run `yarn generate:schema <API_URL>` for updating the Observe API schema.

## Examples

For more details about using see the `./examples` folder.
