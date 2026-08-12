import { connectDB } from '@/lib/db';
import Resort from '@/lib/models/Resort';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 });
  return user;
}

// GET /api/resorts        → published resorts (public booking screen)
// GET /api/resorts?all=1  → every resort (admin only)
export async function GET(req) {
  return handler(async () => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const wantAll = searchParams.get('all') === '1';

    let filter = { isPublished: true };
    if (wantAll) {
      const user = await getCurrentUser();
      if (!user || user.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 });
      filter = {};
    }

    const resorts = await Resort.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean({ virtuals: true });
    return ok({ resorts: toJSON(resorts) });
  });
}

// POST /api/resorts → create a resort (admin)
export async function POST(req) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const body = await req.json();

    if (!body.name) return fail('Resort name is required', 400);
    if (!body.checkIn || !body.checkOut) return fail('Check-in and check-out dates are required', 400);
    if (new Date(body.checkOut) <= new Date(body.checkIn)) {
      return fail('Check-out must be after check-in', 400);
    }

    const resort = await Resort.create({
      name: body.name,
      tagline: body.tagline || '',
      description: body.description || '',
      coverImage: body.coverImage || '',
      images: body.images || [],
      location: body.location || {},
      amenities: body.amenities || [],
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      checkInTime: body.checkInTime || '14:00',
      checkOutTime: body.checkOutTime || '11:00',
      policies: body.policies || '',
      roomTypes: (body.roomTypes || []).map((rt) => ({
        name: rt.name,
        description: rt.description || '',
        images: rt.images || [],
        pricePerNight: Number(rt.pricePerNight) || 0,
        capacity: Number(rt.capacity) || 2,
        totalRooms: Number(rt.totalRooms) || 0,
        bedType: rt.bedType || '',
        amenities: rt.amenities || [],
      })),
      isPublished: body.isPublished !== false,
      sortOrder: Number(body.sortOrder) || 0,
    });

    return ok({ resort: toJSON(resort) }, 201);
  });
}
