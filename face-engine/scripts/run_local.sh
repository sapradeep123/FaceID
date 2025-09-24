#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export DB_PATH=${DB_PATH:-./face.db}
export COSINE_THRESH=${COSINE_THRESH:-0.5}
export PORT=${PORT:-9000}

./build/src/face_engine_server

