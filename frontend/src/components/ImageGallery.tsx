import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Download, Calendar, User, Mail, X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { faceAPI, FaceImage } from '../services/api';

interface ImageGalleryProps {
  userId?: number;
  showUserInfo?: boolean;
  onImageDeleted?: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  userId, 
  showUserInfo = false, 
  onImageDeleted 
}) => {
  const [images, setImages] = useState<FaceImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<FaceImage | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    console.log('ImageGallery mounted with userId:', userId);
    loadImages();
  }, [userId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      console.log('Loading images for userId:', userId);
      let response;
      if (userId) {
        response = await faceAPI.getUserImages(userId);
        console.log('User images response:', response.data);
        setImages(response.data.images);
        setUserInfo({
          name: response.data.user_name,
          email: response.data.user_email
        });
      } else {
        response = await faceAPI.listAllImages();
        console.log('All images response:', response.data);
        setImages(response.data.images);
      }
    } catch (error: any) {
      console.error('Failed to load images:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = async (image: FaceImage) => {
    setSelectedImage(image);
    try {
      const response = await faceAPI.getImage(image.id);
      const blob = new Blob([response.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await faceAPI.deleteImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
      setShowDeleteConfirm(null);
      if (onImageDeleted) {
        onImageDeleted();
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      setShowDeleteConfirm(null);
    }
  };

  const handleDownloadImage = async (image: FaceImage) => {
    try {
      const response = await faceAPI.getImage(image.id);
      const blob = new Blob([response.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading images...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Saved Face Images
            {images.length > 0 && (
              <Badge variant="secondary">{images.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {userId && userInfo 
              ? `Face images for ${userInfo.name} (${userInfo.email})`
              : 'All saved face images in the system'
            }
          </CardDescription>
          <div className="flex gap-2 mt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadImages}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => console.log('Current state:', { userId, images: images.length, loading, userInfo })}
            >
              Debug Info
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No face images found</p>
              <p className="text-sm">Images will appear here after face enrollment</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      {!userId && showUserInfo && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {images.map((image) => (
                      <tr key={image.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                              <Eye className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>
                        </td>
                        {!userId && showUserInfo && (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                  <User className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {image.user_name || 'Unknown User'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {image.user_id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {image.user_email || 'N/A'}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {image.filename}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {image.id}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(image.size)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(image.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(image.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewImage(image)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                              title="View Image"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadImage(image)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-900 hover:bg-green-50"
                              title="Download Image"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowDeleteConfirm(image.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-900 hover:bg-red-50"
                              title="Delete Image"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      {selectedImage && imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedImage.filename}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeImageViewer}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={imageUrl}
                alt={selectedImage.filename}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Size: {formatFileSize(selectedImage.size)}</span>
                    <span>Uploaded: {new Date(selectedImage.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {selectedImage.user_name && (
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-gray-900 mb-2">Image Owner Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">User Name:</span>
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{selectedImage.user_name}</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Email:</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{selectedImage.user_email}</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">User ID:</span>
                        <div className="mt-1">
                          <Badge variant="outline">{selectedImage.user_id}</Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Image ID:</span>
                        <div className="mt-1">
                          <Badge variant="outline">{selectedImage.id}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadImage(selectedImage)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      closeImageViewer();
                      setShowDeleteConfirm(selectedImage.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold">Delete Image</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteImage(showDeleteConfirm)}
              >
                Delete Image
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
