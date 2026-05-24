import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import { getUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req, { params }) {
  return handler(async () => {
    await connectDB();
    const { slug } = params;

    const user = await getUser(req);
    const isAdmin = user?.role === 'admin';

    const filter = { slug };
    if (!isAdmin) {
      filter.status = 'published';
    }

    const blog = await Blog.findOne(filter).populate('author', 'name email').lean();

    if (!blog) {
      return fail('Blog not found', 404);
    }

    if (!isAdmin) {
      await Blog.updateOne({ slug }, { $inc: { views: 1 } });
    }

    return ok({ blog: toJSON(blog) });
  });
}
