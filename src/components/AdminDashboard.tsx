import React, { useState } from 'react';
import { Users, Shield, BarChart3, Settings, Eye, Camera, Activity, Database, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserManagement from './admin/UserManagement';
import SystemMonitoring from './admin/SystemMonitoring';
import Analytics from './admin/Analytics';
import BranchManagement from './admin/BranchManagement';
import DeviceManagement from './admin/DeviceManagement';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const adminTabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'branches', label: 'Branch Management', icon: Shield },
    { id: 'devices', label: 'Device Management', icon: Camera },
    { id: 'monitoring', label: 'System Monitoring', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">FaceID Admin</h1>
                  <p className="text-sm text-gray-500">System Administration</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Admin Dashboard
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
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
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'branches' && <BranchManagement />}
          {activeTab === 'devices' && <DeviceManagement />}
          {activeTab === 'monitoring' && <SystemMonitoring />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
};

// Simple settings component
const AdminSettings: React.FC = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">API Configuration</h3>
        <p className="text-gray-600">Configure API endpoints and authentication settings.</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Face Recognition Settings</h3>
        <p className="text-gray-600">Adjust recognition thresholds and model parameters.</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
        <p className="text-gray-600">Manage security policies and access controls.</p>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
