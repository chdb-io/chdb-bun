<a href="https://chdb.fly.dev" target="_blank">
  <img src="https://avatars.githubusercontent.com/u/132536224" width=130 />
</a>

[![chDB-bun](https://github.com/chdb-io/chdb-bun/actions/workflows/bun-test.yml/badge.svg)](https://github.com/chdb-io/chdb-bun/actions/workflows/bun-test.yml)

# chdb-bun <img src="https://user-images.githubusercontent.com/1423657/236928733-43e4f74e-5cff-4b3f-8bb7-20df58e10829.png" height=20 />
Experimental [chDB](https://github.com/chdb-io/chdb) FFI bindings for the [bun runtime](https://bun.sh)
### Status

- experimental, unstable, subject to changes
- requires [`libchdb`](https://github.com/chdb-io/chdb) on the system

#### Build binding
```bash
bun run build
bun run example.ts
```

#### Usage

#### Query(query, *format) (ephemeral)
```javascript
import { query } from 'chdb-bun';

// Query (ephemeral)
var result = query("SELECT version(), 'Hello chDB', chdb()", "CSV");
console.log(result); // "25.5.2.1","Hello chDB","3.6.0"
```

#### Session.Query(query, *format)
```javascript
import { Session } from 'chdb-bun';
const session = new Session('./chdb-bun-tmp');

// Query Session (persistent)
session.query("CREATE FUNCTION IF NOT EXISTS hello AS () -> 'chDB'", "CSV");
var result = session.query("SELECT hello()", "CSV");
console.log(result); //"chDB"

// Before cleanup, you can find the database files in `./chdb-bun-tmp`

session.cleanup(); // cleanup session, this will delete the database
```

<br>
