import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, X, User, Users, Search, Plus, Eye, Calendar, Image } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { faceAPI, userAPI } from '../services/api';
import ImageGallery from './ImageGallery';

interface FaceEnrollmentModernProps {
  selectedUserId?: number;
  onEnrollmentComplete?: () => void;
}

const FaceEnrollmentModern: React.FC<FaceEnrollmentModernProps> = ({ 
  selectedUserId, 
  onEnrollmentComplete 
}) => {
  const [enrollmentType, setEnrollmentType] = useState<'passport' | 'live'>('passport');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSavedImages, setShowSavedImages] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Set selected user if provided
  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [selectedUserId, users]);

  // Cleanup camera resources on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setResult(null);
    setSelectedFiles([]);
    setCapturedImages([]);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toString().includes(searchTerm)
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setResult(null);
  };

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      setCameraLoading(true);
      setCameraReady(false);
      setResult(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      console.log('Camera stream obtained:', stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('Setting video source...');
        videoRef.current.srcObject = stream;
        
        // Set up event handlers
        const video = videoRef.current;
        
        const handleVideoReady = () => {
          console.log('Video ready, setting states...');
          setCameraLoading(false);
          setCameraReady(true);
        };
        
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting to play...');
          video.play().then(() => {
            console.log('Video started playing successfully');
            handleVideoReady();
          }).catch((err) => {
            console.error('Error starting video playback:', err);
            // Try again after a short delay
            setTimeout(() => {
              video.play().then(() => {
                console.log('Retry: Video started playing successfully');
                handleVideoReady();
              }).catch(() => {
                setCameraLoading(false);
                setResult({ success: false, message: `Video playback failed: ${err.message}` });
              });
            }, 100);
          });
        };
        
        video.onplaying = () => {
          console.log('Video is playing');
          handleVideoReady();
        };
        
        video.oncanplay = () => {
          console.log('Video can play');
          handleVideoReady();
        };
        
        video.oncanplaythrough = () => {
          console.log('Video can play through');
          handleVideoReady();
        };
        
        video.onerror = (e) => {
          console.error('Video error:', e);
          setCameraLoading(false);
          setResult({ success: false, message: 'Camera stream error. Please try again.' });
        };
        
        // Force load the video
        video.load();
        
        // Multiple fallback attempts
        const attemptPlay = (attempt: number) => {
          setTimeout(() => {
            if (video && cameraLoading && streamRef.current) {
              console.log(`Fallback attempt ${attempt}: forcing video play...`);
              video.srcObject = stream; // Ensure stream is assigned
              video.play().then(() => {
                console.log(`Fallback attempt ${attempt}: Video started playing successfully`);
                handleVideoReady();
              }).catch((error) => {
                console.error(`Fallback attempt ${attempt}: Error playing video:`, error);
                if (attempt < 3) {
                  attemptPlay(attempt + 1);
                } else {
                  setCameraLoading(false);
                }
              });
            }
          }, attempt * 1000);
        };
        
        // Start fallback attempts
        attemptPlay(1);
      }
      
      setIsCapturing(true);
      console.log('Camera setup complete');
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access in your browser and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints not supported. Trying with basic settings...';
        // Try with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = basicStream;
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            videoRef.current.play();
          }
          setIsCapturing(true);
          setCameraLoading(false);
          setCameraReady(true);
          return;
        } catch (basicError) {
          errorMessage += ' Even basic camera access failed.';
        }
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      setResult({ success: false, message: errorMessage });
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setCameraReady(false);
    setCameraLoading(false);
  };

  const restartCamera = async () => {
    console.log('Restarting camera...');
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
    await startCamera();
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
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

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setResult({ success: false, message: 'Please select a user first' });
      return;
    }

    if (selectedFiles.length === 0) {
      setResult({ success: false, message: 'Please select or capture images' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Use the selected user's ID for enrollment
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create a temporary API instance with the user's token
      const tempApi = faceAPI;
      
      const headers = {
        'X-Org-Id': selectedUser.org_id || 'default',
        'X-Branch-Code': 'main-branch',
        'X-Device-Code': 'web-client',
        'X-API-Key': 'change_me',
        'Authorization': `Bearer ${token}`
      };

      let response;
      if (enrollmentType === 'passport') {
        response = await tempApi.enrollPassport(selectedFiles[0], headers);
      } else {
        response = await tempApi.enrollLive(selectedFiles, headers);
      }

      setResult({ 
        success: true, 
        message: `Successfully enrolled ${response.data.embeddings_added} face(s) for ${selectedUser.full_name || selectedUser.email}` 
      });
      
      setSelectedFiles([]);
      setCapturedImages([]);
      
      // Refresh user data
      await loadUsers();
      
      // Notify parent component
      if (onEnrollmentComplete) {
        onEnrollmentComplete();
      }
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
      stopCamera();
    }
  };

  return (
    <div className="space-y-6">
      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Face Enrollment Management
          </CardTitle>
          <CardDescription>
            Select a user to enroll faces or manage existing enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Actions */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
                <Button onClick={() => setShowUserModal(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New User
                </Button>
                {selectedUser && (
                  <Button 
                    onClick={() => setShowSavedImages(!showSavedImages)} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Image className="h-4 w-4" />
                    {showSavedImages ? 'Hide' : 'View'} Saved Images
                  </Button>
                )}
          </div>

          {/* Users Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Face Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user.face_count > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {user.face_count} faces
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            No faces
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserSelect(user);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No users found matching your search.' : 'No users available.'}
              </div>
            )}
          </div>
        </CardContent>
          </Card>

          {/* Saved Images Gallery */}
          {selectedUser && showSavedImages && (
            <ImageGallery 
              userId={selectedUser.id}
              onImageDeleted={() => {
                // Refresh user data after image deletion
                loadUsers();
              }}
            />
          )}

          {selectedUser && (
        <>
          {/* Enrollment Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Type</CardTitle>
              <CardDescription>
                Choose how you want to capture the face data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={enrollmentType === 'passport' ? 'default' : 'outline'}
                  onClick={() => setEnrollmentType('passport')}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Passport Photo
                </Button>
                <Button
                  variant={enrollmentType === 'live' ? 'default' : 'outline'}
                  onClick={() => setEnrollmentType('live')}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Live Capture
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Image Capture/Upload */}
          <Card>
            <CardHeader>
              <CardTitle>
                {enrollmentType === 'passport' ? 'Upload Passport Photo' : 'Upload or Capture Images'}
              </CardTitle>
              <CardDescription>
                {enrollmentType === 'passport' 
                  ? 'Upload a single high-quality passport photo'
                  : 'Upload multiple images or use live camera capture'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={enrollmentType === 'live'}
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Live Camera Capture */}
              {enrollmentType === 'live' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={isCapturing ? stopCamera : startCamera}
                      variant={isCapturing ? 'destructive' : 'default'}
                      className="flex items-center gap-2"
                      disabled={cameraLoading}
                    >
                      <Camera className="h-4 w-4" />
                      {cameraLoading ? 'Starting Camera...' : (isCapturing ? 'Stop Camera' : 'Start Camera')}
                    </Button>
                    {isCapturing && !cameraReady && (
                      <Button
                        onClick={() => {
                          if (videoRef.current && streamRef.current) {
                            console.log('Emergency fix: forcing video display...');
                            videoRef.current.srcObject = streamRef.current;
                            videoRef.current.play().then(() => {
                              setCameraLoading(false);
                              setCameraReady(true);
                            });
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Fix Video
                      </Button>
                    )}
                  </div>

                  {isCapturing && (
                    <div className="space-y-4">
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full max-w-md h-64 object-cover rounded-lg border-2 border-gray-300 bg-gray-100"
                          style={{ 
                            minHeight: '256px', 
                            display: isCapturing ? 'block' : 'none',
                            backgroundColor: '#f0f0f0'
                          }}
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        {cameraLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                            <div className="text-center">
                              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500">Camera starting...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={captureImage}
                        className="flex items-center gap-2"
                        disabled={!cameraReady}
                      >
                        <Camera className="h-4 w-4" />
                        Capture Image
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Images Preview */}
          {selectedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Images ({selectedFiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={capturedImages[index] || URL.createObjectURL(file)}
                        alt={`Selected ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        onClick={() => removeImage(index)}
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result Message */}
          {result && (
            <Card>
              <CardContent className="pt-6">
                <div className={`flex items-center gap-2 p-4 rounded-md ${
                  result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  <span>{result.message}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedFiles.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? 'Enrolling...' : 'Enroll Face'}
          </Button>
        </>
      )}

      {/* New User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const userData = {
                email: formData.get('email') as string,
                full_name: formData.get('full_name') as string,
                password: formData.get('password') as string,
                org_id: 'default',
                branch_code: 'main-branch'
              };
              
              try {
                const response = await userAPI.createUser(userData);
                await loadUsers();
                setSelectedUser(response.data);
                setShowUserModal(false);
                setResult({ success: true, message: 'User created successfully!' });
              } catch (error: any) {
                console.error('User creation error:', error);
                let errorMessage = 'Failed to create user';
                
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
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  name="full_name"
                  type="text"
                  required
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  name="password"
                  type="password"
                  required
                  placeholder="Enter password"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceEnrollmentModern;
