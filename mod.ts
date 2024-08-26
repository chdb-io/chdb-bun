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
});

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
    Deno.removeSync(this.path, { recursive: true });
  }
}

export { chdb, Session };
