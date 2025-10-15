
#!/bin/bash

# Get the newest release version
LATEST_RELEASE=$(curl --silent "https://api.github.com/repos/chdb-io/chdb/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

# Download the correct version based on the platform
OS_NAME="$(uname -s)"
echo "Detected OS: $OS_NAME"

case "$OS_NAME" in
    Linux*)
        if [[ $(uname -m) == "aarch64" ]]; then
            PLATFORM="linux-aarch64-libchdb.tar.gz"
        else
            PLATFORM="linux-x86_64-libchdb.tar.gz"
        fi
        LIB_SUFFIX="so"
        ;;
    Darwin*)
        if [[ $(uname -m) == "arm64" ]]; then
            PLATFORM="macos-arm64-libchdb.tar.gz"
        else
            PLATFORM="macos-x86_64-libchdb.tar.gz"
        fi
        LIB_SUFFIX="dylib"
        ;;
    *)
        echo "Unsupported platform: $OS_NAME"
        exit 1
        ;;
esac

DOWNLOAD_URL="https://github.com/chdb-io/chdb/releases/download/$LATEST_RELEASE/$PLATFORM"

echo "Downloading $PLATFORM from $DOWNLOAD_URL"

# Download the file
curl -L -o libchdb.tar.gz $DOWNLOAD_URL

# Untar the file
tar -xzf libchdb.tar.gz

# Rename the library file if needed (tarball always contains .so)
if [ -f "libchdb.so" ] && [ "$LIB_SUFFIX" = "dylib" ]; then
    mv libchdb.so libchdb.dylib
fi

# Set execute permission for the library file
chmod +x libchdb.$LIB_SUFFIX

# Clean up
rm -f libchdb.tar.gz
