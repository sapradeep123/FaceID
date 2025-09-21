import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { faceAPI } from '../services/api';

const FaceEnrollment: React.FC = () => {
  const [enrollmentType, setEnrollmentType] = useState<'passport' | 'live'>('passport');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setResult(null);
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
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFiles(prev => [...prev, file]);
            
            const imageUrl = canvas.toDataURL();
            setCapturedImages(prev => [...prev, imageUrl]);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setResult({ success: false, message: 'Please select or capture images' });
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

      let response;
      if (enrollmentType === 'passport') {
        response = await faceAPI.enrollPassport(selectedFiles[0], headers);
      } else {
        response = await faceAPI.enrollLive(selectedFiles, headers);
      }

      setResult({ 
        success: true, 
        message: `Successfully enrolled ${response.data.embeddings_added} face(s)` 
      });
      setSelectedFiles([]);
      setCapturedImages([]);
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error.response?.data?.detail || 'Enrollment failed' 
      });
    } finally {
      setLoading(false);
      stopCamera();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Face Enrollment</h2>
        <p className="text-gray-600">Register your face for recognition</p>
      </div>

      {/* Enrollment Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Enrollment Type
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => setEnrollmentType('passport')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md border ${
              enrollmentType === 'passport'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span>Passport Photo</span>
          </button>
          <button
            onClick={() => setEnrollmentType('live')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md border ${
              enrollmentType === 'live'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Camera className="h-5 w-5" />
            <span>Live Capture</span>
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {enrollmentType === 'passport' ? 'Upload Passport Photo' : 'Upload or Capture Images'}
        </label>
        
        <div className="space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={enrollmentType === 'live'}
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {/* Live Capture */}
          {enrollmentType === 'live' && (
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
          )}
        </div>
      </div>

      {/* Preview Images */}
      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Selected Images ({selectedFiles.length})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={capturedImages[index] || URL.createObjectURL(file)}
                  alt={`Selected ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  onClick={() => {
                    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                    setCapturedImages(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mb-6 p-4 rounded-md flex items-center space-x-2 ${
          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{result.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || selectedFiles.length === 0}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enrolling...' : 'Enroll Face'}
      </button>
    </div>
  );
};

export default FaceEnrollment;
