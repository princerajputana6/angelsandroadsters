// Server-side layout for /blog/[slug] — generates per-blog metadata
// (title, description, og, keywords) merged with the global keyword set.
// The page itself is a client component, so metadata lives here.

import { mergeKeywords, SITE_NAME, SITE_URL } from '@/lib/seo';
import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';

async function getBlog(slug) {
  try {
    await connectDB();
    return await Blog.findOne({ slug, status: 'published' }).lean();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const blog = await getBlog(params.slug);

  if (!blog) {
    return {
      title: 'Blog',
      keywords: mergeKeywords([]),
    };
  }

  const title = blog.seo?.metaTitle || blog.title;
  const description =
    blog.seo?.metaDescription ||
    blog.excerpt ||
    `Read "${blog.title}" on ${SITE_NAME}.`;
  const url = `${SITE_URL}/blog/${blog.slug}`;
  const image = blog.featuredImage;

  return {
    title,
    description,
    keywords: mergeKeywords([
      ...(blog.seo?.keywords || []),
      ...(blog.tags || []),
      blog.category,
    ]),
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      siteName: SITE_NAME,
      locale: 'en_IN',
      publishedTime: blog.publishedAt || blog.createdAt,
      authors: [SITE_NAME],
      tags: blog.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function BlogSlugLayout({ children }) {
  return children;
}
