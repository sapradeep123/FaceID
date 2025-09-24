#pragma once
#include <opencv2/opencv.hpp>
#include <vector>

namespace fe {

// Simple placeholder embedding using color histogram + HOG; replace with ONNX model later.
std::vector<float> encodeEmbedding(const cv::Mat &bgr);

float cosine(const std::vector<float>& a, const std::vector<float>& b);

}


