# Contributing

This package allows you to easily join the [**Bee Agent Framework**](https://github.com/i-am-bee/bee-agent-framework) and [**Bee Observe**](https://github.com/i-am-bee/bee-observe) with the one exported function.
This page describes how you can join the Bee community in this goal.

## Before you start

If you are new to Bee contributing, we recommend you do the following before diving into the code:

- Read [Bee Overview](./docs/overview.md) to understand core concepts.
- Read [Code of Conduct](./CODE_OF_CONDUCT.md).

## Choose an issue to work on

Bee uses the following labels to help non-maintainers find issues best suited to their interests and experience level:

- [good first issue](https://github.com/i-am-bee/bee-observe-connector/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) - these issues are typically the simplest available to work on, ideal for newcomers. They should already be fully scoped, with a straightforward approach outlined in the descriptions.
- [help wanted](https://github.com/i-am-bee/bee-observe-connector/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) - these issues are generally more complex than good first issues. They typically cover work that core maintainers don't currently have the capacity to implement and may require more investigation/discussion. These are great options for experienced contributors looking for something more challenging.

## Set up a development environment

To start contributing to the Bee Observe, follow these steps to set up your development environment:

1.  **Install Node Version Manager (NVM):** We use `.nvmrc` to specify the required Node.js version. Install [nvm](https://github.com/nvm-sh/nvm) by following the official installation instructions.

2.  **Install the Correct Node.js Version:** Use `nvm` to install and use the Node.js version specified in the `.nvmrc` file:

```bash
nvm install
nvm use
```

3. **Install [Yarn](https://yarnpkg.com/) via Corepack:** This project uses Yarn as the package manager. Ensure you have Corepack enabled and install Yarn:

```bash
corepack enable
```

4.  **Install Dependencies:** Install all project dependencies by running:

```bash
yarn install
```

5.  **Follow Conventional Commit Messages:** We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) to structure our commit messages. This helps maintain a clean and manageable commit history. Please use the following format:

```
<type>(<scope>): <subject>
Type: feat, fix, chore, docs, style, refactor, perf, test, etc.
Scope: The area of the codebase your changes affect (optional).
Subject: A short description of the changes (required).
```

_Example:_

```
feat(framework): add version to the trace request

Refs: #13
```

6.  **Run Linters/Formatters:** Ensure your changes meet code quality standards. Run the following commands:

```shell
yarn lint # or yarn lint:fix
yarn format # or yarn lint:format
```

7.  **Run Tests:** Ensure your changes pass all tests. Run the following commands:

```shell
## unit tests
yarn test:unit

## e2e tests
yarn start:infra # run the Observe API and all necessary services
yarn test:e2e
```

By following these steps, you'll be all set to contribute to our project! If you encounter any issues during the setup process, please feel free to open an issue.

## Style and lint

Bee uses the following tools to meet code quality standards and ensure a unified code style across the codebase.

- [ESLint](https://eslint.org/) - Linting Utility
- [Prettier](https://prettier.io/) - Code Formatter
- [commitlint](https://commitlint.js.org/) - Lint commit messages according to [Conventional Commits](https://www.conventionalcommits.org/).

## Issues and pull requests

We use GitHub pull requests to accept contributions.

While not required, opening a new issue about the bug you're fixing or the feature you're working on before you open a pull request is important in starting a discussion with the community about your work. The issue gives us a place to talk about the idea and how we can work together to implement it in the code. It also lets the community know what you're working on, and if you need help, you can reference the issue when discussing it with other community and team members.
If you've written some code but need help finishing it, want to get initial feedback on it before finishing it, or want to share it and discuss it prior to completing the implementation, you can open a Draft pull request and prepend the title with the [WIP] tag (for Work In Progress). This will indicate to reviewers that the code in the PR isn't in its final state and will change. It also means we will only merge the commit once it is finished. You or a reviewer can remove the [WIP] tag when the code is ready to be thoroughly reviewed for merging.

## Legal

The following sections detail important legal information that should be viewed prior to contribution.

### License and Copyright

Distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

SPDX-License-Identifier: [Apache-2.0](https://spdx.org/licenses/Apache-2.0)

If you would like to see the detailed LICENSE click [here](LICENSE).

### Developer Certificate of Origin (DCO)

We have tried to make it as easy as possible to make contributions. This applies to how we handle the legal aspects of
contribution. We use the same approach - the
[Developer's Certificate of Origin 1.1 (DCO)](https://developercertificate.org/) - that the Linux® Kernel
[community](https://docs.kernel.org/process/submitting-patches.html#sign-your-work-the-developer-s-certificate-of-origin)
uses to manage code contributions.

We ask that when submitting a patch for review, the developer must include a sign-off statement in the commit message.
If you set your `user.name` and `user.email` in your `git config` file, you can sign your commit automatically by using
the following command:

```shell
git commit -s
```

The following example includes a `Signed-off-by:` line, which indicates that the submitter has accepted the DCO:

```text
Signed-off-by: John Doe <john.doe@example.com>
```

We automatically verify that all commit messages contain a `Signed-off-by:` line with your email address.

#### Useful tools for doing DCO signoffs

There are a number of tools that make it easier for developers to manage DCO signoffs.

- DCO command line tool, which let's you do a single signoff for an entire repo ( <https://github.com/coderanger/dco> )
- Firefox - <https://addons.mozilla.org/en-US/firefox/addon/scott-rigby/?src=search>
