import { db, chdb } from '.';

const conn = new db('CSV', '/tmp')
var result;

// Test query
result = conn.query("SELECT version(), chdb()");
console.log(result)

// Test session
conn.session("CREATE FUNCTION IF NOT EXISTS hello AS () -> 'chDB'");
result = conn.session("SELECT hello()", "CSV");
console.log(result)
