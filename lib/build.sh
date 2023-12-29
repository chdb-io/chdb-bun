#!/bin/bash

if [ "$(uname)" == "Darwin" ]; then
    clang -O3 -dynamiclib -o chdb_bun.so -L. -lchdb chdb_bun.c 
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    clang -O3 -shared -fPIC -o chdb_bun.so -L. -lchdb chdb_bun.c
else
    echo "Unsupported operating system"
    exit 1
fi

mv chdb_bun.so ../chdb_bun.so
mv libchdb.so ../libchdb.so