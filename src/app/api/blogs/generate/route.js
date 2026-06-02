import { requireAdmin } from '@/lib/auth';
import { ok, fail, handler } from '@/lib/apiUtils';
import { generateBlogContent } from '@/lib/groq';

// Curated, working Unsplash photo URLs (real photo IDs) keyed by blog category.
// If a topic doesn't fit a curated pool we fall back to picsum.photos seeded by
// the topic so admins always see actual images instead of broken Unsplash 404s.
const CATEGORY_IMAGES = {
  Adventure: [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80',
    'https://images.unsplash.com/photo-1605649461784-8c0c1a04d18d?w=1600&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1600&q=80',
  ],
  Gear: [
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=80',
    'https://images.unsplash.com/photo-1591025207163-942350e47db2?w=1600&q=80',
    'https://images.unsplash.com/photo-1577128321998-da8fae0b9a0d?w=1600&q=80',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1600&q=80',
  ],
  Travel: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
  ],
  Community: [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=80',
    'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1600&q=80',
    'https://images.unsplash.com/photo-1531219572328-a0171b4448a3?w=1600&q=80',
  ],
  Events: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=80',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80',
  ],
  Tips: [
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=80',
  ],
};

function pickImagesForTopic(topic, category, n) {
  const pool = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.Adventure;
  const seed = (topic || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    if (i < pool.length) {
      out.push(pool[(seed + i) % pool.length]);
    } else {
      const safeSeed = encodeURIComponent((topic || 'blog') + '-' + i);
      out.push(`https://picsum.photos/seed/${safeSeed}/1600/900`);
    }
  }
  return out;
}

export async function POST(req) {
  return handler(async () => {
    await requireAdmin();

    const body = await req.json();
    const { topic, category } = body;

    if (!topic) {
      return fail('Topic is required', 400);
    }

    const blogData = await generateBlogContent(topic, category);

    // 1 featured + 3 supporting images — always working URLs.
    const [featuredImage, ...images] = pickImagesForTopic(topic, category, 4);

    return ok({
      ...blogData,
      featuredImage,
      images,
      category: category || 'Adventure',
      isAIGenerated: true,
    });
  });
}
