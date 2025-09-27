import React, { useState, useEffect } from 'react';
import { Activity, Users, Camera, Clock, AlertTriangle, CheckCircle, Server, Database, Cpu, HardDrive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalEnrollments: number;
  todayEnrollments: number;
  totalDevices: number;
  activeDevices: number;
  totalBranches: number;
  systemUptime: string;
  lastBackup: string;
  databaseSize: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface ActivityLog {
  id: number;
  timestamp: string;
  type: 'enrollment' | 'verification' | 'liveness' | 'user' | 'device' | 'system';
  message: string;
  user_id?: number;
  user_name?: string;
  device_id?: string;
  status: 'success' | 'warning' | 'error';
}

const SystemMonitoring: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalEnrollments: 0,
    todayEnrollments: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalBranches: 0,
    systemUptime: '0 days',
    lastBackup: 'Never',
    databaseSize: '0 MB',
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0
  });

  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API calls
      const mockStats: SystemStats = {
        totalUsers: 25,
        activeUsers: 12,
        totalEnrollments: 156,
        todayEnrollments: 8,
        totalDevices: 5,
        activeDevices: 4,
        totalBranches: 3,
        systemUptime: '7 days, 12 hours',
        lastBackup: '2024-01-27T02:00:00Z',
        databaseSize: '245.6 MB',
        cpuUsage: 35,
        memoryUsage: 68,
        diskUsage: 42
      };

      const mockActivityLog: ActivityLog[] = [
        {
          id: 1,
          timestamp: '2024-01-27T10:30:00Z',
          type: 'enrollment',
          message: 'New face enrollment completed',
          user_id: 4,
          user_name: 'John Doe',
          device_id: 'DEV001',
          status: 'success'
        },
        {
          id: 2,
          timestamp: '2024-01-27T10:25:00Z',
          type: 'verification',
          message: 'Face verification successful',
          user_id: 2,
          user_name: 'Jane Smith',
          device_id: 'DEV002',
          status: 'success'
        },
        {
          id: 3,
          timestamp: '2024-01-27T10:20:00Z',
          type: 'device',
          message: 'Device DEV003 went offline',
          device_id: 'DEV003',
          status: 'warning'
        },
        {
          id: 4,
          timestamp: '2024-01-27T10:15:00Z',
          type: 'liveness',
          message: 'Liveness check failed',
          user_id: 5,
          user_name: 'Bob Johnson',
          device_id: 'DEV001',
          status: 'error'
        },
        {
          id: 5,
          timestamp: '2024-01-27T10:10:00Z',
          type: 'system',
          message: 'Database backup completed successfully',
          status: 'success'
        }
      ];

      setStats(mockStats);
      setActivityLog(mockActivityLog);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
      case 'verification':
      case 'liveness':
        return <Camera className="h-4 w-4 text-blue-600" />;
      case 'user':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'device':
        return <Server className="h-4 w-4 text-purple-600" />;
      case 'system':
        return <Database className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">Real-time system status and activity monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button 
            onClick={loadSystemData} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeUsers}/{stats.totalUsers}
                </p>
                <p className="text-xs text-gray-500">Active/Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.todayEnrollments}/{stats.totalEnrollments}
                </p>
                <p className="text-xs text-gray-500">Today/Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Devices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeDevices}/{stats.totalDevices}
                </p>
                <p className="text-xs text-gray-500">Active/Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.systemUptime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="h-5 w-5 text-blue-600" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span className="font-medium">{stats.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.cpuUsage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {stats.cpuUsage > 80 ? 'High usage detected' : 'Normal operation'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-600" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span className="font-medium">{stats.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.memoryUsage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {stats.memoryUsage > 85 ? 'Memory usage high' : 'Normal operation'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5 text-purple-600" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span className="font-medium">{stats.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.diskUsage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                Database: {stats.databaseSize}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Database Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database Size:</span>
                <span className="text-sm font-medium">{stats.databaseSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Backup:</span>
                <span className="text-sm font-medium">
                  {stats.lastBackup === 'Never' ? 'Never' : new Date(stats.lastBackup).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Branches:</span>
                <span className="text-sm font-medium">{stats.totalBranches}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Status:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Face Engine:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Real-time system activity and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLog.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2 mt-1">
                  {getTypeIcon(log.type)}
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{log.message}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {log.user_name && (
                      <span>User: {log.user_name}</span>
                    )}
                    {log.device_id && (
                      <span>Device: {log.device_id}</span>
                    )}
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitoring;