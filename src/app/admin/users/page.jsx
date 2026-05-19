'use client';
import { useState } from 'react';
import { useListUsersQuery, useUpdateUserMutation } from '@/store/api';
import toast from 'react-hot-toast';

const ROLES = ['user', 'eventManager', 'admin'];

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useListUsersQuery();
  const [update] = useUpdateUserMutation();
  const users = (data?.users || []).filter((u) =>
    !q || u.name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase())
  );

  const setRole = async (id, role) => {
    try { await update({ id, body: { role } }).unwrap(); toast.success('Role updated'); }
    catch (e) { toast.error('Failed'); }
  };
  const toggleBan = async (id, isBanned) => {
    try { await update({ id, body: { isBanned: !isBanned } }).unwrap(); toast.success(isBanned ? 'Unbanned' : 'Banned'); }
    catch (e) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">CREW</p>
          <h1 className="text-3xl sm:text-4xl font-display">Users</h1>
        </div>
        <input className="input w-full sm:w-64" placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? <p>Loading...</p> : (
        <>
          {/* Desktop */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terra-500 to-gold-500 flex items-center justify-center font-bold text-charcoal-950 text-sm">{u.name?.[0]?.toUpperCase()}</div>
                        <div>{u.name}</div>
                      </div>
                    </td>
                    <td className="p-3 text-charcoal-300">{u.email}</td>
                    <td className="p-3">
                      <select className="input py-1.5 text-xs" value={u.role} onChange={(e) => setRole(u._id, e.target.value)}>
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleBan(u._id, u.isBanned)} className={`badge ${u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </button>
                    </td>
                    <td className="p-3 text-xs text-charcoal-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div key={u._id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terra-500 to-gold-500 flex items-center justify-center font-bold text-charcoal-950">{u.name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{u.name}</div>
                    <div className="text-xs text-charcoal-500 truncate">{u.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <select className="input py-2 text-xs" value={u.role} onChange={(e) => setRole(u._id, e.target.value)}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <button onClick={() => toggleBan(u._id, u.isBanned)} className={`btn text-xs h-10 ${u.isBanned ? 'btn-outline text-red-400 border-red-500/40' : 'btn-outline text-green-400 border-green-500/40'}`}>
                    {u.isBanned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
