import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Users, Camera, Activity, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface Branch {
  id: number;
  org_id: string;
  code: string;
  name: string;
  user_count?: number;
  device_count?: number;
  enrollment_count?: number;
  last_activity?: string;
}

const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    org_id: 'default',
    code: '',
    name: ''
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockBranches: Branch[] = [
        {
          id: 1,
          org_id: 'default',
          code: 'HQ001',
          name: 'Headquarters',
          user_count: 15,
          device_count: 3,
          enrollment_count: 45,
          last_activity: '2024-01-27T10:30:00Z'
        },
        {
          id: 2,
          org_id: 'default',
          code: 'BR001',
          name: 'Branch Office 1',
          user_count: 8,
          device_count: 2,
          enrollment_count: 22,
          last_activity: '2024-01-27T09:15:00Z'
        }
      ];
      setBranches(mockBranches);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Implement actual API call
      if (editingBranch) {
        // Update existing branch
        setBranches(branches.map(b => 
          b.id === editingBranch.id 
            ? { ...b, ...formData }
            : b
        ));
      } else {
        // Create new branch
        const newBranch: Branch = {
          id: Date.now(),
          ...formData,
          user_count: 0,
          device_count: 0,
          enrollment_count: 0,
          last_activity: new Date().toISOString()
        };
        setBranches([...branches, newBranch]);
      }
      
      setShowModal(false);
      setEditingBranch(null);
      setFormData({ org_id: 'default', code: '', name: '' });
    } catch (error) {
      console.error('Failed to save branch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      org_id: branch.org_id,
      code: branch.code,
      name: branch.name
    });
    setShowModal(true);
  };

  const handleDelete = (branchId: number) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      setBranches(branches.filter(b => b.id !== branchId));
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-600">Manage organizational branches and their configurations</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Badge variant="secondary">{filteredBranches.length} branches</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <Card key={branch.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{branch.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(branch)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(branch.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                <Badge variant="outline">{branch.code}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <span className="font-medium">{branch.user_count}</span> users
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <span className="font-medium">{branch.device_count}</span> devices
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">{branch.enrollment_count}</span> enrollments
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Last Activity:</span>
                    <span className="text-xs text-gray-700">
                      {branch.last_activity ? 
                        new Date(branch.last_activity).toLocaleDateString() : 
                        'Never'
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // Navigate to users filtered by branch
                      window.location.href = `/admin?section=users&branch=${branch.id}`;
                    }}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Users
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // Navigate to devices filtered by branch
                      window.location.href = `/admin?section=devices&branch=${branch.id}`;
                    }}
                  >
                    <Activity className="h-4 w-4 mr-1" />
                    Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowModal(false);
                  setEditingBranch(null);
                  setFormData({ org_id: 'default', code: '', name: '' });
                }}
              >
                ×
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization ID
                </label>
                <Input
                  value={formData.org_id}
                  onChange={(e) => setFormData({...formData, org_id: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Code *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., HQ001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Headquarters"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBranch(null);
                    setFormData({ org_id: 'default', code: '', name: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : (editingBranch ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && branches.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading branches...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BranchManagement;