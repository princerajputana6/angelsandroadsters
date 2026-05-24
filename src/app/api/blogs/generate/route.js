import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler } from '@/lib/apiUtils';
import { generateBlogContent } from '@/lib/groq';

export async function POST(req) {
  return handler(async () => {
    await requireAdmin(req);

    const body = await req.json();
    const { topic, category } = body;

    if (!topic) {
      return fail('Topic is required', 400);
    }

    const blogData = await generateBlogContent(topic, category);

    const featuredImage = `https://images.unsplash.com/photo-${Date.now() % 1000000000000}?w=1200&q=80&fit=crop&auto=format`;
    
    const images = [
      `https://images.unsplash.com/photo-${Date.now() % 1000000000000 + 1}?w=1200&q=80&fit=crop&auto=format`,
      `https://images.unsplash.com/photo-${Date.now() % 1000000000000 + 2}?w=1200&q=80&fit=crop&auto=format`,
      `https://images.unsplash.com/photo-${Date.now() % 1000000000000 + 3}?w=1200&q=80&fit=crop&auto=format`,
    ];

    return ok({
      ...blogData,
      featuredImage,
      images,
      category: category || 'Adventure',
      isAIGenerated: true,
    });
  });
}
