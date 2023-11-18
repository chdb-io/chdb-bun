<a href="https://chdb.fly.dev" target="_blank">
  <img src="https://avatars.githubusercontent.com/u/132536224" width=130 />
</a>

[![chDB-bun](https://github.com/metrico/chdb-bun/actions/workflows/bun-test.yml/badge.svg)](https://github.com/metrico/chdb-bun/actions/workflows/bun-test.yml)

# chdb-bun <img src="https://user-images.githubusercontent.com/1423657/236928733-43e4f74e-5cff-4b3f-8bb7-20df58e10829.png" height=20 />
Experimental [chDB](https://github.com/auxten/chdb) FFI bindings for the [bun runtime](https://bun.sh)
### Status

- experimental, unstable, subject to changes
- requires [`libchdb`](https://github.com/metrico/libchdb) on the system
- requires `gcc` 

#### Build binding
```bash
bun install chdb-bun
```

#### Usage

#### Query Constructor
```js
import { db } from 'chdb-bun';

const conn = new db('CSV')
console.log(conn.query("SELECT version()"));
```

#### Query _(query, *format)_
```javascript
import { db } from 'chdb-bun';
const conn = new db('CSV')

// Query (ephemeral)
var result = conn.query("SELECT version()", "CSV");
console.log(result) // 23.10.1.1
```

#### Session _(query, *format, *path)_
```javascript
import { db } from 'chdb-bun';
const conn = new db('CSV', '/tmp')

// Query Session (persistent)
conn.session("CREATE FUNCTION IF NOT EXISTS hello AS () -> 'chDB'");
result = conn.session("SELECT hello()", "CSV");
console.log(result)
```

> ⚠️ Sessions persist table data to disk. You can specify `path` to implement auto-cleanup strategies:
```javascript
const temperment = require("temperment");
const tmp = temperment.directory();
conn.session("CREATE FUNCTION IF NOT EXISTS hello AS () -> 'chDB'", "CSV", tmp)
var result =  = chdb.Session("SELECT hello();")
console.log(result) // chDB
tmp.cleanup.sync();
```

<br>
