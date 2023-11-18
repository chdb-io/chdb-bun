import { dlopen, FFIType, suffix, CString, ptr } from "bun:ffi";

const path = `lib/libchdb_bun.${suffix}`;

const { symbols: chdb, } = dlopen(path, {
    Execute: {
      args: [FFIType.cstring, FFIType.cstring],
      returns:FFIType.cstring,
    },
    ExecuteSession: {
      args: [FFIType.cstring, FFIType.cstring, FFIType.cstring],
      returns:FFIType.cstring,
    },
  },
);

function db(format, path) {
  this.format = format || 'JSONCompact';
  this.path = path || '.';
  this.query = function(query, format){
  	if (!query) return "";
  	if (!format) format = "CSV";
  	return chdb.Execute(Buffer.from(query+"\0"), Buffer.from(format+"\0"));
  }.bind(this);
  this.session = function(query, format, path) {
  	if (!query) return "";
  	if (!format) format = "CSV";
  	if (!path) path = "/tmp";
  	return chdb.ExecuteSession(Buffer.from(query+"\0"), Buffer.from(format+"\0"), Buffer.from(path+"\0"));
  }.bind(this);
  return this;
}

export { chdb, db };
