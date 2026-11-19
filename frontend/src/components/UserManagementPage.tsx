import React from 'react';
import { ShieldCheck, ArrowLeft, UserPlus, Key } from 'lucide-react';

interface UserManagementPageProps {
  onBackToDashboard: () => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ onBackToDashboard }) => {
  const users = [
    { id: 1, name: 'Admin', username: 'admin', role: 'Super Admin', branch: 'Main Showroom', status: 'Active', lastLogin: '14 Nov 2026, 09:30 AM' },
    { id: 2, name: 'Bhavin Patel', username: 'bhavin_pos', role: 'Cashier / Billing', branch: 'Main Showroom', status: 'Active', lastLogin: '14 Nov 2026, 09:45 AM' },
    { id: 3, name: 'Kiran Dave', username: 'kiran_sales', role: 'Sales Executive', branch: 'Main Showroom', status: 'Active', lastLogin: '14 Nov 2026, 10:15 AM' },
    { id: 4, name: 'Ramesh Shah', username: 'ramesh_mgr', role: 'Store Manager', branch: 'Warehouse & Vault', status: 'Active', lastLogin: '13 Nov 2026, 06:10 PM' },
  ];

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto">
      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white">
                User Management &amp; Role Access Control
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Manage Staff Credentials, POS Roles &amp; Security Permissions
              </p>
            </div>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Active Users with access to Rudra Silver POS
            </span>
            <button
              onClick={() => alert('New user registration dialog')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:brightness-105 transition shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff User</span>
            </button>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-[#141822] rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-white/[0.08]">
                  <th className="p-3">User</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Designation / Role</th>
                  <th className="p-3">Assigned Branch</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{u.username}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{u.branch}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{u.lastLogin}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-500/30">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => alert(`Reset password for ${u.username}`)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-white/[0.08] hover:border-amber-400 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 transition text-[11px] flex items-center gap-1 mx-auto"
                      >
                        <Key className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
