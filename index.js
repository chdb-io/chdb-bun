
import { dlopen, FFIType, suffix, CString, ptr } from "bun:ffi";
const path = `lib/libchdb_bun.${suffix}`;
const { symbols: chdb, } = dlopen(path, {
    Execute: {
      args: [FFIType.cstring, FFIType.cstring],
      returns:FFIType.cstring,
    },
  },
);

export function Execute(query, format){
  if (!format) format = "CSV";
  if (!query) return "";
  return chdb.Execute(Buffer.from(query+"\0"), Buffer.from(format+"\0"));
}
