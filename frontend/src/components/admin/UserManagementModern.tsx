import React, { useEffect, useState } from 'react';
import { Plus, Eye, Edit, Trash2, Calendar, Building, X, Camera } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DataTable, UserCell, BadgeCell } from '../ui/data-table';
import { userAPI, SignupRequest, UserUpdate } from '../../services/api';

interface User {
  id: number;
  email: string;
  full_name?: string;
  org_id: string;
  branch_id?: number;
  created_at: string;
  face_count?: number;
  last_login?: string;
}

interface UserModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit' | 'view';
  user?: User | null;
  onClose: () => void;
  onSave: (data: any) => void;
  error?: string | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, mode, user, onClose, onSave, error }) => {
  const [formData, setFormData] = useState<Partial<SignupRequest>>({});

  useEffect(() => {
    if (user && (mode === 'edit' || mode === 'view')) {
      setFormData(user);
    } else {
      setFormData({});
    }
  }, [user, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            {mode === 'add' ? 'Add User' : mode === 'edit' ? 'Edit User' : 'User Details'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={mode === 'add'}
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
              <input
                type="text"
                value={formData.org_id || ''}
                onChange={(e) => setFormData({...formData, org_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={mode === 'view'}
              />
            </div>

            {(mode === 'add' || mode === 'edit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required={mode === 'add'}
                  placeholder={mode === 'edit' ? 'Leave blank to keep current password' : ''}
                />
              </div>
            )}

            {mode === 'view' && user && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span>{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Face Count:</span>
                  <span>{user.face_count || 0}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button type="submit">
                {mode === 'add' ? 'Add User' : 'Update User'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagementModern: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setModalMode('add');
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleViewUser = (user: User) => {
    setModalMode('view');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        await loadUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        setError('Failed to delete user');
      }
    }
  };

  const handleSaveUser = async (data: any) => {
    try {
      setError(null);
      if (modalMode === 'add') {
        await userAPI.createUser(data as SignupRequest);
      } else if (modalMode === 'edit' && selectedUser) {
        const updateData: UserUpdate = {
          email: data.email,
          full_name: data.full_name,
          org_id: data.org_id,
          password: data.password,
        };
        await userAPI.updateUser(selectedUser.id, updateData);
      }
      setShowModal(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      let errorMessage = 'Failed to save user';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      key: 'user',
      title: 'User',
      render: (user: User) => <UserCell user={user} />
    },
    {
      key: 'org_id',
      title: 'Organization',
      render: (user: User) => (
        <BadgeCell>
          <div className="flex items-center space-x-1">
            <Building className="h-3 w-3" />
            <span>{user.org_id}</span>
          </div>
        </BadgeCell>
      )
    },
    {
      key: 'face_count',
      title: 'Face Count',
      render: (user: User) => (
        <BadgeCell variant="outline">
          {user.face_count || 0} faces
        </BadgeCell>
      )
    },
    {
      key: 'last_login',
      title: 'Last Login',
      render: (user: User) => (
        <div className="text-sm text-gray-900">
          {user.last_login ? formatDate(user.last_login) : 'Never'}
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (user: User) => (
        <div className="flex items-center text-sm text-gray-900">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          {formatDate(user.created_at)}
        </div>
      )
    }
  ];

  const handleEnrollFace = (user: User) => {
    // Navigate to face enrollment with selected user
    window.open(`/admin?section=face-enrollment&userId=${user.id}`, '_blank');
  };

  const actions = (user: User) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleViewUser(user)}
        title="View"
        className="h-8 w-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleEditUser(user)}
        title="Edit"
        className="h-8 w-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleEnrollFace(user)}
        title="Enroll Face"
        className="h-8 w-8 text-green-600 hover:text-green-900 hover:bg-green-50"
      >
        <Camera className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDeleteUser(user.id)}
        title="Delete"
        className="h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const filterOptions = [
    { value: 'default', label: 'Default' },
    { value: 'admin', label: 'Admin' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">User Management</CardTitle>
              <CardDescription>
                Manage system users and their face enrollments
              </CardDescription>
            </div>
            <Button onClick={handleAddUser} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardContent className="p-6">
          <DataTable
            data={users}
            columns={columns}
            searchPlaceholder="Search users by name or email..."
            filterOptions={filterOptions}
            onFilterChange={(orgId) => {
              // Filter logic would go here
            }}
            actions={actions}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <UserModal
        isOpen={showModal}
        mode={modalMode}
        user={selectedUser}
        onClose={() => setShowModal(false)}
        onSave={handleSaveUser}
        error={error}
      />
    </div>
  );
};

export default UserManagementModern;
