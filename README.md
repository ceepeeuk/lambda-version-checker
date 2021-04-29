# lambda-version-checker

Outputs to the terminal a list of all lambdas and their respective version tags. Where the lambda does not have a version tag `not-set` is shown, if the lambda is not in the environment `unreleased` is shown.

Expects aws profiles to exist called `dev`, `test` and `prod`.

Until this is refactored as a global package, to run use `node src/index.js`
