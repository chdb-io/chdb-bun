import { cc, FFIType, CString } from "bun:ffi";
import { rmdirSync, mkdtempSync } from "fs";
import source from "./lib/chdb_bun.c" with { type: "file" };

const { symbols: chdb } = cc({
  source,
  library: ["chdb"],
  flags: ["-L./lib"],
  symbols: {
    Query: {
      args: [FFIType.cstring, FFIType.cstring],
      returns: FFIType.ptr,
    },
    QuerySession: {
      args: [FFIType.cstring, FFIType.cstring, FFIType.cstring],
      returns: FFIType.ptr,
    },
    free_cstr: {
      args: [FFIType.ptr],
      returns: FFIType.void,
    }
  }
}); 

// Standalone exported query function
export function query(query: string, format: string = "CSV") {
  if (!query) return "";
  const resultPtr = chdb.Query(Buffer.from(query + "\0"), Buffer.from(format + "\0"));
  if (resultPtr === null) return "";
  try {
    return new CString(resultPtr).toString();
  } finally {
    chdb.free_cstr(resultPtr);
  }
}

// Session class with path handling
class Session {
  path: string;
  isTemp: boolean;

  query(query: string, format: string = "CSV") {
    if (!query) return "";
    const resultPtr = chdb.QuerySession(
      Buffer.from(query + "\0"),
      Buffer.from(format + "\0"),
      Buffer.from(this.path + "\0")
    );
    if (resultPtr === null) return "";
    try {
      return new CString(resultPtr).toString();
    } finally {
      chdb.free_cstr(resultPtr);
    }
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
