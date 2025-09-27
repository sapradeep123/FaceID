import React from 'react';
import ImageGallery from '../ImageGallery';

const ImageManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <ImageGallery showUserInfo={true} />
    </div>
  );
};

export default ImageManagement;
