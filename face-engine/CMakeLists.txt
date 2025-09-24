cmake_minimum_required(VERSION 3.20)
project(face_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Conan generated toolchain (optional)
include(${CMAKE_BINARY_DIR}/conanbuild/conan_toolchain.cmake OPTIONAL)

find_package(OpenCV REQUIRED)

add_subdirectory(src)
add_subdirectory(tests)

