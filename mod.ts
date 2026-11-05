import { isMainThread } from "node:worker_threads";

const path = "chdb_bun.so";

const { symbols: chdb } = Deno.dlopen(path, {
  Query: {
    parameters: ["buffer", "buffer"],
    result: "buffer",
  },
  QuerySession: {
    parameters: ["buffer", "buffer", "buffer"],
    result: "buffer",
  },
  CloseSession: {
    parameters: ["buffer"],
    result: "void",
  },
  CloseConnection: {
    parameters: [],
    result: "void",
  },
  Shutdown: {
    parameters: [],
    result: "void",
  },
});

// Only the main thread stops the engine: a Worker dispatches "unload" when it
// calls Deno.exit(), and chdb_shutdown() is final for the whole process.
// node:worker_threads reports a Web Worker as the main thread, so also rule
// out WorkerGlobalScope.
const onMainThread = isMainThread && !("WorkerGlobalScope" in globalThis);

if (onMainThread) {
  // libchdb must not be left running when the process exits: its own
  // exit-time teardown of an open engine can crash. Deno dispatches "unload"
  // before it exits, also on Deno.exit().
  globalThis.addEventListener("unload", () => chdb.Shutdown());

  // On an uncaught error or unhandled rejection Deno exits without "unload"
  // and unloads the library with the engine still open, which hangs or
  // crashes while MergeTree merges run. Close the connection first. Do not
  // stop the engine for good: a later listener can handle the error and keep
  // the program running, and its next query then opens a new connection.
  const closeOnError = (event: Event) => {
    if (!event.defaultPrevented) chdb.CloseConnection();
  };
  globalThis.addEventListener("error", closeOnError);
  globalThis.addEventListener("unhandledrejection", closeOnError);
}

const enc = new TextEncoder();
// Standalone exported query function
export function query(query: string, format: string = "CSV") {
  if (!query) {
    return "";
  }
  const result = chdb.Query(
    enc.encode(query + "\0"),
    enc.encode(format + "\0"),
  );
  if (result == null) {
    return "";
  }
  return new Deno.UnsafePointerView(result).getCString();
}

// Session class with path handling
class Session {
  path: string;
  isTemp: boolean;

  query(query: string, format: string = "CSV") {
    if (!query) return "";
    const result = chdb.QuerySession(
      enc.encode(query + "\0"),
      enc.encode(format + "\0"),
      enc.encode(this.path + "\0"),
    );
    if (result == null) {
      return "";
    }
    return new Deno.UnsafePointerView(result).getCString();
  }

  constructor(path: string = "") {
    if (path === "") {
      // Create a temporary directory
      this.path = Deno.makeTempDirSync();
      this.isTemp = true;
    } else {
      this.path = path;
      this.isTemp = false;
    }
  }

  // Cleanup method to delete the temporary directory
  cleanup() {
    // Close the session's connection before removing its data directory
    chdb.CloseSession(enc.encode(this.path + "\0"));
    Deno.removeSync(this.path, { recursive: true });
  }
}

export { chdb, Session };
