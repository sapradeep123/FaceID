import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { faceAPI } from '../services/api';
import ImageGallery from './ImageGallery';

const FaceEnrollment: React.FC = () => {
  const [enrollmentType, setEnrollmentType] = useState<'passport' | 'live'>('passport');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    aadhar: ''
  });
  const [showSavedImages, setShowSavedImages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
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
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setResult(null);
  };

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setResult(null);
      
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        throw new Error('Camera access requires HTTPS. Please access the application via HTTPS or use localhost for development.');
      }
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

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
        
        // Wait for the video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting to play...');
          videoRef.current?.play().then(() => {
            console.log('Video started playing successfully');
            setCameraLoading(false);
            setIsCapturing(true);
          }).catch((error) => {
            console.error('Error playing video:', error);
            setCameraLoading(false);
            setResult({ success: false, message: 'Failed to start camera video stream' });
          });
        };
        
        // Add additional event handlers for debugging
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };
        
        videoRef.current.onplaying = () => {
          console.log('Video is playing');
          setCameraLoading(false);
          setIsCapturing(true);
        };
        
        // Handle video loading errors
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setCameraLoading(false);
          setResult({ success: false, message: 'Camera stream error. Please try again.' });
        };
        
        // Fallback: try to play immediately and set up a timeout
        setTimeout(() => {
          if (videoRef.current && !isCapturing && cameraLoading) {
            console.log('Fallback: attempting to play video...');
            videoRef.current.play().then(() => {
              console.log('Fallback: Video started playing successfully');
              setCameraLoading(false);
              setIsCapturing(true);
            }).catch((error) => {
              console.error('Fallback: Error playing video:', error);
            });
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setCameraLoading(false);
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
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

    // Show user form instead of directly enrolling
    setShowUserForm(true);
    stopCamera();
  };

  const handleUserFormSubmit = async () => {
    if (!userForm.full_name || !userForm.email) {
      setResult({ success: false, message: 'Please fill in Name and Email' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // First create user account
      const signupResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userForm.email,
          password: 'temp_password_123', // Generate a temporary password
          full_name: userForm.full_name,
          org_id: 'default',
          branch_code: 'main-branch'
        }),
      });

      if (!signupResponse.ok) {
        throw new Error('Failed to create user account');
      }

      const userData = await signupResponse.json();
      
      // Now enroll face with user ID
      const headers = {
        'X-Org-Id': 'default',
        'X-Branch-Code': 'main-branch',
        'X-Device-Code': 'web-client',
        'X-API-Key': 'change_me',
        'Authorization': `Bearer ${userData.access_token}`
      };

      let response;
      if (enrollmentType === 'passport') {
        response = await faceAPI.enrollPassport(selectedFiles[0], headers);
      } else {
        response = await faceAPI.enrollLive(selectedFiles, headers);
      }

      setResult({ 
        success: true, 
        message: `Successfully enrolled ${response.data.embeddings_added} face(s) for ${userForm.full_name}`
      });
      
      setCurrentUserId(response.data.user_id || null);
      
      // Reset form
      setSelectedFiles([]);
      setCapturedImages([]);
      setShowUserForm(false);
      setUserForm({ full_name: '', email: '', phone: '', aadhar: '' });
    } catch (error: any) {
      console.error('Enrollment error:', error);
      let errorMessage = 'Enrollment failed';
      
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
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Face Enrollment</h2>
        <p className="text-gray-600">Register your face for recognition</p>
      </div>

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

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {enrollmentType === 'passport' ? 'Upload Passport Photo' : 'Upload or Capture Images'}
        </label>
        
        <div className="space-y-4">
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

          {enrollmentType === 'live' && (
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
          )}
        </div>
      </div>

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

      {result && (
        <div className={`mb-6 p-4 rounded-md ${
          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{result.message}</span>
            </div>
            {result.success && currentUserId && (
              <button
                onClick={() => setShowSavedImages(!showSavedImages)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <Image className="h-4 w-4" />
                {showSavedImages ? 'Hide' : 'View'} Saved Images
              </button>
            )}
          </div>
        </div>
      )}

      {/* Saved Images Gallery */}
      {currentUserId && showSavedImages && (
        <div className="mb-6">
          <ImageGallery 
            userId={currentUserId}
            onImageDeleted={() => {
              // Optionally refresh or update state after deletion
            }}
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || selectedFiles.length === 0}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Continue to Registration'}
      </button>

      {/* User Registration Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Complete Your Registration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhar Card Number (Optional)
                </label>
                <input
                  type="text"
                  value={userForm.aadhar}
                  onChange={(e) => setUserForm({...userForm, aadhar: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter Aadhar number"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUserForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUserFormSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Enrolling...' : 'Complete Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceEnrollment;
