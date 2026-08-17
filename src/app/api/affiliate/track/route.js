import { connectDB } from '@/lib/db';
import Affiliate from '@/lib/models/Affiliate';
import { ok, handler } from '@/lib/apiUtils';

// Public, fire-and-forget click tracking. Called once per visitor session when
// a ?ref=CODE link is opened. Unknown codes are silently ignored.
export async function POST(req) {
  return handler(async () => {
    const { code } = await req.json().catch(() => ({}));
    if (code) {
      await connectDB();
      await Affiliate.updateOne(
        { code: String(code).toUpperCase().trim(), status: 'active' },
        { $inc: { clicks: 1 } }
      );
    }
    return ok({ tracked: true });
  });
}
