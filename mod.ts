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
  Shutdown: {
    parameters: [],
    result: "void",
  },
});

// libchdb must not be left running when the process exits: its own exit-time
// teardown of an open engine can crash. Deno dispatches "unload" before it
// exits, also on Deno.exit(), but not on an uncaught error; the native glue
// covers that case.
globalThis.addEventListener("unload", () => chdb.Shutdown());

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
