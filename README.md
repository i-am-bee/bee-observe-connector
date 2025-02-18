<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/docs/assets/Bee_logo_white.svg">
    <source media="(prefers-color-scheme: light)" srcset="/docs/assets/Bee_logo_black.svg">
    <img alt="Bee Framework logo" height="90">
  </picture>
</p>

<h1 align="center">Bee Observe Connector</h1>

<p align="center">
  <a aria-label="Join the community on GitHub" href="https://github.com/i-am-bee/bee-observe-connector/discussions">
    <img alt="" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&labelColor=000000&label=Bee">
  </a>
  <h4 align="center">Observability connector for Bee Agent Framework</h4>
</p>

This package allows you to easily join the [**Bee Agent Framework**](https://github.com/i-am-bee/bee-agent-framework) and [**Bee Observe**](https://github.com/i-am-bee/bee-observe) with the one exported function.

## Table of Contents

1. [👩‍💻 Get started with Observe](#-get-started)

- [Installation](#installation)
- [Usage](#usage)
- [Limitations](#limitations)

2. [🪑 Local set-up](#-local-set-up)

- [Prerequisites](#prerequisites)
- [Steps](#steps)

3. [🚀 Run](#-run)

- [Run examples](#run-examples)

4. [🧪 Run tests](#-run-tests)
5. [Code of conduct](#code-of-conduct)
6. [Legal notice](#legal-notice)
7. [📖 Docs](#-docs)

## Getting started

### Installation

```bash
npm install bee-observe-connector
```

or

```bash
yarn add bee-observe-connector
```

### Usage

```typescript
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";
import { DuckDuckGoSearchTool } from "bee-agent-framework/tools/search/duckDuckGoSearch";
import { OpenMeteoTool } from "bee-agent-framework/tools/weather/openMeteo";
import { createObserveConnector } from "bee-observe-connector";

const llm = new OllamaChatLLM(); // default is llama3.1 (8B), it is recommended to use 70B model

const agent = new BeeAgent({
  llm,
  memory: new TokenMemory({ llm }),
  tools: [new DuckDuckGoSearchTool(), new OpenMeteoTool()],
});

const prompt = "What's the current weather in Las Vegas?";

await agent
  .run({ prompt })
  .middleware(createObserveConnector({
    api: {
      baseUrl: 'http://localhost:3001',
      apiAuthKey: 'xxx'
    },
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
    },
  }));
```

For more information about Agent setting see the [Bee Agent Framework](https://github.com/i-am-bee/bee-agent-framework) README.md file or go to the [Run examples](#run-examples) section.

### Limitations

- `Max request time 10s` = The connector sends the trace data to the Observe API. It uses the signal propagated from the Framework and the **default signal with a timeout of 10 seconds**.

## Local set-up

### Prerequisites

- Node.js (version managed using `nvm`)
- Yarn package manager (`corepack`)
- Git
- **Docker** distribution with support for compose is required, the following are supported:
  - [Docker](https://www.docker.com/)
  - [Rancher](https://www.rancher.com/) - macOS users may want to use VZ instead of QEMU
  - [Podman](https://podman.io/) - requires [compose](https://podman-desktop.io/docs/compose/setting-up-compose) and **rootful machine** (if your current machine is rootless, please create a new one)

### Steps

1. Clone the repository:

```
git clone git@github.com:i-am-bee/bee-observe-connector.git
cd bee-observe-connector
```

2. Use the appropriate Node.js version:

```
nvm use
```

3. Install dependencies

```
yarn
```

4. Run infra
   To start all necessary services like `observe API`, `redis`, `mongo` and `mlflow` run this command:

```
yarn start:infra
```

### 🚀 Run

#### Run examples

Base example:

```
yarn start:base
```

### 🧪 Run tests

```
yarn test:unit
yarn test:e2e
```

For the test coverage:

```
yarn coverage
```

### Code of conduct

This project and everyone participating in it are governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please read the [full text](./CODE_OF_CONDUCT.md) so that you can read which actions may or may not be tolerated.

## Legal notice

All content in these repositories including code has been provided by IBM under the associated open source software license and IBM is under no obligation to provide enhancements, updates, or support. IBM developers produced this code as an open source project (not as an IBM product), and IBM makes no assertions as to the level of quality nor security, and will not be maintaining this code going forward.

## 📖 Docs

Read all related document pages carefully to understand the Observer API architecture and limitations.

- [Overview](./docs/overview.md)

## Contributors

Special thanks to our contributors for helping us improve Bee Agent Framework.

<a href="https://github.com/i-am-bee/bee-observe-connector/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=i-am-bee/bee-observe-connector" />
</a>
