'use client';
import React, { useEffect, useState } from 'react';
import { useListEventsQuery } from '@/store/api';

/** Small card to view/download an image, PDF, DOC, or other file uploaded by registrants */
function AdminImageCard({ label, url, name }) {
  if (!url) return null;

  const lower = url.toLowerCase();
  const isPdf = lower.includes('.pdf') || url.startsWith('data:application/pdf');
  const isDoc = /\.docx?(\?|$)/i.test(lower)
    || url.startsWith('data:application/vnd.openxmlformats')
    || url.startsWith('data:application/msword');
  const isText = /\.txt(\?|$)/i.test(lower) || url.startsWith('data:text/plain');
  const isImage = !isPdf && !isDoc && !isText;
  const fileIcon = isPdf ? '📄' : isDoc ? '📝' : isText ? '📃' : '📎';
  const fileLabel = isPdf ? 'PDF' : isDoc ? 'DOC' : isText ? 'TXT' : 'FILE';
  const ext = isPdf
    ? 'pdf'
    : isDoc
      ? (lower.includes('.docx') ? 'docx' : 'doc')
      : isText
        ? 'txt'
        : (url.split('.').pop().split('?')[0] || 'jpg');
  const downloadName = `${name}.${ext}`;

  const handleDownload = async () => {
    try {
      // If it's a data URL, download directly
      if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        a.click();
        return;
      }
      // Remote URL — fetch as blob first to force download
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = downloadName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 text-xs">
      <span className="text-charcoal-400 mb-1">{label}</span>
      {isImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt={label}
            className="w-20 h-20 object-cover rounded border border-charcoal-600 hover:border-terra-400 transition cursor-pointer"
          />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-20 h-20 bg-charcoal-700 rounded flex flex-col items-center justify-center gap-1 border border-charcoal-600 hover:border-terra-400 transition"
          title={`Open ${fileLabel}`}
        >
          <span className="text-2xl">{fileIcon}</span>
          <span className="text-charcoal-400 text-[10px]">{fileLabel}</span>
        </a>
      )}
      <button
        onClick={handleDownload}
        className="text-[10px] text-terra-400 hover:text-terra-300 underline mt-0.5"
      >
        ⬇ Download
      </button>
    </div>
  );
}

