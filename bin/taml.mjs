#!/usr/bin/env node

// npm's executable shim invokes this stable, packaged entry point. The compiled
// CLI owns argument parsing and receives process.argv unchanged.
import "../dist/cli/index.js";
