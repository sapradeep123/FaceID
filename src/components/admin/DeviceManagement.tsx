import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Camera, Wifi, WifiOff, Building, Search, Filter } from 'lucide-react';

interface Device {
  id: number;
  branch_id: number;
  device_code: string;
  device_name?: string;
  active: boolean;
  last_seen?: string;
  ip_address?: string;
  location?: string;
  created_at: string;
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);

  // Mock data
  useEffect(() => {
    const mockDevices: Device[] = [
      {
        id: 1,
        branch_id: 1,
        device_code: 'DEV-001',
        device_name: 'Main Entrance Kiosk',
        active: true,
        last_seen: '2024-01-20T14:30:00Z',
        ip_address: '192.168.1.100',
        location: 'Main Lobby',
        created_at: '2024-01-10T10:00:00Z'
      },
      {
        id: 2,
        branch_id: 1,
        device_code: 'DEV-002',
        device_name: 'Office Reception',
        active: true,
        last_seen: '2024-01-20T14:25:00Z',
        ip_address: '192.168.1.101',
        location: 'Reception Area',
        created_at: '2024-01-10T10:30:00Z'
      },
      {
        id: 3,
        branch_id: 2,
        device_code: 'DEV-003',
        device_name: 'North Office Terminal',
        active: false,
        last_seen: '2024-01-19T16:45:00Z',
        ip_address: '192.168.2.100',
        location: 'North Office',
        created_at: '2024-01-12T14:00:00Z'
      },
      {
        id: 4,
        branch_id: 3,
        device_code: 'DEV-004',
        device_name: 'Campus Gate 1',
        active: true,
        last_seen: '2024-01-20T14:35:00Z',
        ip_address: '192.168.3.100',
        location: 'Main Gate',
        created_at: '2024-01-08T09:00:00Z'
      }
    ];

    setTimeout(() => {
      setDevices(mockDevices);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.ip_address?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && device.active) ||
                         (statusFilter === 'inactive' && !device.active);
    return matchesSearch && matchesStatus;
  });

  const handleToggleDevice = (deviceId: number) => {
    setDevices(devices.map(device => 
      device.id === deviceId ? { ...device, active: !device.active } : device
    ));
  };

  const handleDeleteDevice = (deviceId: number) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      setDevices(devices.filter(device => device.id !== deviceId));
    }
  };

  const handleSelectDevice = (deviceId: number) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedDevices.length === 0) return;

    const message = action === 'delete' 
      ? `Are you sure you want to delete ${selectedDevices.length} device(s)?`
      : `Are you sure you want to ${action} ${selectedDevices.length} device(s)?`;

    if (window.confirm(message)) {
      if (action === 'delete') {
        setDevices(devices.filter(device => !selectedDevices.includes(device.id)));
      } else {
        setDevices(devices.map(device => 
          selectedDevices.includes(device.id) 
            ? { ...device, active: action === 'activate' }
            : device
        ));
      }
      setSelectedDevices([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
          <p className="text-gray-600">Manage FaceID devices and terminals</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          <span>Add Device</span>
        </button>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Devices</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <div className="flex space-x-2">
            {selectedDevices.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  Activate ({selectedDevices.length})
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
                >
                  Deactivate ({selectedDevices.length})
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  Delete ({selectedDevices.length})
                </button>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            {filteredDevices.length} device(s) found
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDevices(filteredDevices.map(d => d.id));
                      } else {
                        setSelectedDevices([]);
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.id)}
                      onChange={() => handleSelectDevice(device.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Camera className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {device.device_name || 'Unnamed Device'}
                        </div>
                        <div className="text-sm text-gray-500">{device.device_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {device.active ? (
                        <Wifi className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {device.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      {device.location || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.last_seen ? formatDate(device.last_seen) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.ip_address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleDevice(device.id)}
                        className={`px-2 py-1 text-xs rounded-md ${
                          device.active 
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {device.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Device"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Camera className="h-full w-full" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No devices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search criteria.' : 'Get started by adding a new device.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;
