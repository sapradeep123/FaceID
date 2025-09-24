add_library(facecore STATIC
    embedding.cpp
    embedding.h
    db.cpp
    db.h
)

target_include_directories(facecore PUBLIC ${OpenCV_INCLUDE_DIRS})
target_link_libraries(facecore PUBLIC ${OpenCV_LIBS} sqlite3::sqlite3)

add_executable(face_engine_server main.cpp)
target_link_libraries(face_engine_server PRIVATE facecore Crow::Crow)

