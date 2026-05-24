'use client';
import { useState } from 'react';
import { useListBlogsQuery, useDeleteBlogMutation } from '@/store/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  published: 'bg-green-500/10 text-green-400 border-green-500/30',
  archived: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export default function AdminBlogsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '' });
  const { data, isLoading, refetch } = useListBlogsQuery(filters);
  const [deleteBlog] = useDeleteBlogMutation();

  const blogs = data?.blogs || [];
  const pagination = data?.pagination || {};

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete blog "${title}"?`)) return;
    try {
      await deleteBlog(id).unwrap();
      toast.success('Blog deleted');
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to delete blog');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display">Blog Management</h1>
          <p className="text-charcoal-400 text-sm mt-1">Create and manage blog posts</p>
        </div>
        <Link href="/admin/blogs/create" className="btn btn-gold">
          ✨ Create New Blog
        </Link>
      </div>

      <div className="card-glass p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button onClick={() => setFilters({ page: 1, limit: 20, status: '' })} className="btn btn-ghost">
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-charcoal-400">Loading blogs...</div>
        </div>
      ) : blogs.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-xl font-display mb-2">No blogs yet</h3>
          <p className="text-charcoal-400 mb-6">Create your first blog post with AI assistance</p>
          <Link href="/admin/blogs/create" className="btn btn-gold">
            Create Blog
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div key={blog._id} className="card-glass p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {blog.featuredImage && (
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full sm:w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-display truncate">{blog.title}</h3>
                        <p className="text-charcoal-400 text-sm line-clamp-2 mt-1">{blog.excerpt}</p>
                      </div>
                      <span className={`chip text-xs shrink-0 ${STATUS_COLORS[blog.status]}`}>
                        {blog.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-400 mt-3">
                      <span>📂 {blog.category}</span>
                      <span>👁 {blog.views} views</span>
                      <span>⏱ {blog.readTime} min read</span>
                      {blog.isAIGenerated && <span className="chip text-xs">🤖 AI Generated</span>}
                      <span>
                        {blog.publishedAt
                          ? new Date(blog.publishedAt).toLocaleDateString('en-IN')
                          : 'Not published'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link href={`/admin/blogs/${blog._id}`} className="btn btn-sm btn-outline">
                        Edit
                      </Link>
                      <Link href={`/blog/${blog.slug}`} target="_blank" className="btn btn-sm btn-ghost">
                        Preview
                      </Link>
                      <button
                        onClick={() => handleDelete(blog._id, blog.title)}
                        className="btn btn-sm btn-ghost text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setFilters({ ...filters, page })}
                  className={`btn btn-sm ${
                    page === filters.page ? 'btn-gold' : 'btn-ghost'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
