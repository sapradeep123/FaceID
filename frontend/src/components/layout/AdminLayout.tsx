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
import { useBranding, saveBranding, loadBranding, Branding, useApplyBranding } from '../../lib/branding';

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
  const { branding } = useBranding();
  useApplyBranding();

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
            <BrandingSettings />
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

// Inline component to edit branding settings
const BrandingSettings: React.FC = () => {
  const [form, setForm] = useState<Branding>(loadBranding());
  const [logoPreview, setLogoPreview] = useState<string | undefined>(form.logoUrl);

  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : undefined;
      setForm(prev => ({ ...prev, logoUrl: url }));
      setLogoPreview(url);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    saveBranding(form);
    alert('Branding updated.');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Branding</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
          <input
            value={form.appName}
            onChange={e => setForm({ ...form, appName: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            placeholder="e.g., FaceID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Browser Title</label>
          <input
            value={form.pageTitle || ''}
            onChange={e => setForm({ ...form, pageTitle: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            placeholder="e.g., My Company – FaceID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
          <input
            value={form.adminName}
            onChange={e => setForm({ ...form, adminName: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            placeholder="e.g., FaceID Admin"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo Initials (fallback)</label>
          <input
            value={form.logoText}
            onChange={e => setForm({ ...form, logoText: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            placeholder="e.g., FI"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => onFile(e.target.files?.[0] || null)}
          />
          {logoPreview && (
            <img src={logoPreview} alt="preview" className="mt-2 h-12 w-12 rounded object-cover" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => {
                const url = typeof r.result === 'string' ? r.result : undefined;
                setForm(prev => ({ ...prev, faviconUrl: url }));
              };
              r.readAsDataURL(f);
            }}
          />
        </div>
        <button onClick={save} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
      </div>
    </div>
  );
};

