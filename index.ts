import { dlopen, FFIType, suffix, CString, ptr } from "bun:ffi";

const path = `lib/libchdb_bun.${suffix}`;

const { symbols: chdb } = dlopen(path, {
  Execute: {
    args: [FFIType.cstring, FFIType.cstring],
    returns: FFIType.cstring,
  },
  ExecuteSession: {
    args: [FFIType.cstring, FFIType.cstring, FFIType.cstring],
    returns: FFIType.cstring,
  },
});

class db {
  format: string;
  path: string;
  query(query: string, format: string = "CSV") {
    if (!query) {
      return "";
    }
    return chdb.Execute(Buffer.from(query + "\0"), Buffer.from(format + "\0"));
  }
  session(query: string, format: string = "CSV", path: string = "/tmp") {
    if (!query) return "";
    return chdb.ExecuteSession(
      Buffer.from(query + "\0"),
      Buffer.from(format + "\0"),
      Buffer.from(path + "\0")
    );
  }
  constructor(format: string = "JSONCompact", path: string = ".") {
    this.format = format;
    this.path = path;
  }
}

export { chdb, db };
