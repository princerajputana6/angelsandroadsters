'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerateBlogMutation, useCreateBlogMutation } from '@/store/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import FileUpload from '@/components/FileUpload';

const CATEGORIES = ['Adventure', 'Gear', 'Travel', 'Community', 'Events', 'Tips'];

export default function CreateBlogPage() {
  const router = useRouter();
  const [generateBlog, { isLoading: isGenerating }] = useGenerateBlogMutation();
  const [createBlog, { isLoading: isCreating }] = useCreateBlogMutation();

  const [step, setStep] = useState('topic');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Adventure');
  const [generatedData, setGeneratedData] = useState(null);
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

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    try {
      const result = await generateBlog({ topic, category }).unwrap();
      setGeneratedData(result);
      setFormData({
        title: result.title || '',
        excerpt: result.excerpt || '',
        content: result.content || '',
        featuredImage: result.featuredImage || '',
        images: result.images || [],
        category: result.category || category,
        tags: result.tags || [],
        status: 'draft',
        seo: {
          metaTitle: result.metaTitle || '',
          metaDescription: result.metaDescription || '',
          keywords: result.keywords || [],
        },
      });
      setStep('edit');
      toast.success('Blog generated! Review and edit before publishing.');
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to generate blog');
    }
  };

  const handleSubmit = async (status) => {
    try {
      const payload = { ...formData, status, isAIGenerated: !!generatedData };
      await createBlog(payload).unwrap();
      toast.success(`Blog ${status === 'published' ? 'published' : 'saved as draft'}!`);
      router.push('/admin/blogs');
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to create blog');
    }
  };

  if (step === 'topic') {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display mb-2">Create New Blog</h1>
        <p className="text-charcoal-400 mb-8">Let AI generate a comprehensive blog post for you</p>

        <div className="card-glass p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Blog Topic / Title</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Best Motorcycle Routes in Rajasthan"
              className="input"
              autoFocus
            />
            <p className="text-xs text-charcoal-500 mt-1">
              Enter a topic and AI will create a full blog post with images
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="btn btn-gold flex-1"
            >
              {isGenerating ? '✨ Generating...' : '✨ Generate Blog with AI'}
            </button>
            <button onClick={() => setStep('edit')} className="btn btn-outline">
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display">
            {generatedData ? 'Review & Edit Blog' : 'Create Blog Manually'}
          </h1>
          <p className="text-charcoal-400 text-sm mt-1">
            {generatedData ? 'AI-generated content ready for review' : 'Fill in the blog details'}
          </p>
        </div>
        <button onClick={() => setStep('topic')} className="btn btn-ghost">
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
                placeholder="Blog title"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Excerpt *</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="input"
                rows="3"
                placeholder="Short description"
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
                description="Hero image shown at the top of the post and in WhatsApp / social link previews."
              />
              <details className="mt-2">
                <summary className="text-xs text-charcoal-500 hover:text-terra-400 cursor-pointer">
                  Or paste an image URL instead…
                </summary>
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
              <label className="block text-sm font-medium mb-2">Additional images</label>
              <p className="text-xs text-charcoal-500 mb-2">Optional. Upload one at a time — embed inline in the markdown body.</p>
              <FileUpload
                label=""
                accept="image/*"
                value=""
                onChange={(url) => {
                  if (!url) return;
                  setFormData((f) => ({ ...f, images: [...(f.images || []), url] }));
                  toast.success('Image added — paste the URL into the body if you want it inline.');
                }}
              />
              {formData.images?.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {formData.images.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative group rounded-lg overflow-hidden border border-charcoal-800">
                      <img src={url} alt={`Image ${i + 1}`} className="w-full aspect-square object-cover" />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(`![](${url})`).then(() => toast.success('Markdown copied'))}
                        className="absolute bottom-1 left-1 text-[10px] bg-charcoal-900/80 px-1.5 py-0.5 rounded text-terra-400 opacity-0 group-hover:opacity-100 transition"
                        title="Copy markdown"
                      >Copy md</button>
                      <button
                        type="button"
                        onClick={() => setFormData((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 text-white text-xs w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        title="Remove"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
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
                placeholder="motorcycle, adventure, travel"
              />
            </div>
          </div>

          <div className="card-glass p-6">
            <h3 className="font-display text-lg mb-4">Content *</h3>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input font-mono text-sm"
              rows="20"
              placeholder="Write your blog content in markdown..."
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
                placeholder="SEO title"
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
                placeholder="SEO description"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={isCreating}
              className="btn btn-outline flex-1"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit('published')}
              disabled={isCreating}
              className="btn btn-gold flex-1"
            >
              Publish Now
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="card-glass p-6">
            <h3 className="font-display text-lg mb-4">Preview</h3>
            {formData.featuredImage && (
              <img src={formData.featuredImage} alt="" className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            <h2 className="text-2xl font-display mb-2">{formData.title || 'Untitled'}</h2>
            <p className="text-charcoal-400 text-sm mb-4">{formData.excerpt}</p>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{formData.content || '*No content yet*'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
