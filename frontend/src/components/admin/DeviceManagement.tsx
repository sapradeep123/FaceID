import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Monitor, Wifi, WifiOff, MapPin, Activity, Users, Camera } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface Device {
  id: number;
  branch_id: number;
  branch_name?: string;
  device_code: string;
  device_name?: string;
  active: boolean;
  last_seen?: string;
  location?: string;
  enrollments_today?: number;
  total_enrollments?: number;
  ip_address?: string;
  mac_address?: string;
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    branch_id: 1,
    device_code: '',
    device_name: '',
    location: '',
    ip_address: '',
    mac_address: ''
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockDevices: Device[] = [
        {
          id: 1,
          branch_id: 1,
          branch_name: 'Headquarters',
          device_code: 'DEV001',
          device_name: 'Main Entrance Kiosk',
          active: true,
          last_seen: '2024-01-27T10:30:00Z',
          location: 'Main Entrance',
          enrollments_today: 5,
          total_enrollments: 45,
          ip_address: '192.168.1.100',
          mac_address: 'AA:BB:CC:DD:EE:FF'
        },
        {
          id: 2,
          branch_id: 1,
          branch_name: 'Headquarters',
          device_code: 'DEV002',
          device_name: 'Reception Desk',
          active: true,
          last_seen: '2024-01-27T09:15:00Z',
          location: 'Reception Area',
          enrollments_today: 3,
          total_enrollments: 22,
          ip_address: '192.168.1.101',
          mac_address: 'AA:BB:CC:DD:EE:FE'
        },
        {
          id: 3,
          branch_id: 2,
          branch_name: 'Branch Office 1',
          device_code: 'DEV003',
          device_name: 'Branch Kiosk',
          active: false,
          last_seen: '2024-01-26T16:45:00Z',
          location: 'Branch Entrance',
          enrollments_today: 0,
          total_enrollments: 18,
          ip_address: '192.168.2.100',
          mac_address: 'AA:BB:CC:DD:EE:FD'
        }
      ];
      setDevices(mockDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Implement actual API call
      if (editingDevice) {
        // Update existing device
        setDevices(devices.map(d => 
          d.id === editingDevice.id 
            ? { ...d, ...formData, active: d.active }
            : d
        ));
      } else {
        // Create new device
        const newDevice: Device = {
          id: Date.now(),
          ...formData,
          active: true,
          last_seen: new Date().toISOString(),
          enrollments_today: 0,
          total_enrollments: 0
        };
        setDevices([...devices, newDevice]);
      }
      
      setShowModal(false);
      setEditingDevice(null);
      setFormData({
        branch_id: 1,
        device_code: '',
        device_name: '',
        location: '',
        ip_address: '',
        mac_address: ''
      });
    } catch (error) {
      console.error('Failed to save device:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      branch_id: device.branch_id,
      device_code: device.device_code,
      device_name: device.device_name || '',
      location: device.location || '',
      ip_address: device.ip_address || '',
      mac_address: device.mac_address || ''
    });
    setShowModal(true);
  };

  const handleDelete = (deviceId: number) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      setDevices(devices.filter(d => d.id !== deviceId));
    }
  };

  const toggleDeviceStatus = (deviceId: number) => {
    setDevices(devices.map(d => 
      d.id === deviceId ? { ...d, active: !d.active } : d
    ));
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && device.active) ||
                         (statusFilter === 'inactive' && !device.active);
    
    return matchesSearch && matchesStatus;
  });

  const activeDevices = devices.filter(d => d.active).length;
  const totalEnrollments = devices.reduce((sum, d) => sum + (d.total_enrollments || 0), 0);
  const todayEnrollments = devices.reduce((sum, d) => sum + (d.enrollments_today || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-600">Manage face recognition devices and their status</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Monitor className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Wifi className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">{activeDevices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{todayEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive
              </Button>
            </div>
            <Badge variant="secondary">{filteredDevices.length} devices</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                          <Monitor className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {device.device_name || 'Unnamed Device'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {device.device_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {device.branch_name || `Branch ${device.branch_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Badge variant={device.active ? 'default' : 'secondary'}>
                          {device.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleDeviceStatus(device.id)}
                          className="h-6 w-6 p-0"
                        >
                          {device.active ? 
                            <Wifi className="h-4 w-4 text-green-600" /> : 
                            <WifiOff className="h-4 w-4 text-gray-400" />
                          }
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {device.location || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{device.total_enrollments || 0}</div>
                        <div className="text-xs text-gray-500">
                          +{device.enrollments_today || 0} today
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.last_seen ? 
                        new Date(device.last_seen).toLocaleString() : 
                        'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(device)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(device.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-900"
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
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingDevice ? 'Edit Device' : 'Add New Device'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowModal(false);
                  setEditingDevice(null);
                  setFormData({
                    branch_id: 1,
                    device_code: '',
                    device_name: '',
                    location: '',
                    ip_address: '',
                    mac_address: ''
                  });
                }}
              >
                ×
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Code *
                </label>
                <Input
                  value={formData.device_code}
                  onChange={(e) => setFormData({...formData, device_code: e.target.value})}
                  placeholder="e.g., DEV001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name
                </label>
                <Input
                  value={formData.device_name}
                  onChange={(e) => setFormData({...formData, device_name: e.target.value})}
                  placeholder="e.g., Main Entrance Kiosk"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Main Entrance"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IP Address
                  </label>
                  <Input
                    value={formData.ip_address}
                    onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MAC Address
                  </label>
                  <Input
                    value={formData.mac_address}
                    onChange={(e) => setFormData({...formData, mac_address: e.target.value})}
                    placeholder="AA:BB:CC:DD:EE:FF"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDevice(null);
                    setFormData({
                      branch_id: 1,
                      device_code: '',
                      device_name: '',
                      location: '',
                      ip_address: '',
                      mac_address: ''
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : (editingDevice ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;