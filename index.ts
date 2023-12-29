import { dlopen, FFIType } from "bun:ffi";
import { rmdirSync, mkdtempSync } from 'fs';

const path = `chdb_bun.so`;

const { symbols: chdb } = dlopen(path, {
  Query: {
    args: [FFIType.cstring, FFIType.cstring],
    returns: FFIType.cstring,
  },
  QuerySession: {
    args: [FFIType.cstring, FFIType.cstring, FFIType.cstring],
    returns: FFIType.cstring,
  },
});

// Standalone exported query function
export function query(query: string, format: string = "CSV") {
  if (!query) {
    return "";
  }
  return chdb.Query(Buffer.from(query + "\0"), Buffer.from(format + "\0"));
}

// Session class with path handling
class Session {
  path: string;
  isTemp: boolean;

  query(query: string, format: string = "CSV") {
    if (!query) return "";
    return chdb.QuerySession(
      Buffer.from(query + "\0"),
      Buffer.from(format + "\0"),
      Buffer.from(this.path + "\0")
    );
  }

  constructor(path: string = "") {
    if (path === "") {
      // Create a temporary directory
      this.path = mkdtempSync("tmp-");
      this.isTemp = true;
    } else {
      this.path = path;
      this.isTemp = false;
    }
  }

  // Cleanup method to delete the temporary directory
  cleanup() {
    rmdirSync(this.path, { recursive: true });
  }
}

export { chdb, Session };
