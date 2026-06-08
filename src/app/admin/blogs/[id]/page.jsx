'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGetBlogQuery, useUpdateBlogMutation } from '@/store/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import FileUpload from '@/components/FileUpload';

const CATEGORIES = ['Adventure', 'Gear', 'Travel', 'Community', 'Events', 'Tips'];

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const { data, isLoading } = useGetBlogQuery(params.id);
  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    images: [],
    category: 'Adventure',
    tags: [],
    status: 'draft',
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    },
  });

  useEffect(() => {
    if (data?.blog) {
      const blog = data.blog;
      setFormData({
        title: blog.title || '',
        excerpt: blog.excerpt || '',
        content: blog.content || '',
        featuredImage: blog.featuredImage || '',
        images: blog.images || [],
        category: blog.category || 'Adventure',
        tags: blog.tags || [],
        status: blog.status || 'draft',
        seo: blog.seo || { metaTitle: '', metaDescription: '', keywords: [] },
      });
    }
  }, [data]);

  const handleSubmit = async (status) => {
    try {
      const payload = { ...formData, status };
      await updateBlog({ id: params.id, body: payload }).unwrap();
      toast.success(`Blog ${status === 'published' ? 'published' : 'updated'}!`);
      router.push('/admin/blogs');
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to update blog');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-charcoal-400">Loading blog...</div>
      </div>
    );
  }

  if (!data?.blog) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">❌</div>
        <h3 className="text-xl font-display mb-2">Blog not found</h3>
        <button onClick={() => router.push('/admin/blogs')} className="btn btn-outline mt-4">
          Back to Blogs
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display">Edit Blog</h1>
          <p className="text-charcoal-400 text-sm mt-1">Update blog content and settings</p>
        </div>
        <button onClick={() => router.push('/admin/blogs')} className="btn btn-ghost">
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card-glass p-6">
            <h3 className="font-display text-lg mb-4">Basic Information</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Excerpt *</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="input"
                rows="3"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <FileUpload
                label="Featured Image *"
                accept="image/*"
                value={formData.featuredImage}
                onChange={(url) => setFormData({ ...formData, featuredImage: url })}
                description="Used at the top of the post and in WhatsApp / social link previews."
              />
              <details className="mt-2">
                <summary className="text-xs text-charcoal-500 hover:text-terra-400 cursor-pointer">Or paste an image URL instead…</summary>
                <input
                  type="text"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  className="input mt-2"
                  placeholder="https://..."
                />
              </details>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value.split(',').map((t) => t.trim()) })
                }
                className="input"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="card-glass p-6">
            <h3 className="font-display text-lg mb-4">Content *</h3>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input-field font-mono text-sm"
              rows="20"
            />
            <p className="text-xs text-charcoal-500 mt-2">Supports Markdown formatting</p>
          </div>

          <div className="card-glass p-6">
            <h3 className="font-display text-lg mb-4">SEO Settings</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Meta Title</label>
              <input
                type="text"
                value={formData.seo.metaTitle}
                onChange={(e) =>
                  setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })
                }
                className="input"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Meta Description</label>
              <textarea
                value={formData.seo.metaDescription}
                onChange={(e) =>
                  setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })
                }
                className="input"
                rows="2"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={isUpdating}
              className="btn btn-outline flex-1"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit('published')}
              disabled={isUpdating}
              className="btn btn-gold flex-1"
            >
              {formData.status === 'published' ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="card-glass p-6">
            <h3 className="font-display text-lg mb-4">Preview</h3>
            {formData.featuredImage && (
              <img src={formData.featuredImage} alt="" className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            <h2 className="text-2xl font-display mb-2">{formData.title}</h2>
            <p className="text-charcoal-400 text-sm mb-4">{formData.excerpt}</p>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{formData.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
