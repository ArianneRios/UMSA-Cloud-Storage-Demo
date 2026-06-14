import { useState } from 'react';
import { Layout } from '../components/Layout';
import { mockStudents } from '../../data/mockData';
import { Search, HardDrive, Users, Shield } from 'lucide-react';
import type { UserRole, UserStatus } from '../../types';

export function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || student.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || student.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStorageBadge = (used: number, max: number) => {
    const percentage = (used / max) * 100;
    if (percentage > 80) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (percentage > 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'TECHNICAL':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SUSPENDED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // Summary stats
  const totalStudents = mockStudents.length;
  const activeStudents = mockStudents.filter((s) => s.status === 'ACTIVE').length;
  const adminCount = mockStudents.filter((s) => s.role === 'ADMIN').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Students</h1>
          <p className="text-slate-400">Manage UMSA Cloud Storage users</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalStudents}</div>
                <div className="text-xs text-slate-400">Total Users</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{activeStudents}</div>
                <div className="text-xs text-slate-400">Active Users</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{adminCount}</div>
                <div className="text-xs text-slate-400">Administrators</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'All')}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="All">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STUDENT">Student</option>
              <option value="TECHNICAL">Technical</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'All')}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Career
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Storage
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-4 text-sm font-mono text-slate-400">{student.id}</td>
                      <td className="px-4 py-4 text-sm font-medium text-white">{student.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">{student.email}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">{student.career}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-full ${getRoleBadge(
                            student.role
                          )}`}
                        >
                          {student.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-slate-400" />
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-full ${getStorageBadge(
                              student.storage_used,
                              student.max_storage
                            )}`}
                          >
                            {formatBytes(student.storage_used)} / {formatBytes(student.max_storage)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-full ${getStatusBadge(
                            student.status
                          )}`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <div className="text-slate-400">No students found matching your filters</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-400">
            Showing {filteredStudents.length} of {mockStudents.length} users
          </div>
        </div>

        {/* Security notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <strong className="text-amber-400">Security Notice:</strong> Password hashes are
              stored in PostgreSQL using bcrypt or Argon2. Passwords are never displayed or stored
              in plain text. User authentication is handled entirely by the NestJS backend.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
