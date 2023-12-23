if [ "$(uname)" == "Darwin" ]; then
    gcc -dynamiclib -o libchdb_bun.dylib -L. -lchdb libchdb_bun.c 
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    gcc -shared -fPIC -o libchdb_bun.so libchdb_bun.c -L. -lchdb
else
    echo "Unsupported operating system"
    exit 1
fi