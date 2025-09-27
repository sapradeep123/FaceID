import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, User, Mail, Phone, CreditCard } from 'lucide-react';
import { faceAPI, userAPI } from '../services/api';

const FaceVerification: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; user_id?: number; confidence?: number; user_details?: any } | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera resources on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraLoading(false);
            setIsCapturing(true);
          }).catch(console.error);
        };
        
        videoRef.current.onplaying = () => {
          setCameraLoading(false);
          setIsCapturing(true);
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setCameraLoading(false);
          setResult({ success: false, message: 'Camera stream error. Please try again.' });
        };
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setCameraLoading(false);
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else {
        errorMessage += 'Please check permissions and try again.';
      }
      
      setResult({ success: false, message: errorMessage });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setCameraLoading(false);
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
      const headers = {
        'X-Org-Id': 'default',
        'X-Branch-Code': 'main-branch',
        'X-Device-Code': 'web-client',
        'X-API-Key': 'change_me'
      };

      const response = await faceAPI.verify(selectedFile, headers);
      
      // Fetch user details
      let userDetails = null;
      try {
        const userResponse = await userAPI.getUser(response.data.matched_user_id);
        userDetails = userResponse.data;
      } catch (userError) {
        console.error('Failed to fetch user details:', userError);
      }
      
      setResult({ 
        success: true, 
        message: `Face verified successfully! Welcome ${userDetails?.full_name || 'User'}!`,
        user_id: response.data.matched_user_id,
        confidence: response.data.confidence,
        user_details: userDetails
      });
    } catch (error: any) {
      console.error('Face verification error:', error);
      let errorMessage = 'Face verification failed';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setResult({ 
        success: false, 
        message: errorMessage
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Upload or Capture Image
          </label>
          
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={isCapturing ? stopCamera : startCamera}
                disabled={cameraLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  isCapturing 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Camera className="h-5 w-5" />
                <span>{cameraLoading ? 'Starting Camera...' : isCapturing ? 'Stop Camera' : 'Start Camera'}</span>
              </button>

              {(isCapturing || cameraLoading) && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-w-md h-64 object-cover rounded-lg border-2 border-gray-300 bg-gray-100"
                      style={{ minHeight: '256px' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {cameraLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg bg-opacity-90">
                        <div className="text-center">
                          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                          <p className="text-gray-500">Camera starting...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={captureImage}
                    disabled={!videoRef.current?.srcObject}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Capture Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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
              <div className="mt-3 p-4 bg-white rounded-lg border shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  User Details
                </h4>
                
                {result.user_details && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{result.user_details.full_name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{result.user_details.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>User ID: {result.user_id}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Registered: {new Date(result.user_details.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                {result.confidence && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Verification Confidence:</span>
                      <span className="font-medium text-green-600">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
