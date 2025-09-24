#include <crow.h>
#include <opencv2/opencv.hpp>
#include <fstream>
#include <cstdlib>
#include "embedding.h"
#include "db.h"

static std::vector<unsigned char> readBody(const crow::request& req){
    return std::vector<unsigned char>(req.body.begin(), req.body.end());
}

int main(){
    const char* dbPath = std::getenv("DB_PATH");
    const char* portEnv = std::getenv("PORT");
    float thresh = std::getenv("COSINE_THRESH") ? std::atof(std::getenv("COSINE_THRESH")) : 0.5f;
    int port = portEnv ? std::atoi(portEnv) : 9000;

    fe::DB db; db.open(dbPath?dbPath:"face.db"); db.init();

    crow::SimpleApp app;

    CROW_ROUTE(app, "/encode").methods(crow::HTTPMethod::Post)([&](const crow::request& req){
        auto buf = readBody(req);
        cv::Mat data(1, (int)buf.size(), CV_8U, (void*)buf.data());
        cv::Mat img = cv::imdecode(data, cv::IMREAD_COLOR);
        auto emb = fe::encodeEmbedding(img);
        crow::json::wvalue res;
        res["embedding"] = crow::json::wvalue::list(emb.begin(), emb.end());
        return crow::response(200, res);
    });

    CROW_ROUTE(app, "/compare").methods(crow::HTTPMethod::Post)([&](const crow::request& req){
        auto j = crow::json::load(req.body);
        if (!j || !j.has("embedA") || !j.has("embedB")) return crow::response(400);
        std::vector<float> a, b;
        for (auto& v : j["embedA"]) a.push_back((float)v.d());
        for (auto& v : j["embedB"]) b.push_back((float)v.d());
        float score = fe::cosine(a,b);
        crow::json::wvalue res; res["score"] = score; res["match"] = (score>=thresh);
        return crow::response(200, res);
    });

    CROW_ROUTE(app, "/enroll").methods(crow::HTTPMethod::Post)([&](const crow::request& req){
        auto personId = req.url_params.get("personId");
        if (!personId) return crow::response(400);
        auto buf = readBody(req);
        cv::Mat data(1, (int)buf.size(), CV_8U, (void*)buf.data());
        cv::Mat img = cv::imdecode(data, cv::IMREAD_COLOR);
        auto emb = fe::encodeEmbedding(img);
        bool ok = db.enroll(personId, emb);
        crow::json::wvalue res; res["ok"] = ok; res["id"] = personId; res["embedding_size"] = (int)emb.size();
        return crow::response(ok?200:500, res);
    });

    CROW_ROUTE(app, "/verify").methods(crow::HTTPMethod::Post)([&](const crow::request& req){
        auto buf = readBody(req);
        cv::Mat data(1, (int)buf.size(), CV_8U, (void*)buf.data());
        cv::Mat img = cv::imdecode(data, cv::IMREAD_COLOR);
        auto emb = fe::encodeEmbedding(img);
        std::string person; float score=0.f; bool found = db.bestMatch(emb, person, score);
        crow::json::wvalue res; res["match"] = (found && score>=thresh); res["score"]=score; res["personId"]=person;
        return crow::response(200, res);
    });

    app.port(port).multithreaded().run();
}


