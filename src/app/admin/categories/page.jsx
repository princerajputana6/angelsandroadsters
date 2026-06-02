'use client';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/store/api';
import FileUpload from '@/components/FileUpload';

const SECTIONS = ['riding', 'travelling'];

function CategoryForm({ initial = {}, topLevels, onCancel, onSubmit, submitLabel }) {
  const [f, setF] = useState({
    name: initial.name || '',
    parent: initial.parent || 'riding',
    parentCategory: initial.parentCategory || '',
    description: initial.description || '',
    image: initial.image || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isSub = Boolean(f.parentCategory);
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    onSubmit({
      name: f.name.trim(),
      parent: f.parent,
      parentCategory: f.parentCategory || null,
      description: f.description.trim(),
      image: f.image || '',
    });
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="label">Name</label>
        <input className="input" required value={f.name} onChange={set('name')} placeholder="e.g. Helmets, Off-road Helmets" />
      </div>
      <div>
        <label className="label">Section</label>
        <select className="input" value={f.parent} onChange={set('parent')}>
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Parent category (optional)</label>
        <select className="input" value={f.parentCategory} onChange={set('parentCategory')}>
          <option value="">— Top-level —</option>
          {topLevels
            .filter((c) => String(c._id) !== String(initial._id))
            .map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <p className="text-[10px] text-charcoal-500 mt-1">
          {isSub ? 'This will be saved as a sub-category.' : 'Leave blank for a top-level category.'}
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Description (optional)</label>
        <input className="input" value={f.description} onChange={set('description')} />
      </div>
      <div className="sm:col-span-2">
        <FileUpload
          label="Category image (optional)"
          accept="image/*"
          value={f.image}
          onChange={(url) => setF({ ...f, image: url })}
          description="Shown on the homepage 'Shop by Category' tiles. Use a tall/portrait photo for best results."
        />
      </div>
      <div className="sm:col-span-2 flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline h-10 px-5">Cancel</button>
        )}
        <button type="submit" className="btn btn-gold h-10 px-5">{submitLabel}</button>
      </div>
    </form>
  );
}

export default function AdminCategoriesPage() {
  const { data, isLoading } = useListCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [editingId, setEditingId] = useState(null);

  const cats = data?.categories || [];
  const { topLevels, subsByParent } = useMemo(() => {
    const tops = cats.filter((c) => !c.parentCategory);
    const subs = {};
    cats
      .filter((c) => c.parentCategory)
      .forEach((c) => {
        const pid = String(c.parentCategory);
        (subs[pid] ||= []).push(c);
      });
    return { topLevels: tops, subsByParent: subs };
  }, [cats]);

  const handleCreate = async (body) => {
    try {
      await createCategory(body).unwrap();
      toast.success(body.parentCategory ? 'Sub-category added' : 'Category added');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to add');
    }
  };

  const handleUpdate = async (id, body) => {
    try {
      await updateCategory({ id, body }).unwrap();
      toast.success('Saved');
      setEditingId(null);
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat._id).unwrap();
      toast.success('Deleted');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">CATALOG</p>
        <h1 className="text-3xl sm:text-4xl font-display">Categories</h1>
        <p className="text-charcoal-400 text-sm mt-1">Create top-level categories and nest sub-categories under them. Products on the New Product page use this list.</p>
      </div>

      {/* Create form */}
      <div className="card p-5 sm:p-6 mb-8">
        <h2 className="font-display text-xl mb-4">Add a category</h2>
        <CategoryForm topLevels={topLevels} onSubmit={handleCreate} submitLabel="+ Add category" />
      </div>

      {/* Tree */}
      <div className="space-y-4">
        {isLoading && <div className="card p-8 text-center text-charcoal-400">Loading...</div>}
        {!isLoading && topLevels.length === 0 && (
          <div className="card p-8 text-center text-charcoal-400">No categories yet. Add one above.</div>
        )}
        {topLevels.map((cat) => {
          const subs = subsByParent[String(cat._id)] || [];
          const isEditing = editingId === cat._id;
          return (
            <div key={cat._id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-charcoal-800/70">
                <div className="min-w-0 flex items-center gap-3">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-14 h-14 rounded-lg object-cover border border-charcoal-800" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-charcoal-800/60 border border-charcoal-800 flex items-center justify-center text-xl">🗂</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">{cat.name}</span>
                      <span className="badge bg-terra-500/15 text-terra-400 uppercase text-[10px]">{cat.parent}</span>
                      <span className="text-xs text-charcoal-500">/{cat.slug}</span>
                    </div>
                    {cat.description && <p className="text-xs text-charcoal-400 mt-1">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => setEditingId(isEditing ? null : cat._id)} className="text-xs text-terra-400 hover:text-terra-300">
                    {isEditing ? 'Close' : 'Edit'}
                  </button>
                  <button onClick={() => handleDelete(cat)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>

              {isEditing && (
                <div className="p-4 sm:p-5 bg-charcoal-900/40 border-b border-charcoal-800/70">
                  <CategoryForm
                    initial={cat}
                    topLevels={topLevels}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(body) => handleUpdate(cat._id, body)}
                    submitLabel="Save"
                  />
                </div>
              )}

              <div className="p-4 sm:p-5">
                <p className="eyebrow mb-3">{subs.length} sub-categor{subs.length === 1 ? 'y' : 'ies'}</p>
                {subs.length === 0 ? (
                  <p className="text-xs text-charcoal-500">No sub-categories. Add one using the form above and pick this category as the parent.</p>
                ) : (
                  <ul className="space-y-2">
                    {subs.map((s) => {
                      const subEditing = editingId === s._id;
                      return (
                        <li key={s._id} className="rounded-lg border border-charcoal-800 overflow-hidden">
                          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-charcoal-900/40">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-charcoal-500 text-xs">↳</span>
                              {s.image ? (
                                <img src={s.image} alt={s.name} className="w-8 h-8 rounded object-cover border border-charcoal-800" />
                              ) : null}
                              <span className="font-medium truncate">{s.name}</span>
                              <span className="text-[10px] text-charcoal-500">/{s.slug}</span>
                            </div>
                            <div className="flex gap-3 shrink-0">
                              <button onClick={() => setEditingId(subEditing ? null : s._id)} className="text-xs text-terra-400 hover:text-terra-300">
                                {subEditing ? 'Close' : 'Edit'}
                              </button>
                              <button onClick={() => handleDelete(s)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                            </div>
                          </div>
                          {subEditing && (
                            <div className="p-3 bg-charcoal-900/20">
                              <CategoryForm
                                initial={s}
                                topLevels={topLevels}
                                onCancel={() => setEditingId(null)}
                                onSubmit={(body) => handleUpdate(s._id, body)}
                                submitLabel="Save"
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
