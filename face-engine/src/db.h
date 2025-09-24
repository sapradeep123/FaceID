#pragma once
#include <sqlite3.h>
#include <string>
#include <vector>

namespace fe {

class DB {
public:
    DB();
    ~DB();
    bool open(const std::string& path);
    bool init();
    bool enroll(const std::string& personId, const std::vector<float>& emb);
    bool bestMatch(const std::vector<float>& emb, std::string& outPerson, float& outScore);
private:
    sqlite3* conn_{};
};

}