export default function AdminRegistrationsPage() {
  const { data } = useListEventsQuery();
  const [selected, setSelected] = useState('');
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedReg, setExpandedReg] = useState(null);
  const events = data?.events || [];

  // Auto-select first event
  useEffect(() => {
    if (!selected && events.length) setSelected(events[0]._id);
  }, [events, selected]);

  useEffect(() => {
    if (!selected) { setRegs([]); return; }
    setLoading(true);
    fetch(`/api/registrations?eventId=${selected}`)
      .then((r) => r.json())
      .then((j) => setRegs(j.registrations || []))
      .finally(() => setLoading(false));
  }, [selected]);

  const event = events.find((e) => e._id === selected);
  const totals = regs.reduce((acc, r) => {
    acc[r.registrationType] = (acc[r.registrationType] || 0) + 1;
    acc.revenue += r.amount || 0;
    if (r.registrationType === 'individual' || r.registrationType === 'visitor') {
      acc.profileComplete += r.profileCompleted ? 1 : 0;
    } else if (r.registrationType === 'group') {
      acc.profileComplete += r.members?.every(m => m.profileCompleted) ? 1 : 0;
    }
    return acc;
  }, { revenue: 0, profileComplete: 0 });

  const exportToCSV = () => {
    if (!regs.length) return;
    
    const headers = ['Ticket ID', 'Type', 'Name', 'Email', 'Phone', 'Amount', 'Status', 'Profile Complete'];
    const rows = [];
    
    regs.forEach(r => {
      if (r.registrationType === 'group' && r.members?.length) {
        r.members.forEach((m, i) => {
          rows.push([
            r.ticketId,
            `Group (${i + 1}/${r.members.length})`,
            m.name || '-',
            m.email || '-',
            m.phone || '-',
            i === 0 ? r.amount : 0, // Only show amount for first member
            r.status,
            m.profileCompleted ? 'Yes' : 'No'
          ]);
        });
      } else {
        rows.push([
          r.ticketId,
          r.registrationType,
          r.name || '-',
          r.email || '-',
          r.phone || '-',
          r.amount,
          r.status,
          r.profileCompleted ? 'Yes' : 'No'
        ]);
      }
    });
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${event?.title?.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleExpand = (regId) => {
    setExpandedReg(expandedReg === regId ? null : regId);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">BOOKINGS</p>
          <h1 className="text-3xl sm:text-4xl font-display">Registrations</h1>
        </div>
        <div className="flex gap-2">
          {selected && regs.length > 0 && (
            <button 
              onClick={exportToCSV}
              className="btn btn-outline text-sm px-4 py-2"
            >
              📊 Export CSV
            </button>
          )}
          <select className="input w-full sm:w-80" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Select event...</option>
            {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      {event && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Total</div><div className="text-2xl font-display text-terra-400">{regs.length}</div></div>
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Individual</div><div className="text-2xl font-display">{totals.individual || 0}</div></div>
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Groups</div><div className="text-2xl font-display">{totals.group || 0}</div></div>
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Completed</div><div className="text-2xl font-display text-green-400">{totals.profileComplete}</div></div>
          <div className="card p-4"><div className="text-[10px] text-charcoal-400 uppercase">Revenue</div><div className="text-lg font-bold text-terra-400">₹{totals.revenue.toLocaleString()}</div></div>
        </div>
      )}

      {loading ? <p className="text-charcoal-400">Loading...</p> : selected && (
        <>
          {/* Desktop */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Ticket</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Name / Group</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Profile</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {regs.map((r) => {
                  const isExpanded = expandedReg === r._id;
                  const profileComplete = r.registrationType === 'group' 
                    ? r.members?.every(m => m.profileCompleted)
                    : r.profileCompleted;
                  
                  return (
                    <React.Fragment key={r._id}>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono text-xs text-terra-400">{r.ticketId}</td>
                        <td className="p-3 capitalize">{r.registrationType}</td>
                        <td className="p-3">
                          <div className="font-semibold">{r.groupName || r.name}</div>
                          {r.groupSize && <div className="text-xs text-charcoal-500">{r.groupSize} members</div>}
                        </td>
                        <td className="p-3 text-xs">
                          <div>{r.email || r.groupLeader?.email}</div>
                          <div className="text-charcoal-500">{r.phone || r.groupLeader?.phone}</div>
                        </td>
                        <td className="p-3 text-terra-400 font-bold">₹{r.amount}</td>
                        <td className="p-3">
                          {profileComplete ? (
                            <span className="text-green-400 text-xs">✓ Complete</span>
                          ) : (
                            <span className="text-yellow-400 text-xs">⚠ Incomplete</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`badge ${
                            r.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            r.status === 'attended' ? 'bg-blue-500/20 text-blue-400' :
                            r.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>{r.status}</span>
                        </td>
                        <td className="p-3">
                          <button 
                            onClick={() => toggleExpand(r._id)}
                            className="text-xs text-terra-400 hover:text-terra-300"
                          >
                            {isExpanded ? '▼ Hide' : '▶ View'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-charcoal-900/50">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-terra-400">Full Details</h4>
                              {r.registrationType === 'group' && r.members?.length > 0 ? (
                                <div className="space-y-4">
                                  <div className="text-sm">
                                    <span className="text-charcoal-400">Group Name:</span> {r.groupName}<br/>
                                    <span className="text-charcoal-400">Team Captain:</span> {r.teamCaptainName || r.groupLeader?.name}<br/>
                                    <span className="text-charcoal-400">Captain Email:</span> {r.teamCaptainEmail || r.groupLeader?.email}<br/>
                                    <span className="text-charcoal-400">Captain Phone:</span> {r.teamCaptainMobile || r.groupLeader?.phone}
                                  </div>
                                  {/* Team photo */}
                                  {r.teamPhoto && (
                                    <div className="mb-4">
                                      <h5 className="font-semibold text-charcoal-300 mb-2 text-xs uppercase tracking-wider">Team Photo</h5>
                                      <AdminImageCard label="Team Photo" url={r.teamPhoto} name={`${r.groupName || r.ticketId}-team-photo`} />
                                    </div>
                                  )}

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead className="bg-charcoal-800/30">
                                        <tr>
                                          <th className="text-left p-2">Name</th>
                                          <th className="text-left p-2">Email</th>
                                          <th className="text-left p-2">Phone</th>
                                          <th className="text-left p-2">Age</th>
                                          <th className="text-left p-2">Blood</th>
                                          <th className="text-left p-2">Bike</th>
                                          <th className="text-left p-2">Experience</th>
                                          <th className="text-left p-2">Emergency</th>
                                          <th className="text-left p-2">Photos</th>
                                          <th className="text-left p-2">Profile</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {r.members.map((m, i) => (
                                          <tr key={i} className="border-t border-charcoal-800">
                                            <td className="p-2 font-semibold">{m.name}</td>
                                            <td className="p-2">{m.email}</td>
                                            <td className="p-2">{m.phone}</td>
                                            <td className="p-2">{m.age || '-'}</td>
                                            <td className="p-2">{m.bloodGroup || '-'}</td>
                                            <td className="p-2">
                                              {m.motorcycleBrand && m.motorcycleModel ?
                                                `${m.motorcycleBrand} ${m.motorcycleModel}` :
                                                m.bikeDetails || '-'
                                              }
                                              {m.engineCC && <div className="text-charcoal-500">{m.engineCC}</div>}
                                              {m.registrationNumber && <div className="text-charcoal-500">{m.registrationNumber}</div>}
                                            </td>
                                            <td className="p-2">{m.experienceLevel || '-'}</td>
                                            <td className="p-2">
                                              {m.emergencyContact && (
                                                <div>
                                                  <div>{m.emergencyContact}</div>
                                                  <div className="text-charcoal-500">{m.emergencyContactNumber}</div>
                                                </div>
                                              )}
                                            </td>
                                            <td className="p-2">
                                              <div className="flex gap-2">
                                                <AdminImageCard label="Photo" url={m.riderPhoto} name={`${m.name || i}-rider`} />
                                                <AdminImageCard label="ID" url={m.governmentIdProof} name={`${m.name || i}-id`} />
                                              </div>
                                            </td>
                                            <td className="p-2">
                                              {m.profileCompleted ? (
                                                <span className="text-green-400">✓ Complete</span>
                                              ) : (
                                                <span className="text-yellow-400">✗ Incomplete</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  {r.members.some(m => m.medicalConditions || m.allergies) && (
                                    <div className="mt-4">
                                      <h5 className="font-semibold text-charcoal-300 mb-2">Medical Information</h5>
                                      <div className="space-y-2 text-xs">
                                        {r.members.map((m, i) => (
                                          (m.medicalConditions || m.allergies) && (
                                            <div key={i} className="bg-charcoal-800/30 p-2 rounded">
                                              <div className="font-semibold">{m.name}</div>
                                              {m.medicalConditions && <div><span className="text-charcoal-400">Medical:</span> {m.medicalConditions}</div>}
                                              {m.allergies && <div><span className="text-charcoal-400">Allergies:</span> {m.allergies}</div>}
                                            </div>
                                          )
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div><span className="text-charcoal-400">Email:</span> {r.email}</div>
                                    <div><span className="text-charcoal-400">Phone:</span> {r.phone}</div>
                                    <div><span className="text-charcoal-400">Age:</span> {r.age || '-'}</div>
                                    <div><span className="text-charcoal-400">Blood Group:</span> {r.bloodGroup || '-'}</div>
                                    <div><span className="text-charcoal-400">Gender:</span> {r.gender || '-'}</div>
                                    <div><span className="text-charcoal-400">City:</span> {r.city || '-'}</div>
                                    <div><span className="text-charcoal-400">State:</span> {r.state || '-'}</div>
                                    <div><span className="text-charcoal-400">Address:</span> {r.address || '-'}</div>
                                    <div><span className="text-charcoal-400">Bike Brand:</span> {r.motorcycleBrand || '-'}</div>
                                    <div><span className="text-charcoal-400">Bike Model:</span> {r.motorcycleModel || '-'}</div>
                                    <div><span className="text-charcoal-400">Engine CC:</span> {r.engineCC || '-'}</div>
                                    <div><span className="text-charcoal-400">Registration #:</span> {r.registrationNumber || '-'}</div>
                                    <div><span className="text-charcoal-400">Experience:</span> {r.experienceLevel || '-'}</div>
                                    <div><span className="text-charcoal-400">Emergency Contact:</span> {r.emergencyContact || '-'}</div>
                                    <div><span className="text-charcoal-400">Emergency Phone:</span> {r.emergencyContactNumber || '-'}</div>
                                    <div><span className="text-charcoal-400">WhatsApp:</span> {r.whatsappNumber || '-'}</div>
                                  </div>

                                  {/* Uploaded Images */}
                                  {(r.riderPhoto || r.governmentIdProof) && (
                                    <div className="mt-4">
                                      <h5 className="font-semibold text-charcoal-300 mb-3 text-xs uppercase tracking-wider">Uploaded Documents</h5>
                                      <div className="flex flex-wrap gap-4">
                                        <AdminImageCard label="Rider Photo" url={r.riderPhoto} name={`${r.name || r.ticketId}-rider-photo`} />
                                        <AdminImageCard label="ID Proof" url={r.governmentIdProof} name={`${r.name || r.ticketId}-id-proof`} />
                                      </div>
                                    </div>
                                  )}

                                  {(r.medicalConditions || r.allergies) && (
                                    <div className="mt-4 p-3 bg-charcoal-800/30 rounded">
                                      <h5 className="font-semibold text-charcoal-300 mb-2">Medical Information</h5>
                                      {r.medicalConditions && <div className="text-xs"><span className="text-charcoal-400">Medical Conditions:</span> {r.medicalConditions}</div>}
                                      {r.allergies && <div className="text-xs"><span className="text-charcoal-400">Allergies:</span> {r.allergies}</div>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {regs.length === 0 && <tr><td colSpan={8} className="p-12 text-center text-charcoal-400">No registrations yet.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {regs.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-terra-400">{r.ticketId}</span>
                  <span className="badge bg-terra-500/20 text-terra-400 capitalize">{r.registrationType}</span>
                </div>
                <div className="font-semibold mt-2">{r.groupName || r.name}</div>
                <div className="text-xs text-charcoal-500">{r.email || r.groupLeader?.email}</div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-terra-400 font-bold">₹{r.amount}</span>
                  <span className="capitalize text-charcoal-300">{r.status}</span>
                </div>
              </div>
            ))}
            {regs.length === 0 && <div className="card p-8 text-center text-charcoal-400">No registrations yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}
