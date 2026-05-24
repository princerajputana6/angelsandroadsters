'use client';
import { useParams } from 'next/navigation';
import { useGetBlogBySlugQuery, useListBlogsQuery } from '@/store/api';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function BlogDetailPage() {
  const params = useParams();
  const { data, isLoading } = useGetBlogBySlugQuery(params.slug);
  const { data: relatedData } = useListBlogsQuery({ limit: 3, status: 'published' });

  const blog = data?.blog;
  const relatedBlogs = relatedData?.blogs?.filter((b) => b.slug !== params.slug).slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="bg-charcoal-950 min-h-screen pt-28 pb-16">
        <div className="container-x text-center py-12">
          <div className="animate-pulse text-charcoal-400">Loading blog...</div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="bg-charcoal-950 min-h-screen pt-28 pb-16">
        <div className="container-x text-center py-12">
          <div className="text-5xl mb-4">❌</div>
          <h3 className="text-xl font-display mb-2">Blog not found</h3>
          <Link href="/blog" className="btn btn-outline mt-4">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-950 min-h-screen">
      <div className="relative h-[60vh] overflow-hidden">
        <img src={blog.featuredImage} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950/60 via-charcoal-950/40 to-charcoal-950" />
        
        <div className="relative container-x h-full flex items-end pb-12 pt-28">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4 text-sm">
              <span className="chip">{blog.category}</span>
              <span className="text-charcoal-300">•</span>
              <span className="text-charcoal-300">{blog.readTime} min read</span>
              <span className="text-charcoal-300">•</span>
              <span className="text-charcoal-300">
                {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display leading-tight mb-4">{blog.title}</h1>
            <p className="text-xl text-charcoal-200">{blog.excerpt}</p>
            <div className="flex items-center gap-3 mt-6 text-sm text-charcoal-300">
              <span>By {blog.author?.name || 'Admin'}</span>
              <span>•</span>
              <span>{blog.views} views</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container-x py-12">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-3xl font-display mt-12 mb-4 text-white">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-2xl font-display mt-8 mb-3 text-white">{children}</h3>
                ),
                p: ({ children }) => <p className="text-charcoal-200 leading-relaxed mb-6">{children}</p>,
                ul: ({ children }) => <ul className="space-y-2 mb-6 text-charcoal-200">{children}</ul>,
                ol: ({ children }) => <ol className="space-y-2 mb-6 text-charcoal-200">{children}</ol>,
                li: ({ children }) => <li className="text-charcoal-200">{children}</li>,
                a: ({ href, children }) => (
                  <a href={href} className="text-terra-400 hover:text-terra-300 underline">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-terra-500 pl-6 italic text-charcoal-300 my-6">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </article>

          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-charcoal-800">
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <span key={tag} className="chip text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-charcoal-800">
            <Link href="/blog" className="btn btn-outline">
              ← Back to All Blogs
            </Link>
          </div>
        </div>
      </div>

      {relatedBlogs.length > 0 && (
        <div className="container-x py-16 border-t border-charcoal-800">
          <h2 className="text-3xl font-display mb-8">More Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedBlogs.map((relatedBlog) => (
              <Link
                key={relatedBlog._id}
                href={`/blog/${relatedBlog.slug}`}
                className="block card-glass overflow-hidden group"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={relatedBlog.featuredImage}
                    alt={relatedBlog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <span className="chip text-xs mb-2">{relatedBlog.category}</span>
                  <h3 className="font-display text-lg mb-2 group-hover:text-terra-400 transition line-clamp-2">
                    {relatedBlog.title}
                  </h3>
                  <p className="text-charcoal-400 text-sm line-clamp-2">{relatedBlog.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
