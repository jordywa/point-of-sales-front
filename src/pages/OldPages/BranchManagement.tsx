import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, type DocumentData, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import authenticatedAxios from '../../utils/api';

interface Branch {
  id: string;
  name: string;
  location: string;
  isDeleted: boolean;
}

interface User {
  id: string;
  username: string;
  role: 'master' | 'manager' | 'cashier';
  branchId?: string;
  isDeleted: boolean;
}

const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [showBranchForm, setShowBranchForm] = useState<boolean>(false);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);

  const [showUserForm, setShowUserForm] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = fetchBranches();
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      const unsubscribe = fetchUsersByBranch(selectedBranch.id);
      return () => unsubscribe && unsubscribe();
    } else {
      setUsers([]);
    }
  }, [selectedBranch]);

  const fetchBranches = () => {
    setLoading(true);
    const branchesCollection = collection(db, 'branches');
    const unsubscribe = onSnapshot(branchesCollection, (snapshot) => {
        const branchesData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data()
        } as Branch));
        setBranches(branchesData);
        setLoading(false);
    }, (err) => {
        console.error('Error fetching branches:', err);
        setError('Failed to fetch branches.');
        setLoading(false);
    });
    return unsubscribe;
  };

  const fetchUsersByBranch = (branchId: string) => {
    setLoading(true);
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('branchId', '==', branchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data()
        } as User));
        setUsers(usersData.filter((user: User) => user.role !== 'master'));
        setLoading(false);
    }, (err) => {
        console.error(`Error fetching users for branch ${branchId}:`, err);
        setError('Failed to fetch users for this branch.');
        setLoading(false);
    });
    return unsubscribe;
  };

  const handleCreateUpdateBranch = async (branchData: Omit<Branch, 'id' | 'isDeleted'>, id?: string) => {
    try {
      if (id) {
        await authenticatedAxios.put(`/branches/${id}`, branchData);
      } else {
        await authenticatedAxios.post(`/branches`, branchData);
      }
      setShowBranchForm(false);
      setCurrentBranch(null);
    } catch (err) {
      console.error('Error saving branch:', err);
      setError('Failed to save branch.');
    }
  };

  const handleSoftDeleteRestoreBranch = async (id: string, isDeleted: boolean) => {
    try {
      if (isDeleted) {
        await authenticatedAxios.patch(`/branches/${id}/restore`);
      } else {
        await authenticatedAxios.delete(`/branches/${id}`);
      }
    } catch (err) {
      console.error('Error updating branch status:', err);
      setError('Failed to update branch status.');
    }
  };

  const handleCreateUpdateUser = async (userData: Omit<User, 'id' | 'isDeleted'>, id?: string) => {
    if (!selectedBranch) {
      setError('Please select a branch first to manage users.');
      return;
    }
    try {
      const userPayload = { ...userData, branchId: selectedBranch.id };
      if (id) {
        await authenticatedAxios.put(`/users/${id}`, userPayload);
      } else {
        await authenticatedAxios.post(`/users`, userPayload);
      }
      setShowUserForm(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user.');
    }
  };

  const handleSoftDeleteRestoreUser = async (id: string, isDeleted: boolean) => {
    if (!selectedBranch) {
      setError('Please select a branch first.');
      return;
    }
    try {
      if (isDeleted) {
        await authenticatedAxios.patch(`/users/${id}/restore`);
      } else {
        await authenticatedAxios.delete(`/users/${id}`);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg">Loading data...</p></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg text-red-600">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Branch and User Management</h1>

        {/* Branch Management Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Branches</h2>
            <button
              onClick={() => { setShowBranchForm(true); setCurrentBranch(null); }}
              className="px-4 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-primary-dark"
            >
              Add New Branch
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(branch => (
              <div
                key={branch.id}
                className={`p-4 border rounded-lg shadow-sm cursor-pointer ${selectedBranch?.id === branch.id ? 'border-primary ring-2 ring-primary-light' : 'border-gray-200'} ${branch.isDeleted ? 'bg-red-50 opacity-70' : 'bg-white'}`}
                onClick={() => setSelectedBranch(branch)}
              >
                <h3 className="text-lg font-medium text-gray-900">{branch.name}</h3>
                <p className="text-sm text-gray-600">{branch.location}</p>
                <p className="text-sm text-gray-600">Status: {branch.isDeleted ? 'Deleted' : 'Active'}</p>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowBranchForm(true); setCurrentBranch(branch); }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSoftDeleteRestoreBranch(branch.id, branch.isDeleted); }}
                    className={`text-sm ${branch.isDeleted ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                  >
                    {branch.isDeleted ? 'Restore' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Management Section */}
        {selectedBranch && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Users for {selectedBranch.name}</h2>
              <button
                onClick={() => { setShowUserForm(true); setCurrentUser(null); }}
                className="px-4 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-primary-dark"
              >
                Add New User
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.length > 0 ? (
                users.map(user => (
                  <div
                    key={user.id}
                    className={`p-4 border rounded-lg shadow-sm ${user.isDeleted ? 'bg-red-50 opacity-70' : 'bg-white'}`}
                  >
                    <h3 className="text-lg font-medium text-gray-900">{user.username}</h3>
                    <p className="text-sm text-gray-600">Role: {user.role}</p>
                    <p className="text-sm text-gray-600">Status: {user.isDeleted ? 'Deleted' : 'Active'}</p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => { setShowUserForm(true); setCurrentUser(user); }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSoftDeleteRestoreUser(user.id, user.isDeleted)}
                        className={`text-sm ${user.isDeleted ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                      >
                        {user.isDeleted ? 'Restore' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-600">No users found for this branch.</p>
              )}
            </div>
          </div>
        )}

        {/* Branch Form Modal */}
        {showBranchForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{currentBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
              <BranchForm
                initialData={currentBranch}
                onSubmit={handleCreateUpdateBranch}
                onCancel={() => { setShowBranchForm(false); setCurrentBranch(null); }}
              />
            </div>
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && selectedBranch && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{currentUser ? 'Edit User' : 'Add New User'}</h2>
              <UserForm
                initialData={currentUser}
                onSubmit={handleCreateUpdateUser}
                onCancel={() => { setShowUserForm(false); setCurrentUser(null); }}
                branchId={selectedBranch.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface BranchFormProps {
  initialData: Branch | null;
  onSubmit: (data: Omit<Branch, 'id' | 'isDeleted'>, id?: string) => void;
  onCancel: () => void;
}

const BranchForm: React.FC<BranchFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [location, setLocation] = useState(initialData?.location || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, location }, initialData?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="branchName" className="block text-sm font-medium text-gray-700">Branch Name</label>
        <input
          type="text"
          id="branchName"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="branchLocation" className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          id="branchLocation"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-primary-dark"
        >
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

interface UserFormProps {
  initialData: User | null;
  onSubmit: (data: Omit<User, 'id' | 'isDeleted'>, id?: string) => void;
  onCancel: () => void;
  branchId: string;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onCancel, branchId }) => {
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(''); // Password is never pre-filled for security
  const [role, setRole] = useState<User['role']>(initialData?.role || 'manager');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: Omit<User, 'id' | 'isDeleted'> = {
      username,
      role,
      branchId,
    };
    if (password) {
      (userData as any).password = password; // Add password only if provided
    }
    onSubmit(userData, initialData?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          id="username"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password {initialData ? '(leave blank to keep current)' : ''}</label>
        <input
          type="password"
          id="password"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...(!initialData && { required: true })} // Required only for new users
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
        <select
          id="role"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
          value={role}
          onChange={(e) => setRole(e.target.value as User['role'])}
          required
        >
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-primary-dark"
        >
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default BranchManagement;