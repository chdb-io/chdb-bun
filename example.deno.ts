// Run with `deno run --unstable-ffi -A example.deno.ts`
import { query, Session } from "./mod.ts";

// Create a new session instance
const session = new Session("./chdb-bun-tmp");
let result;

// Test standalone query
result = query("SELECT version(), 'Hello chDB', chdb()", "CSV");
console.log(result);

// Test session query
session.query("CREATE FUNCTION IF NOT EXISTS hello AS () -> 'chDB'", "CSV");
result = session.query("SELECT hello()", "CSV");
console.log(result);

// Clean up the session
session.cleanup();
