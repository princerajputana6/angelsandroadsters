'use client';
import { useState } from 'react';
import { useListBlogsQuery } from '@/store/api';
import Link from 'next/link';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Adventure', 'Gear', 'Travel', 'Community', 'Events', 'Tips'];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListBlogsQuery({
    page,
    limit: 12,
    category: selectedCategory === 'All' ? '' : selectedCategory,
    status: 'published',
  });

  const blogs = data?.blogs || [];
  const pagination = data?.pagination || {};

  return (
    <div className="bg-charcoal-950 min-h-screen pt-28 pb-16">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="eyebrow mb-3">Stories & Insights</p>
          <h1 className="text-4xl sm:text-5xl font-display mb-4">
            The <span className="gradient-text">Road Journal</span>
          </h1>
          <p className="text-charcoal-300 max-w-2xl mx-auto">
            Adventures, tips, and stories from the riding community
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`chip ${
                selectedCategory === cat
                  ? 'bg-terra-500/20 text-terra-400 border-terra-500'
                  : 'hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-charcoal-400">Loading blogs...</div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-display mb-2">No blogs yet</h3>
            <p className="text-charcoal-400">Check back soon for new content!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog, i) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/blog/${blog.slug}`} className="block card-glass overflow-hidden group h-full">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3 text-xs text-charcoal-400">
                        <span className="chip text-xs">{blog.category}</span>
                        <span>•</span>
                        <span>{blog.readTime} min read</span>
                        <span>•</span>
                        <span>{new Date(blog.publishedAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <h3 className="text-xl font-display mb-2 group-hover:text-terra-400 transition line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-charcoal-400 text-sm line-clamp-3 mb-4">{blog.excerpt}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-charcoal-500">By {blog.author?.name || 'Admin'}</span>
                        <span className="text-terra-400 group-hover:translate-x-1 transition-transform">
                          Read more →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`btn btn-sm ${p === page ? 'btn-gold' : 'btn-ghost'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
