import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Camera, Shield, Activity } from 'lucide-react';

interface AnalyticsData {
  daily_recognitions: { date: string; count: number }[];
  recognition_accuracy: { date: string; accuracy: number }[];
  user_activity: { hour: number; active_users: number }[];
  liveness_challenges: { challenge: string; success_rate: number }[];
  top_organizations: { org_id: string; user_count: number }[];
  system_performance: { metric: string; value: number; trend: 'up' | 'down' | 'stable' }[];
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    daily_recognitions: [],
    recognition_accuracy: [],
    user_activity: [],
    liveness_challenges: [],
    top_organizations: [],
    system_performance: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const mockData: AnalyticsData = {
      daily_recognitions: [
        { date: '2024-01-14', count: 45 },
        { date: '2024-01-15', count: 52 },
        { date: '2024-01-16', count: 38 },
        { date: '2024-01-17', count: 61 },
        { date: '2024-01-18', count: 49 },
        { date: '2024-01-19', count: 67 },
        { date: '2024-01-20', count: 73 }
      ],
      recognition_accuracy: [
        { date: '2024-01-14', accuracy: 98.2 },
        { date: '2024-01-15', accuracy: 97.8 },
        { date: '2024-01-16', accuracy: 98.5 },
        { date: '2024-01-17', accuracy: 98.1 },
        { date: '2024-01-18', accuracy: 98.7 },
        { date: '2024-01-19', accuracy: 98.3 },
        { date: '2024-01-20', accuracy: 98.9 }
      ],
      user_activity: [
        { hour: 0, active_users: 2 },
        { hour: 6, active_users: 8 },
        { hour: 9, active_users: 45 },
        { hour: 12, active_users: 67 },
        { hour: 15, active_users: 52 },
        { hour: 18, active_users: 38 },
        { hour: 21, active_users: 15 }
      ],
      liveness_challenges: [
        { challenge: 'turn_left', success_rate: 94.2 },
        { challenge: 'turn_right', success_rate: 93.8 },
        { challenge: 'blink', success_rate: 97.1 },
        { challenge: 'open_mouth', success_rate: 95.6 }
      ],
      top_organizations: [
        { org_id: 'default', user_count: 156 },
        { org_id: 'company-abc', user_count: 89 },
        { org_id: 'university-xyz', user_count: 234 },
        { org_id: 'hospital-123', user_count: 67 }
      ],
      system_performance: [
        { metric: 'Avg Response Time', value: 245, trend: 'down' },
        { metric: 'Success Rate', value: 98.7, trend: 'up' },
        { metric: 'Active Users', value: 542, trend: 'up' },
        { metric: 'Daily Recognitions', value: 1876, trend: 'up' }
      ]
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 800);
  }, [timeRange]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Insights and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-3 py-2 border rounded-md">
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {data.system_performance.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.metric}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`flex items-center ${getTrendColor(metric.trend)}`}>{getTrendIcon(metric.trend)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Face Recognitions</h3>
          <div className="space-y-3">
            {data.daily_recognitions.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(item.count / 80) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recognition Accuracy</h3>
          <div className="space-y-3">
            {data.recognition_accuracy.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${item.accuracy - 95}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{item.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Liveness Challenge Success Rates</h3>
          <div className="space-y-4">
            {data.liveness_challenges.map((challenge, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 capitalize">{challenge.challenge.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${challenge.success_rate}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{challenge.success_rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Organizations</h3>
          <div className="space-y-4">
            {data.top_organizations.map((org, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{org.org_id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(org.user_count / 250) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{org.user_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;


