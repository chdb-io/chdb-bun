// Run with `bun run test/worker.ts` from the repository root, after
// `bun run build`. A Worker that uses chdb-bun and ends must not stop the
// engine for the main thread.
import { query } from "..";

function check(label: string, got: unknown, want: string) {
  const text = got === null ? "null" : String(got);
  if (text !== want) {
    console.error(`${label}: got ${JSON.stringify(text)}, want ${JSON.stringify(want)}`);
    process.exit(1);
  }
  console.log(`${label}: ok`);
}

check("main thread before the workers", query("SELECT 1", "CSV"), "1\n");
for (const end of ["close", "exit"]) {
  const worker = new Worker(new URL("./worker-child.ts", import.meta.url).href);
  const ended = new Promise((resolve) => worker.addEventListener("close", resolve));
  const reply = await new Promise((resolve) => {
    worker.onmessage = (event) => resolve(event.data);
  });
  check(`worker that will call ${end}()`, reply, '"worker"\n');
  worker.postMessage(end);
  await ended;
  check(`main thread after a worker called ${end}()`, query("SELECT 2", "CSV"), "2\n");
}
