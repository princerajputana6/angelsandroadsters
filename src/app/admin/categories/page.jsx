'use client';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useListSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
} from '@/store/api';
import FileUpload from '@/components/FileUpload';

function CategoryForm({ initial = {}, topLevels, sections, onCancel, onSubmit, submitLabel }) {
  const [f, setF] = useState({
    name: initial.name || '',
    parent: initial.parent || sections[0]?.name || '',
    parentCategory: initial.parentCategory || '',
    description: initial.description || '',
    image: initial.image || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isSub = Boolean(f.parentCategory);

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.parent) return;
    onSubmit({
      name: f.name.trim(),
      parent: f.parent.toLowerCase(),
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
        <label className="label">Section <span className="text-red-400">*</span></label>
        <select className="input" required value={f.parent} onChange={set('parent')}>
          <option value="">Select a section…</option>
          {sections.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <p className="text-[10px] text-charcoal-500 mt-1">Sections are managed at the top of this page.</p>
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
          description="Shown on the homepage 'Shop by Category' tiles. A tall/portrait photo works best."
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

function SectionEditor({ initial, favouriteCount, favouriteLimit, onCancel, onSubmit, submitLabel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    title: initial?.title || '',
    image: initial?.image || '',
    isFavourite: !!initial?.isFavourite,
  });
  // Disable the favourite checkbox if the cap is already hit AND this section
  // isn't already one of the favourites
  const limit = favouriteLimit ?? 4;
  const favLocked = !f.isFavourite && (favouriteCount ?? 0) >= limit;

  const submit = (e) => {
    e.preventDefault();
    const name = f.name.trim().toLowerCase();
    if (!name) return;
    onSubmit({
      name,
      title: f.title.trim(),
      image: f.image || '',
      isFavourite: !!f.isFavourite,
    });
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="label">Section key <span className="text-red-400">*</span></label>
        <input
          className="input"
          required
          maxLength={40}
          placeholder="e.g. riding, accessories"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <p className="text-[10px] text-charcoal-500 mt-1">Lowercase key used in URLs and filters.</p>
      </div>
      <div>
        <label className="label">Display title</label>
        <input
          className="input"
          maxLength={80}
          placeholder="e.g. Riding Gear"
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
        <p className="text-[10px] text-charcoal-500 mt-1">Shown to customers. Falls back to the key.</p>
      </div>
      <div className="sm:col-span-2">
        <FileUpload
          label="Section image (optional)"
          accept="image/*"
          value={f.image}
          onChange={(url) => setF({ ...f, image: url })}
          description="A wide banner/hero image for this section."
        />
      </div>
      <div className="sm:col-span-2">
        <label className={`flex items-center gap-2 text-sm ${favLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={f.isFavourite}
            disabled={favLocked}
            onChange={(e) => setF({ ...f, isFavourite: e.target.checked })}
          />
          <span>
            <span className="font-medium">⭐ Show as favourite on the homepage</span>
            <span className="text-xs text-charcoal-500 ml-2">(max {limit} favourites)</span>
          </span>
        </label>
        {favLocked && (
          <p className="text-[11px] text-amber-400 mt-1">
            You already have {favouriteCount} favourites. Unfavourite another section to add this one.
          </p>
        )}
      </div>
      <div className="sm:col-span-2 flex gap-2 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-outline h-10 px-5">Cancel</button>}
        <button type="submit" className="btn btn-gold h-10 px-5">{submitLabel}</button>
      </div>
    </form>
  );
}

function SectionsManager({ sections, onAdd, onUpdate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const favouriteCount = sections.filter((s) => s.isFavourite).length;
  const favouriteLimit = 4;

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
        <div>
          <h2 className="font-display text-xl mb-1">Sections</h2>
          <p className="text-xs text-charcoal-400">
            Sections group categories at the top of the catalog. You must create at least one before adding categories.
          </p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn btn-gold h-10 px-5">+ Add section</button>
        )}
      </div>

      {adding && (
        <div className="rounded-xl border border-terra-500/30 bg-terra-500/[0.04] p-4 mt-4">
          <p className="eyebrow mb-3">New section</p>
          <SectionEditor
            favouriteCount={favouriteCount}
            favouriteLimit={favouriteLimit}
            onCancel={() => setAdding(false)}
            onSubmit={async (body) => { const ok = await onAdd(body); if (ok) setAdding(false); }}
            submitLabel="Save section"
          />
        </div>
      )}

      {sections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {sections.map((s) => {
            const isEditing = editingId === s._id;
            return (
              <div key={s._id} className="rounded-xl border border-charcoal-800 overflow-hidden">
                {isEditing ? (
                  <div className="p-3">
                    <SectionEditor
                      initial={s}
                      favouriteCount={favouriteCount}
                      favouriteLimit={favouriteLimit}
                      onCancel={() => setEditingId(null)}
                      onSubmit={async (body) => { const ok = await onUpdate(s._id, body); if (ok) setEditingId(null); }}
                      submitLabel="Save changes"
                    />
                  </div>
                ) : (
                  <div className="flex items-stretch gap-3">
                    <div className="w-24 shrink-0 bg-charcoal-800 flex items-center justify-center relative">
                      {s.image ? (
                        <img src={s.image} alt={s.name} className="w-24 h-24 object-cover" />
                      ) : (
                        <span className="text-3xl opacity-50">🗂</span>
                      )}
                      {s.isFavourite && (
                        <span className="absolute top-1 left-1 bg-gold-500 text-charcoal-950 text-[10px] font-bold px-1.5 py-0.5 rounded">⭐</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-3 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{s.title || s.name}</span>
                        {s.title && <span className="text-[10px] text-charcoal-500 font-mono">/{s.name}</span>}
                        {s.isFavourite && <span className="badge bg-gold-500/15 text-gold-400 text-[9px]">FAVOURITE</span>}
                      </div>
                      <div className="mt-2 flex gap-3 text-xs">
                        <button onClick={() => setEditingId(s._id)} className="text-terra-400 hover:text-terra-300">Edit</button>
                        <button onClick={() => onDelete(s)} className="text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !adding && (
          <div className="rounded-xl border border-dashed border-charcoal-700 p-5 text-center text-charcoal-400 text-sm mt-4">
            No sections yet. Click "+ Add section" above to get started.
          </div>
        )
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { data: catData, isLoading } = useListCategoriesQuery();
  const { data: secData } = useListSectionsQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createSection] = useCreateSectionMutation();
  const [updateSection] = useUpdateSectionMutation();
  const [deleteSection] = useDeleteSectionMutation();
  const [editingId, setEditingId] = useState(null);

  const sections = secData?.sections || [];
  const cats = catData?.categories || [];
  const hasSections = sections.length > 0;

  const { topLevels, subsByParent } = useMemo(() => {
    const tops = cats.filter((c) => !c.parentCategory);
    const subs = {};
    cats.filter((c) => c.parentCategory).forEach((c) => {
      const pid = String(c.parentCategory);
      (subs[pid] ||= []).push(c);
    });
    return { topLevels: tops, subsByParent: subs };
  }, [cats]);

  const handleAddSection = async (body) => {
    try {
      await createSection(body).unwrap();
      toast.success('Section added');
      return true;
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to add section');
      return false;
    }
  };
  const handleUpdateSection = async (id, body) => {
    try {
      await updateSection({ id, body }).unwrap();
      toast.success('Section saved');
      return true;
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to save section');
      return false;
    }
  };
  const handleDeleteSection = async (section) => {
    if (!confirm(`Delete section "${section.name}"?`)) return;
    try {
      await deleteSection(section._id).unwrap();
      toast.success('Section deleted');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to delete section');
    }
  };

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
        <p className="text-charcoal-400 text-sm mt-1">
          First add the sections you want, then create categories and sub-categories under them.
        </p>
      </div>

      {/* Sections management — always shown */}
      <SectionsManager
        sections={sections}
        onAdd={handleAddSection}
        onUpdate={handleUpdateSection}
        onDelete={handleDeleteSection}
      />

      {/* Category creation — gated on having at least one section */}
      <div className="card p-5 sm:p-6 mb-8">
        <h2 className="font-display text-xl mb-1">Add a category</h2>
        {!hasSections ? (
          <p className="text-sm text-amber-400 mt-2">
            Add at least one section above before creating a category.
          </p>
        ) : (
          <>
            <p className="text-xs text-charcoal-400 mb-4">
              Pick a section, then add a top-level category or nest a sub-category under an existing one.
            </p>
            <CategoryForm
              topLevels={topLevels}
              sections={sections}
              onSubmit={handleCreate}
              submitLabel="+ Add category"
            />
          </>
        )}
      </div>

      {/* Tree */}
      <div className="space-y-4">
        {isLoading && <div className="card p-8 text-center text-charcoal-400">Loading...</div>}
        {!isLoading && topLevels.length === 0 && (
          <div className="card p-8 text-center text-charcoal-400">
            {hasSections ? 'No categories yet. Add one above.' : 'Add a section, then a category.'}
          </div>
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
                    sections={sections}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(body) => handleUpdate(cat._id, body)}
                    submitLabel="Save"
                  />
                </div>
              )}

              <div className="p-4 sm:p-5">
                <p className="eyebrow mb-3">{subs.length} sub-categor{subs.length === 1 ? 'y' : 'ies'}</p>
                {subs.length === 0 ? (
                  <p className="text-xs text-charcoal-500">
                    No sub-categories. Add one using the form above and pick this category as the parent.
                  </p>
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
                                sections={sections}
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
