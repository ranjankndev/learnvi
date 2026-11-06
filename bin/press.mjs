#!/usr/bin/env node
// Entry point: runs the TypeScript CLI through tsx, no build step needed.
import { register } from "tsx/esm/api";
register();
await import("../src/cli/press.ts");
