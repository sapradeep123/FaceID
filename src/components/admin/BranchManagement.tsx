import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Users, Building, Search } from 'lucide-react';

interface Branch {
  id: number;
  org_id: string;
  code: string;
  name: string;
  location?: string;
  user_count: number;
  device_count: number;
  created_at: string;
}

const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Mock data
  useEffect(() => {
    const mockBranches: Branch[] = [
      {
        id: 1,
        org_id: 'default',
        code: 'main-branch',
        name: 'Main Branch',
        location: 'Downtown Office',
        user_count: 45,
        device_count: 8,
        created_at: '2024-01-10T10:00:00Z'
      },
      {
        id: 2,
        org_id: 'company-abc',
        code: 'north-office',
        name: 'North Office',
        location: 'North District',
        user_count: 23,
        device_count: 4,
        created_at: '2024-01-12T14:30:00Z'
      },
      {
        id: 3,
        org_id: 'university-xyz',
        code: 'campus-main',
        name: 'Main Campus',
        location: 'University Campus',
        user_count: 156,
        device_count: 12,
        created_at: '2024-01-08T09:15:00Z'
      }
    ];

    setTimeout(() => {
      setBranches(mockBranches);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.org_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteBranch = (branchId: number) => {
    if (window.confirm('Are you sure you want to delete this branch? This will affect all associated users and devices.')) {
      setBranches(branches.filter(branch => branch.id !== branchId));
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
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
          <h2 className="text-2xl font-bold text-gray-900">Branch Management</h2>
          <p className="text-gray-600">Manage organizational branches and locations</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          <span>Add Branch</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Building className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                  <p className="text-sm text-gray-500">{branch.code}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEditBranch(branch)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Edit Branch"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteBranch(branch.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete Branch"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {branch.location && (
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{branch.location}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 mb-3">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{branch.org_id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Users</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{branch.user_count}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">Devices</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{branch.device_count}</p>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Created {formatDate(branch.created_at)}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Building className="h-full w-full" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No branches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new branch.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
