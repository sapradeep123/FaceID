import React, { useState, useRef } from 'react';
import { Camera, Shield, CheckCircle, AlertCircle, Eye, RotateCcw } from 'lucide-react';
import { livenessAPI } from '../services/api';

const LivenessDetection: React.FC = () => {
  const [challenge, setChallenge] = useState<string | null>(null);
  const [frameA, setFrameA] = useState<File | null>(null);
  const [frameB, setFrameB] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturingFrame, setCapturingFrame] = useState<'A' | 'B' | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; user_id?: number; confidence?: number } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const challengeInstructions = {
    turn_left: { text: 'Turn your head to the left', icon: RotateCcw },
    turn_right: { text: 'Turn your head to the right', icon: RotateCcw },
    blink: { text: 'Blink your eyes', icon: Eye },
    open_mouth: { text: 'Open your mouth', icon: Shield },
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
    setIsCapturing(false);
    setCapturingFrame(null);
  };

  const captureFrame = (frameType: 'A' | 'B') => {
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
            const file = new File([blob], `frame_${frameType.toLowerCase()}_${Date.now()}.jpg`, { type: 'image/jpeg' });
            if (frameType === 'A') {
              setFrameA(file);
            } else {
              setFrameB(file);
            }
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const getChallenge = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const headers = {
        'X-Org-Id': 'default',
        'X-Branch-Code': 'main-branch',
        'X-Device-Code': 'web-client',
        'X-API-Key': 'replace_with_long_random_service_key'
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
        'X-API-Key': 'replace_with_long_random_service_key'
      };

      const response = await livenessAPI.verify(
        challenge,
        frameA,
        frameB,
        null, // uid_hint
        headers
      );
      
      setResult({ 
        success: response.data.ok, 
        message: response.data.ok ? 'Liveness verification successful!' : 'Liveness verification failed',
        user_id: response.data.user_id,
        confidence: response.data.confidence
      });
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error.response?.data?.detail || 'Liveness verification failed' 
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
        {/* Challenge Section */}
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

        {/* Camera Section */}
        {challenge && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Capture Frames</h3>
              <button
                onClick={isCapturing ? stopCamera : startCamera}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Camera className="h-5 w-5" />
                <span>{isCapturing ? 'Stop Camera' : 'Start Camera'}</span>
              </button>
            </div>

            {isCapturing && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md rounded-lg border mx-auto block"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setCapturingFrame('A');
                      captureFrame('A');
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                      frameA ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Camera className="h-5 w-5" />
                    <span>Capture Frame A {frameA && '(✓)'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setCapturingFrame('B');
                      captureFrame('B');
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                      frameB ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-600 text-white hover:bg-blue-700'
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

        {/* Frame Previews */}
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

        {/* Result */}
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
              <div className="mt-3 p-3 bg-white rounded border">
                <div className="text-gray-700">
                  <div className="font-medium">User ID: {result.user_id}</div>
                  {result.confidence && (
                    <div className="mt-1">
                      <span className="text-sm text-gray-600">Confidence: </span>
                      <span className="font-medium text-green-600">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
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
