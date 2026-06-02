import { connectDB } from '@/lib/db';
import Blog from '@/lib/models/Blog';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Number(searchParams.get('limit')) || 12);
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || '-publishedAt';

    const user = await getCurrentUser();
    const isAdmin = user?.role === 'admin';

    const filter = {};
    
    if (!isAdmin) {
      filter.status = 'published';
    } else if (status) {
      filter.status = status;
    }

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;

    const total = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .populate('author', 'name email')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    return ok({
      blogs: toJSON(blogs),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

export async function POST(req) {
  return handler(async () => {
    const user = await requireAdmin();
    await connectDB();

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
      isAIGenerated,
    } = body;

    if (!title || !excerpt || !content || !featuredImage) {
      return fail('Title, excerpt, content, and featured image are required', 400);
    }

    const blog = await Blog.create({
      title,
      excerpt,
      content,
      featuredImage,
      images: images || [],
      author: user._id,
      category: category || 'Adventure',
      tags: tags || [],
      status: status || 'draft',
      seo: seo || {},
      isAIGenerated: isAIGenerated || false,
    });

    await blog.populate('author', 'name email');

    return ok({ blog: toJSON(blog) }, 201);
  });
}
