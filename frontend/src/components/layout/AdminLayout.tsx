import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import UserManagementModern from '../admin/UserManagementModern';
import FaceEnrollmentModern from '../FaceEnrollmentModern';
import ImageManagement from '../admin/ImageManagement';
import BranchManagement from '../admin/BranchManagement';
import DeviceManagement from '../admin/DeviceManagement';
import SystemMonitoring from '../admin/SystemMonitoring';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  onLogout,
  userName,
  userEmail
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('users');
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();

  // Handle URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    const userId = urlParams.get('userId');
    
    if (section) {
      setActiveSection(section);
    }
    
    if (userId) {
      setSelectedUserId(parseInt(userId));
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagementModern />;
      case 'face-enrollment':
        return <FaceEnrollmentModern selectedUserId={selectedUserId} onEnrollmentComplete={() => {
          // Optionally refresh user data or navigate back
          setSelectedUserId(undefined);
        }} />;
      case 'image-management':
        return <ImageManagement />;
      case 'branches':
        return <BranchManagement />;
      case 'devices':
        return <DeviceManagement />;
      case 'monitoring':
        return <SystemMonitoring />;
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analytics</h2>
              <p className="text-gray-600">Advanced analytics and reporting coming soon...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h2>
              <p className="text-gray-600">System configuration and settings coming soon...</p>
            </div>
          </div>
        );
      default:
        return <UserManagementModern />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        isSidebarCollapsed ? "ml-0" : "ml-0"
      )}>
        {/* Top Navigation */}
        <TopNavbar
          onLogout={onLogout}
          userName={userName}
          userEmail={userEmail}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
