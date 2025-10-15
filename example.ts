import { query, Session } from ".";

// Create a new session instance
const session = new Session("./chdb-bun-tmp");
var result;

// Test standalone query
result = query("SELECT version(), 'Hello chDB', chdb()", "CSV");
console.log(result); // "25.5.2.1","Hello chDB","3.6.0"

// Test session query
session.query("CREATE FUNCTION IF NOT EXISTS hello AS () -> 'chDB'", "CSV");
result = session.query("SELECT hello()", "CSV");
console.log(result); //"chDB"

// Clean up the session
session.cleanup();
