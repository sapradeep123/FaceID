import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle } from 'lucide-react';

interface SystemStats {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_throughput: number;
  active_connections: number;
  api_requests_per_minute: number;
  face_recognition_accuracy: number;
  system_uptime: string;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  response_time: number;
  last_check: string;
}

const SystemMonitoring: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_throughput: 0,
    active_connections: 0,
    api_requests_per_minute: 0,
    face_recognition_accuracy: 0,
    system_uptime: '0d 0h 0m'
  });

  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, this would fetch from API
    const mockStats: SystemStats = {
      cpu_usage: 45.2,
      memory_usage: 67.8,
      disk_usage: 34.5,
      network_throughput: 125.6,
      active_connections: 42,
      api_requests_per_minute: 156,
      face_recognition_accuracy: 98.7,
      system_uptime: '15d 4h 23m'
    };

    const mockHealthChecks: HealthCheck[] = [
      {
        service: 'Face Recognition API',
        status: 'healthy',
        response_time: 245,
        last_check: '2024-01-20T14:30:00Z'
      },
      {
        service: 'PostgreSQL Database',
        status: 'healthy',
        response_time: 12,
        last_check: '2024-01-20T14:30:00Z'
      },
      {
        service: 'Liveness Detection',
        status: 'warning',
        response_time: 850,
        last_check: '2024-01-20T14:30:00Z'
      },
      {
        service: 'File Storage',
        status: 'healthy',
        response_time: 89,
        last_check: '2024-01-20T14:30:00Z'
      }
    ];

    setTimeout(() => {
      setStats(mockStats);
      setHealthChecks(mockHealthChecks);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
        <p className="text-gray-600">Real-time system performance and health metrics</p>
      </div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cpu className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cpu_usage}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${stats.cpu_usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">{stats.memory_usage}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${stats.memory_usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disk Usage</p>
              <p className="text-2xl font-bold text-gray-900">{stats.disk_usage}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full" 
                style={{ width: `${stats.disk_usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wifi className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Network</p>
              <p className="text-2xl font-bold text-gray-900">{stats.network_throughput} MB/s</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Server className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Connections</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_connections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Activity className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">API Requests/min</p>
              <p className="text-2xl font-bold text-gray-900">{stats.api_requests_per_minute}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recognition Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.face_recognition_accuracy}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Activity className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{stats.system_uptime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Checks */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Service Health Checks</h3>
          <p className="text-sm text-gray-600">Monitor the health of all system services</p>
        </div>
        <div className="divide-y divide-gray-200">
          {healthChecks.map((check, index) => (
            <div key={index} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${getStatusColor(check.status)}`}>
                  {getStatusIcon(check.status)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{check.service}</h4>
                  <p className="text-sm text-gray-500">
                    Last checked: {new Date(check.last_check).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {check.response_time}ms
                </p>
                <p className="text-xs text-gray-500">Response time</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;
