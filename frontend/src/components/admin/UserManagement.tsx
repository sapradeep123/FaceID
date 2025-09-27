import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Mail, Calendar, Building, Filter, X } from 'lucide-react';
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

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<SignupRequest>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers(filterOrg || undefined);
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
    setFormData({});
    setShowModal(true);
  };

  const handleViewUser = (user: User) => {
    setModalMode('view');
    setSelectedUser(user);
    setFormData(user);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        await loadUsers(); // Reload the list
      } catch (error) {
        console.error('Failed to delete user:', error);
        setError('Failed to delete user');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (modalMode === 'add') {
        await userAPI.createUser(formData as SignupRequest);
      } else if (modalMode === 'edit' && selectedUser) {
        const updateData: UserUpdate = {
          email: formData.email,
          full_name: formData.full_name,
          org_id: formData.org_id,
          password: formData.password,
        };
        await userAPI.updateUser(selectedUser.id, updateData);
      }
      setShowModal(false);
      await loadUsers(); // Reload the list
    } catch (error: any) {
      console.error('Failed to save user:', error);
      setError(error.response?.data?.detail || 'Failed to save user');
    }
  };

  const filteredUsers = users.filter(user => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = user.email.toLowerCase().includes(q) || user.full_name?.toLowerCase().includes(q);
    const matchesOrg = !filterOrg || user.org_id === filterOrg;
    return matchesSearch && matchesOrg;
  });

  const orgSet: Record<string, true> = {};
  users.forEach(u => { orgSet[u.org_id] = true; });
  const uniqueOrgs = Object.keys(orgSet);

  const formatDate = (s: string) => new Date(s).toLocaleString();

  if (loading) return <div className="p-6">Loading users…</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage system users and their face enrollments</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2 border rounded-md" placeholder="Search users…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select className="w-full pl-10 pr-4 py-2 border rounded-md" value={filterOrg} onChange={e => setFilterOrg(e.target.value)}>
            <option value="">All Organizations</option>
            {uniqueOrgs.map(org => <option key={org} value={org}>{org}</option>)}
          </select>
        </div>
        <div className="text-sm text-gray-500 flex items-center">{filteredUsers.length} user(s) found</div>
      </div>

      <div className="bg-white rounded-lg border overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Face Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">{(u.full_name || u.email).charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{u.full_name || 'No name'}</div>
                      <div className="text-sm text-gray-500 flex items-center"><Mail className="h-3 w-3 mr-1" />{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center text-sm text-gray-900"><Building className="h-4 w-4 mr-2 text-gray-400" />{u.org_id}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{u.face_count || 0} faces</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.last_login ? formatDate(u.last_login) : 'Never'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-gray-400" />{formatDate(u.created_at)}</div></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => handleViewUser(u)}
                      className="text-indigo-600 hover:text-indigo-900 p-1" 
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditUser(u)}
                      className="text-blue-600 hover:text-blue-900 p-1" 
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-600 hover:text-red-900 p-1" 
                      title="Delete"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {modalMode === 'add' ? 'Add User' : modalMode === 'edit' ? 'Edit User' : 'User Details'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required={modalMode === 'add'}
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization ID</label>
                  <input
                    type="text"
                    value={formData.org_id || ''}
                    onChange={(e) => setFormData({...formData, org_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={modalMode === 'view'}
                  />
                </div>

                {(modalMode === 'add' || modalMode === 'edit') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required={modalMode === 'add'}
                      placeholder={modalMode === 'edit' ? 'Leave blank to keep current password' : ''}
                    />
                  </div>
                )}

                {modalMode === 'view' && selectedUser && (
                  <div className="space-y-2">
                    <div><strong>ID:</strong> {selectedUser.id}</div>
                    <div><strong>Created:</strong> {formatDate(selectedUser.created_at)}</div>
                    <div><strong>Face Count:</strong> {selectedUser.face_count || 0}</div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {modalMode === 'add' ? 'Add User' : 'Update User'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
