<a href="https://chdb.fly.dev" target="_blank">
  <img src="https://user-images.githubusercontent.com/1423657/236688026-812c5d02-ddcc-4726-baf8-c7fe804c0046.png" width=130 />
  <img src="https://user-images.githubusercontent.com/1423657/236928733-43e4f74e-5cff-4b3f-8bb7-20df58e10829.png" height=120 />
</a>

# chdb-bun
[chDB](https://github.com/auxten/chdb) FFI bindings for [bun.sh](https://bun.sh)
### Status

- experimental, unstable, subject to changes
- requires [`libchdb.so`](https://github.com/metrico/libchdb/releases) on the system
- requires `gcc` 

#### Build binding
```
cd lib
gcc -shared -fPIC -o libchdb_bun.so libchdb_bun.c -lchdb
```

#### Usage
```
import { Execute } from '.';
var results = Execute("SELECT version()", "CSV");
console.log(results);
```

