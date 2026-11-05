// Worker for test/worker.ts: run a query, report it, then end the way the
// main thread asks.
import { query } from "..";

self.onmessage = (event: MessageEvent) => {
  if (event.data === "exit") process.exit(0);
  self.close();
};
postMessage(String(query("SELECT 'worker'", "CSV")));
