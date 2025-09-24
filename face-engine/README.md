# Face Engine (C++ / Crow / OpenCV)

This service exposes REST endpoints for face encoding and comparison.

## Features
- POST /encode: image -> embedding (JSON array)
- POST /compare: {embedA, embedB} -> cosine/L2
- POST /enroll: image + personId -> stores embedding in SQLite
- POST /verify: image -> best match {personId, score, match}

## Build
- Requires Conan and CMake

```
cd face-engine
./scripts/build_linux.sh
./scripts/run_local.sh
```

## Docker
```
docker build -t face-engine .
```

## Config
Create a `.env` file or export environment variables:
```
DB_PATH=./face.db
COSINE_THRESH=0.5
PORT=9000
```
