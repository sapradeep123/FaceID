#include "embedding.h"
#include <numeric>

namespace fe {

static void l2norm(std::vector<float>& v) {
    float s = 0.f; for (float x : v) s += x*x; s = std::sqrt(s) + 1e-9f;
    for (float &x : v) x /= s;
}

std::vector<float> encodeEmbedding(const cv::Mat &bgr) {
    cv::Mat img; bgr.copyTo(img);
    if (img.empty()) return {};
    cv::Mat gray; cv::cvtColor(img, gray, cv::COLOR_BGR2GRAY);
    // Histogram (32 bins)
    int histSize = 32; float range[] = {0, 256}; const float* ranges[] = {range};
    cv::Mat hist; cv::calcHist(&gray, 1, 0, cv::Mat(), hist, 1, &histSize, ranges);
    std::vector<float> feat(histSize);
    for (int i=0;i<histSize;++i) feat[i] = static_cast<float>(hist.at<float>(i));
    // HOG descriptor (very short)
    cv::Mat resized; cv::resize(gray, resized, cv::Size(64,64));
    cv::HOGDescriptor hog(cv::Size(64,64), cv::Size(16,16), cv::Size(8,8), cv::Size(8,8), 9);
    std::vector<float> hogv; hog.compute(resized, hogv);
    // Concatenate
    feat.insert(feat.end(), hogv.begin(), hogv.begin() + std::min<size_t>(hogv.size(), 128));
    l2norm(feat);
    return feat;
}

float cosine(const std::vector<float>& a, const std::vector<float>& b) {
    if (a.empty() || b.empty() || a.size()!=b.size()) return 0.f;
    float dot=0.f;
    for (size_t i=0;i<a.size();++i) dot += a[i]*b[i];
    return dot;
}

}


