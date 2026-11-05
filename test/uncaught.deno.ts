// Run with `deno run --unstable-ffi -A test/uncaught.deno.ts KIND` from the
// repository root, KIND being throw, error or rejection. It must end with exit
// code 1 and print the error, not hang: an uncaught error while MergeTree
// merges ran left the engine open when Deno unloaded the library.
import { query, Session } from "../mod.ts";

// An error or rejection that a later listener handles leaves chdb-bun usable:
// the next query opens a new connection.
if (query("SELECT 1", "CSV") !== "1\n") throw new Error("first query failed");
for (const type of ["error", "unhandledrejection"]) {
  let handled = () => {};
  const wasHandled = new Promise<void>((resolve) => (handled = resolve));
  const handle = (event: Event) => {
    event.preventDefault();
    handled();
  };
  globalThis.addEventListener(type, handle);
  if (type === "error") {
    setTimeout(() => {
      throw new Error("handled on purpose");
    }, 0);
  } else {
    Promise.reject(new Error("handled on purpose"));
  }
  await wasHandled;
  globalThis.removeEventListener(type, handle);
  const after = query("SELECT 2", "CSV");
  if (after !== "2\n") {
    console.error(`query after a handled ${type}: got ${JSON.stringify(after)}`);
    Deno.exit(2);
  }
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
