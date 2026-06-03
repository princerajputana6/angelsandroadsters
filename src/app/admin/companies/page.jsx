'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useListCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} from '@/store/api';
import FileUpload from '@/components/FileUpload';

function CompanyForm({ initial = {}, onCancel, onSubmit, submitLabel }) {
  const [f, setF] = useState({
    name: initial.name || '',
    logo: initial.logo || '',
    link: initial.link || '',
    order: initial.order ?? 0,
    isActive: initial.isActive !== false,
  });
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    onSubmit({
      name: f.name.trim(),
      logo: f.logo || '',
      link: f.link.trim(),
      order: Number(f.order) || 0,
      isActive: !!f.isActive,
    });
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="label">Name <span className="text-red-400">*</span></label>
        <input
          className="input"
          required
          maxLength={60}
          placeholder="e.g. SMK Helmets"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Link (optional)</label>
        <input
          className="input"
          maxLength={200}
          placeholder="https://example.com"
          value={f.link}
          onChange={(e) => setF({ ...f, link: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <FileUpload
          label="Logo"
          accept="image/*"
          value={f.logo}
          onChange={(url) => setF({ ...f, logo: url })}
          description="Transparent PNG or SVG works best. Falls back to the name as text if no logo."
        />
      </div>
      <div>
        <label className="label">Display order</label>
        <input
          className="input"
          type="number"
          value={f.order}
          onChange={(e) => setF({ ...f, order: e.target.value })}
        />
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => setF({ ...f, isActive: e.target.checked })}
          />
          Show on homepage marquee
        </label>
      </div>
      <div className="sm:col-span-2 flex gap-2 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-outline h-10 px-5">Cancel</button>}
        <button type="submit" className="btn btn-gold h-10 px-5">{submitLabel}</button>
      </div>
    </form>
  );
}

export default function AdminCompaniesPage() {
  const { data, isLoading } = useListCompaniesQuery();
  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const companies = data?.companies || [];

  const handleAdd = async (body) => {
    try {
      await createCompany(body).unwrap();
      toast.success('Company added');
      setAdding(false);
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to add');
    }
  };
  const handleUpdate = async (id, body) => {
    try {
      await updateCompany({ id, body }).unwrap();
      toast.success('Saved');
      setEditingId(null);
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to save');
    }
  };
  const handleDelete = async (c) => {
    if (!confirm(`Remove "${c.name}"?`)) return;
    try {
      await deleteCompany(c._id).unwrap();
      toast.success('Removed');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">PARTNERS</p>
          <h1 className="text-3xl sm:text-4xl font-display">Companies &amp; Sponsors</h1>
          <p className="text-charcoal-400 text-sm mt-1">Logos shown as a marquee strip below the hero on the homepage.</p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn btn-gold h-10 px-5">+ Add company</button>
        )}
      </div>

      {adding && (
        <div className="card p-5 mb-6">
          <h3 className="font-display text-xl mb-3">New company</h3>
          <CompanyForm onCancel={() => setAdding(false)} onSubmit={handleAdd} submitLabel="Add" />
        </div>
      )}

      {isLoading && <div className="card p-8 text-center text-charcoal-400">Loading...</div>}

      {!isLoading && companies.length === 0 && !adding && (
        <div className="card p-8 text-center text-charcoal-400">
          No companies yet. Add your first sponsor logo above.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {companies.map((c) => {
          const isEditing = editingId === c._id;
          return (
            <div key={c._id} className="card overflow-hidden">
              {isEditing ? (
                <div className="p-4">
                  <CompanyForm
                    initial={c}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(body) => handleUpdate(c._id, body)}
                    submitLabel="Save changes"
                  />
                </div>
              ) : (
                <div className="flex items-stretch gap-3">
                  <div className="w-28 shrink-0 bg-white/5 flex items-center justify-center p-2">
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} className="max-w-full max-h-20 object-contain" />
                    ) : (
                      <span className="text-charcoal-500 text-xs">No logo</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-3 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{c.name}</span>
                      {!c.isActive && <span className="badge bg-charcoal-700 text-charcoal-400 text-[9px]">HIDDEN</span>}
                    </div>
                    {c.link && (
                      <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-charcoal-500 truncate block hover:text-terra-400">
                        {c.link}
                      </a>
                    )}
                    <div className="text-[10px] text-charcoal-500 mt-1">Order: {c.order}</div>
                    <div className="mt-2 flex gap-3 text-xs">
                      <button onClick={() => setEditingId(c._id)} className="text-terra-400 hover:text-terra-300">Edit</button>
                      <button onClick={() => handleDelete(c)} className="text-red-400 hover:text-red-300">Remove</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
