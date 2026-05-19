import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product';
import { requireUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function POST(req) {
  return handler(async () => {
    const user = await requireUser();
    await connectDB();
    const { product, rating, title, comment } = await req.json();
    if (!product || !rating) return fail('product and rating required', 400);
    const exists = await Review.findOne({ product, user: user._id });
    if (exists) return fail('Already reviewed this product', 409);
    const review = await Review.create({
      product, user: user._id, name: user.name, rating, title, comment,
    });
    const agg = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(product, {
      'ratings.average': agg[0]?.avg || 0,
      'ratings.count': agg[0]?.count || 0,
      $push: { reviews: review._id },
    });
    return ok({ review: toJSON(review) }, 201);
  });
}

export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const product = searchParams.get('product');
    if (!product) return fail('product required', 400);
    const reviews = await Review.find({ product }).sort('-createdAt').lean();
    return ok({ reviews: toJSON(reviews) });
  });
}
