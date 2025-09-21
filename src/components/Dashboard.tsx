import React, { useState } from 'react';
import { Camera, Upload, Shield, LogOut, User, Settings, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FaceEnrollment from './FaceEnrollment';
import FaceVerification from './FaceVerification';
import LivenessDetection from './LivenessDetection';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('enrollment');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const tabs = [
    { id: 'enrollment', label: 'Face Enrollment', icon: Upload },
    { id: 'verification', label: 'Face Verification', icon: Camera },
    { id: 'liveness', label: 'Liveness Check', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">FaceID Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">Welcome back!</span>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
                title="Admin Dashboard"
              >
                <Crown className="h-4 w-4" />
                <span>Admin</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'enrollment' && <FaceEnrollment />}
          {activeTab === 'verification' && <FaceVerification />}
          {activeTab === 'liveness' && <LivenessDetection />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
