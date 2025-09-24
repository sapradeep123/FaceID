#include <catch2/catch_all.hpp>
#include "../src/embedding.h"

TEST_CASE("cosine self is 1", "["){
    std::vector<float> v = {1,2,3};
    auto c = fe::cosine(v,v);
    REQUIRE(c > 0.999f);
}

