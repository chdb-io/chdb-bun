// Run with `deno run --unstable-ffi -A test/uncaught.deno.ts KIND` from the
// repository root, KIND being throw, error or rejection. It must end with exit
// code 1 and print the error, not hang: an uncaught error while MergeTree
// merges ran left the engine open when Deno unloaded the library.
import { query, Session } from "../mod.ts";

// An error that a listener handles leaves chdb-bun usable.
if (query("SELECT 1", "CSV") !== "1\n") throw new Error("first query failed");
let handled = () => {};
const wasHandled = new Promise<void>((resolve) => (handled = resolve));
const handle = (event: PromiseRejectionEvent) => {
  event.preventDefault();
  handled();
};
globalThis.addEventListener("unhandledrejection", handle);
Promise.reject(new Error("handled on purpose"));
await wasHandled;
globalThis.removeEventListener("unhandledrejection", handle);
const after = query("SELECT 2", "CSV");
if (after !== "2\n") {
  console.error(`query after a handled rejection: got ${JSON.stringify(after)}`);
  Deno.exit(2);
}

// Many small inserts, so that merges run when the error ends the process.
const session = new Session();
session.query("CREATE TABLE t (x UInt64) ENGINE = MergeTree ORDER BY x", "CSV");
for (let i = 0; i < 200; i++) {
  session.query(`INSERT INTO t SELECT number FROM numbers(${i * 1000}, 1000)`, "CSV");
}
const kind = Deno.args[0];
if (kind === "throw") {
  throw new Error("uncaught on purpose");
} else if (kind === "error") {
  setTimeout(() => {
    throw new Error("uncaught on purpose");
  }, 0);
} else if (kind === "rejection") {
  Promise.reject(new Error("uncaught on purpose"));
} else {
  console.error(`unknown kind ${JSON.stringify(kind)}`);
  Deno.exit(2);
}
