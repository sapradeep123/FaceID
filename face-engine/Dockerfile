# Build stage
FROM ubuntu:22.04 AS build
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y build-essential cmake python3 python3-pip git pkg-config libopencv-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN bash scripts/build_linux.sh

# Runtime stage
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y libopencv-core4.5 libopencv-imgproc4.5 libopencv-imgcodecs4.5 sqlite3 && rm -rf /var/lib/apt/lists/*
WORKDIR /srv
COPY --from=build /app/build/src/face_engine_server /usr/local/bin/face_engine_server
ENV DB_PATH=/srv/face.db COSINE_THRESH=0.5 PORT=9000
EXPOSE 9000
CMD ["/usr/local/bin/face_engine_server"]

