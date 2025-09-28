import React, { useState, useRef, useEffect } from 'react';
import { Camera, Shield, CheckCircle, AlertCircle, Eye, RotateCcw, User, Mail, Clock } from 'lucide-react';
import { livenessAPI, userAPI } from '../services/api';

const LivenessDetection: React.FC = () => {
  const [challenge, setChallenge] = useState<string | null>(null);
  const [frameA, setFrameA] = useState<File | null>(null);
  const [frameB, setFrameB] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  // const [capturingFrame, setCapturingFrame] = useState<'A' | 'B' | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; user_id?: number; confidence?: number; user_details?: any } | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<'idle' | 'frameA' | 'frameB' | 'complete'>('idle');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera resources on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, []);

  const challengeInstructions = {
    turn_left: { text: 'Turn your head to the left', icon: RotateCcw },
    turn_right: { text: 'Turn your head to the right', icon: RotateCcw },
    blink: { text: 'Blink your eyes', icon: Eye },
    open_mouth: { text: 'Open your mouth', icon: Shield },
  } as const;

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
        
        videoRef.current.onerror = (e: string | Event) => {
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
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    // setCapturingFrame(null);
    setCameraLoading(false);
    setCurrentStep('idle');
    setCountdown(null);
  };

  const startCountdown = (frameType: 'A' | 'B', callback: () => void) => {
    setCountdown(3);
    setCurrentStep(frameType === 'A' ? 'frameA' : 'frameB');
    
    const timer = setInterval(() => {
      setCountdown((prev: number | null) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          callback();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureFrame = (frameType: 'A' | 'B') => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const file = new File([blob], `frame_${frameType.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' });
            if (frameType === 'A') {
              setFrameA(file);
              setCurrentStep('frameB');
            } else {
              setFrameB(file);
              setCurrentStep('complete');
            }
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const captureFrameWithCountdown = (frameType: 'A' | 'B') => {
    startCountdown(frameType, () => {
      captureFrame(frameType);
    });
  };

  const getChallenge = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const headers = {
        'X-Org-Id': 'default',
        'X-Branch-Code': 'main-branch',
        'X-Device-Code': 'web-client',
        'X-API-Key': '3netra_faceid_internal_api_key_2024_production'
      };

      const response = await livenessAPI.getChallenge(headers);
      setChallenge(response.data.challenge);
      setFrameA(null);
      setFrameB(null);
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error.response?.data?.detail || 'Failed to get challenge' 
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyLiveness = async () => {
    if (!frameA || !frameB || !challenge) {
      setResult({ success: false, message: 'Please capture both frames and ensure challenge is set' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const headers = {
        'X-Org-Id': 'default',
        'X-Branch-Code': 'main-branch',
        'X-Device-Code': 'web-client',
        'X-API-Key': '3netra_faceid_internal_api_key_2024_production'
      };

      const response = await livenessAPI.verify(
        challenge,
        frameA,
        frameB,
        null, // uid_hint
        headers
      );
      
      // Fetch user details if verification successful
      let userDetails = null;
      if (response.data.ok && response.data.user_id) {
        try {
          const userResponse = await userAPI.getUser(response.data.user_id);
          userDetails = userResponse.data;
        } catch (userError) {
          console.error('Failed to fetch user details:', userError);
        }
      }
      
      setResult({ 
        success: response.data.ok, 
        message: response.data.ok ? `Liveness verification successful! Welcome ${userDetails?.full_name || 'User'}!` : 'Liveness verification failed',
        user_id: response.data.user_id,
        confidence: response.data.confidence,
        user_details: userDetails
      });
    } catch (error: any) {
      console.error('Liveness verification error:', error);
      let errorMessage = 'Liveness verification failed';
      
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Liveness Detection</h2>
        <p className="text-gray-600">Prove you're a real person with live interaction</p>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Challenge</h3>
              {challenge ? (
                <div className="flex items-center space-x-2 mt-2">
                  {React.createElement(challengeInstructions[challenge as keyof typeof challengeInstructions]?.icon || Shield, { className: "h-5 w-5 text-blue-600" })}
                  <span className="text-blue-700">
                    {challengeInstructions[challenge as keyof typeof challengeInstructions]?.text || challenge}
                  </span>
                </div>
              ) : (
                <p className="text-blue-700 mt-2">No challenge yet</p>
              )}
            </div>
            <button
              onClick={getChallenge}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Getting Challenge...' : 'Get Challenge'}
            </button>
          </div>
        </div>

        {challenge && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Capture Frames</h3>
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
            </div>

            {(isCapturing || cameraLoading) && (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-w-md h-64 object-cover rounded-lg border-2 border-gray-300 bg-gray-100 mx-auto block"
                    style={{ minHeight: '256px' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera loading overlay */}
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg bg-opacity-90">
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                        <p className="text-gray-500">Camera starting...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Countdown overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="text-center text-white">
                        <div className="text-6xl font-bold mb-2">{countdown}</div>
                        <p className="text-lg">
                          {currentStep === 'frameA' ? 'Get ready for Frame A...' : 'Get ready for Frame B...'}
                        </p>
                        <p className="text-sm mt-2">
                          {challengeInstructions[challenge as keyof typeof challengeInstructions]?.text || challenge}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Progress indicator */}
                <div className="flex justify-center space-x-4 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    frameA ? 'bg-green-500 text-white' : currentStep === 'frameA' ? 'bg-blue-500 text-white' : 'bg-gray-300'
                  }`}>
                    {frameA ? '✓' : 'A'}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    frameB ? 'bg-green-500 text-white' : currentStep === 'frameB' ? 'bg-blue-500 text-white' : 'bg-gray-300'
                  }`}>
                    {frameB ? '✓' : 'B'}
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => captureFrameWithCountdown('A')}
                    disabled={!!frameA || countdown !== null || cameraLoading}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-md ${
                      frameA 
                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed' 
                        : countdown !== null || cameraLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Camera className="h-5 w-5" />
                    <span>Capture Frame A {frameA && '(✓)'}</span>
                  </button>
                  
                  <button
                    onClick={() => captureFrameWithCountdown('B')}
                    disabled={!frameA || !!frameB || countdown !== null || cameraLoading}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-md ${
                      frameB 
                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed'
                        : !frameA || countdown !== null || cameraLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Camera className="h-5 w-5" />
                    <span>Capture Frame B {frameB && '(✓)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {(frameA || frameB) && (
          <div className="grid grid-cols-2 gap-4">
            {frameA && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Frame A</h4>
                <img
                  src={URL.createObjectURL(frameA)}
                  alt="Frame A"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
            {frameB && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Frame B</h4>
                <img
                  src={URL.createObjectURL(frameB)}
                  alt="Frame B"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-md ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {result.success ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
              <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Liveness Verified' : 'Liveness Failed'}
              </span>
            </div>
            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message}
            </p>
            {result.success && result.user_id && (
              <div className="mt-3 p-4 bg-white rounded-lg border shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Liveness Verified - User Details
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
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span>User ID: {result.user_id}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>Registered: {new Date(result.user_details.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {result.confidence && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Liveness Confidence:</span>
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
          onClick={verifyLiveness}
          disabled={loading || !frameA || !frameB || !challenge}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify Liveness'}
        </button>
      </div>
    </div>
  );
};

export default LivenessDetection;
