#include "db.h"
#include <sstream>
#include <cstring>

namespace fe {

DB::DB() = default;
DB::~DB(){ if (conn_) sqlite3_close(conn_); }

bool DB::open(const std::string& path){
    return sqlite3_open(path.c_str(), &conn_) == SQLITE_OK;
}

bool DB::init(){
    const char* sql = "CREATE TABLE IF NOT EXISTS embeddings("
                      "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                      "person_id TEXT,"
                      "vec BLOB" );"";
    char* err=nullptr; int rc=sqlite3_exec(conn_, sql, nullptr, nullptr, &err);
    if (rc!=SQLITE_OK){ if (err) sqlite3_free(err); return false; }
    return true;
}

bool DB::enroll(const std::string& personId, const std::vector<float>& emb){
    if (!conn_) return false;
    sqlite3_stmt* st=nullptr;
    const char* ins="INSERT INTO embeddings(person_id, vec) VALUES(?, ?)";
    if (sqlite3_prepare_v2(conn_, ins, -1, &st, nullptr)!=SQLITE_OK) return false;
    sqlite3_bind_text(st, 1, personId.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_blob(st, 2, emb.data(), (int)(emb.size()*sizeof(float)), SQLITE_TRANSIENT);
    bool ok = sqlite3_step(st)==SQLITE_DONE;
    sqlite3_finalize(st);
    return ok;
}

bool DB::bestMatch(const std::vector<float>& emb, std::string& outPerson, float& outScore){
    if (!conn_) return false;
    sqlite3_stmt* st=nullptr;
    const char* sel="SELECT person_id, vec FROM embeddings";
    if (sqlite3_prepare_v2(conn_, sel, -1, &st, nullptr)!=SQLITE_OK) return false;
    outScore = -1.f; outPerson.clear();
    while (sqlite3_step(st)==SQLITE_ROW){
        const unsigned char* pid = sqlite3_column_text(st, 0);
        const void* blob = sqlite3_column_blob(st, 1);
        int blen = sqlite3_column_bytes(st, 1);
        std::vector<float> vec(blen/sizeof(float));
        std::memcpy(vec.data(), blob, blen);
        // simple cosine
        float dot=0.f; for (size_t i=0;i<vec.size() && i<emb.size();++i) dot += vec[i]*emb[i];
        if (dot>outScore){ outScore=dot; outPerson = (const char*)pid; }
    }
    sqlite3_finalize(st);
    return !outPerson.empty();
}

}


