"use strict";

const bindings = {
  "darwin-arm64": "@typeyaml/core-darwin-arm64",
  "darwin-x64": "@typeyaml/core-darwin-x64",
  "linux-x64": "@typeyaml/core-linux-x64-gnu",
  "win32-x64": "@typeyaml/core-win32-x64-msvc"
};
const packageName = bindings[`${process.platform}-${process.arch}`];
if (!packageName) throw new Error(`typeYAML native core does not support ${process.platform}-${process.arch}`);
module.exports = require(packageName);
