import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, User } from 'lucide-react';
import { faceAPI } from '../services/api';

const FaceVerification: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; user_id?: number; confidence?: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setResult({ success: false, message: 'Unable to access camera' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `verification_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setResult({ success: false, message: 'Please select or capture an image' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Default headers for tenant context
      const headers = {
        'X-Org-Id': 'default',
        'X-Branch-Code': 'main-branch',
        'X-Device-Code': 'web-client',
        'X-API-Key': 'replace_with_long_random_service_key'
      };

      const response = await faceAPI.verify(selectedFile, headers);
      
      setResult({ 
        success: true, 
        message: `Face verified successfully!`,
        user_id: response.data.matched_user_id,
        confidence: response.data.confidence
      });
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error.response?.data?.detail || 'Face verification failed' 
      });
    } finally {
      setLoading(false);
      stopCamera();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Face Verification</h2>
        <p className="text-gray-600">Verify identity using face recognition</p>
      </div>

      <div className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Upload or Capture Image
          </label>
          
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {/* Camera Capture */}
            <div className="space-y-4">
              <button
                onClick={isCapturing ? stopCamera : startCamera}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Camera className="h-5 w-5" />
                <span>{isCapturing ? 'Stop Camera' : 'Start Camera'}</span>
              </button>

              {isCapturing && (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md rounded-lg border"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={captureImage}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Capture Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Image */}
        {selectedFile && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selected Image
            </label>
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Selected for verification"
                className="w-64 h-64 object-cover rounded-lg border"
              />
              <button
                onClick={() => setSelectedFile(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-md ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {result.success ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
              <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Verification Successful' : 'Verification Failed'}
              </span>
            </div>
            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message}
            </p>
            {result.success && result.user_id && (
              <div className="mt-3 p-3 bg-white rounded border">
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="h-4 w-4" />
                  <span className="font-medium">User ID: {result.user_id}</span>
                </div>
                {result.confidence && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Confidence: </span>
                    <span className="font-medium text-green-600">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedFile}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify Face'}
        </button>
      </div>
    </div>
  );
};

export default FaceVerification;
