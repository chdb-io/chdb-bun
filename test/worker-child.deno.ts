// Worker for test/worker.deno.ts: run a query, report it, then call
// Deno.exit() when the main thread asks.
import { query } from "../mod.ts";

self.onmessage = () => Deno.exit(0);
self.postMessage(query("SELECT 'worker'", "CSV"));
