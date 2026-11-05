// Run with `deno run --unstable-ffi -A test/worker.deno.ts` from the
// repository root. A Worker that uses chdb-bun and ends must not stop the
// engine for the main thread.
import { query } from "../mod.ts";

function check(label: string, got: string, want: string) {
  if (got !== want) {
    console.error(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    Deno.exit(1);
  }
  console.log(`${label}: ok`);
}

check("main thread before the worker", query("SELECT 1", "CSV"), "1\n");
const worker = new Worker(new URL("./worker-child.deno.ts", import.meta.url).href, {
  type: "module",
});
const reply = await new Promise<string>((resolve) => {
  worker.onmessage = (event) => resolve(event.data);
});
check("worker", reply, '"worker"\n');
worker.postMessage("exit");
// A Web Worker has no event for having ended; give it time to run its exit.
await new Promise((resolve) => setTimeout(resolve, 1000));
worker.terminate();
check("main thread after the worker called Deno.exit()", query("SELECT 2", "CSV"), "2\n");
