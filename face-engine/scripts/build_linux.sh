#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p build && cd build
conan install .. --build=missing -of conanbuild
cmake -DCMAKE_TOOLCHAIN_FILE=conanbuild/conan_toolchain.cmake ..
cmake --build . -j
ctest --output-on-failure || true

