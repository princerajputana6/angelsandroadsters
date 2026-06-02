import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req, { params }) {
  return handler(async () => {
    await connectDB();
    const { id } = params;

    const user = await getCurrentUser();
    const isAdmin = user?.role === 'admin';

    const filter = { _id: id };
    if (!isAdmin) {
      filter.status = 'published';
    }

    const blog = await Blog.findOne(filter).populate('author', 'name email').lean();

    if (!blog) {
      return fail('Blog not found', 404);
    }

    if (!isAdmin) {
      await Blog.updateOne({ _id: id }, { $inc: { views: 1 } });
    }

    return ok({ blog: toJSON(blog) });
  });
}

export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const { id } = params;

    const body = await req.json();
    const {
      title,
      excerpt,
      content,
      featuredImage,
      images,
      category,
      tags,
      status,
      seo,
    } = body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return fail('Blog not found', 404);
    }

    if (title) blog.title = title;
    if (excerpt) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (featuredImage) blog.featuredImage = featuredImage;
    if (images !== undefined) blog.images = images;
    if (category) blog.category = category;
    if (tags !== undefined) blog.tags = tags;
    if (status) blog.status = status;
    if (seo) blog.seo = { ...blog.seo, ...seo };

    await blog.save();
    await blog.populate('author', 'name email');

    return ok({ blog: toJSON(blog) });
  });
}

export async function DELETE(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const { id } = params;

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return fail('Blog not found', 404);
    }

    return ok({ message: 'Blog deleted successfully' });
  });
}
