add_executable(face_engine_tests tests.cpp)
target_link_libraries(face_engine_tests PRIVATE facecore Catch2::Catch2WithMain)
add_test(NAME face_engine_tests COMMAND face_engine_tests)

