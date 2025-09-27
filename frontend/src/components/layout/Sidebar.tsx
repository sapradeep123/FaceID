import React from 'react';
import { 
  Users, 
  Building2, 
  Monitor, 
  BarChart3, 
  Settings, 
  Activity,
  Menu,
  X,
  Camera,
  Image
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

  const navigationItems = [
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
    },
    {
      id: 'face-enrollment',
      label: 'Face Enrollment',
      icon: Camera,
    },
    {
      id: 'image-management',
      label: 'Image Management',
      icon: Image,
    },
    {
      id: 'branches',
      label: 'Branch Management',
      icon: Building2,
    },
    {
      id: 'devices',
      label: 'Device Management',
      icon: Monitor,
    },
    {
      id: 'monitoring',
      label: 'System Monitoring',
      icon: Activity,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FI</span>
            </div>
            <span className="font-semibold text-gray-900">FaceID Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200",
                isActive
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-indigo-600" : "text-gray-400"
              )} />
              {!isCollapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 text-center">
              FaceID Admin Dashboard
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              v1.0.0
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
