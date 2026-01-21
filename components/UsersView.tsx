import React from 'react';
import { User, Shield, MoreHorizontal, Plus } from 'lucide-react';

const UsersView: React.FC = () => {
  const users = [
    { name: 'Amrinder BKL', email: 'ammy@kambojventures.com', role: 'Admin', status: 'Active' },
    { name: 'Store Manager', email: 'manager@veganearth.com', role: 'Editor', status: 'Active' },
    { name: 'Inventory Clerk', email: 'clerk@urbanvii.com', role: 'Viewer', status: 'Inactive' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
          <p className="text-carbon-400">Manage access and permissions for your team.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-kv-accent hover:bg-kv-accentHover text-white text-sm font-medium rounded transition-colors w-full sm:w-auto justify-center">
          <Plus size={16} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-carbon-900 border border-carbon-700 rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-carbon-800 text-carbon-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {users.map((user, idx) => (
                <tr key={idx} className="border-b border-carbon-800 hover:bg-carbon-800/50 transition-colors last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-carbon-700 flex items-center justify-center text-carbon-300 shrink-0">
                        <User size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{user.name}</p>
                        <p className="text-carbon-400 text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-carbon-300">
                      <Shield size={14} />
                      <span>{user.role}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      user.status === 'Active' 
                        ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                        : 'bg-carbon-700 text-carbon-400 border-carbon-600'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-carbon-400 hover:text-white hover:bg-carbon-700 rounded transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersView;