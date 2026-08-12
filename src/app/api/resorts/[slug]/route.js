import { connectDB } from '@/lib/db';
import Resort from '@/lib/models/Resort';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';
import { availabilityMap } from '@/lib/resortAvailability';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 });
  return user;
}

// GET /api/resorts/[slug] → single resort + live per-room availability
export async function GET(_req, { params }) {
  return handler(async () => {
    await connectDB();
    const resort = await Resort.findOne({ slug: params.slug }).lean({ virtuals: true });
    if (!resort) return fail('Resort not found', 404);

    if (!resort.isPublished) {
      const user = await getCurrentUser();
      if (!user || user.role !== 'admin') return fail('Resort not found', 404);
    }

    const availability = await availabilityMap(resort);
    return ok({ resort: toJSON(resort), availability });
  });
}

// PUT /api/resorts/[slug] → update (admin)
export async function PUT(req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const resort = await Resort.findOne({ slug: params.slug });
    if (!resort) return fail('Resort not found', 404);

    const body = await req.json();
    if (body.checkIn && body.checkOut && new Date(body.checkOut) <= new Date(body.checkIn)) {
      return fail('Check-out must be after check-in', 400);
    }

    const fields = [
      'name', 'tagline', 'description', 'coverImage', 'images', 'location',
      'amenities', 'checkIn', 'checkOut', 'checkInTime', 'checkOutTime',
      'policies', 'isPublished', 'sortOrder',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) resort[f] = body[f];
    }

    if (Array.isArray(body.roomTypes)) {
      // Preserve existing subdoc _ids where the client sent them back, so
      // availability (which keys off roomTypeId) survives an edit.
      resort.roomTypes = body.roomTypes.map((rt) => ({
        ...(rt._id ? { _id: rt._id } : {}),
        name: rt.name,
        description: rt.description || '',
        images: rt.images || [],
        pricePerNight: Number(rt.pricePerNight) || 0,
        capacity: Number(rt.capacity) || 2,
        totalRooms: Number(rt.totalRooms) || 0,
        bedType: rt.bedType || '',
        amenities: rt.amenities || [],
      }));
    }

    await resort.save();
    return ok({ resort: toJSON(resort) });
  });
}

// DELETE /api/resorts/[slug] (admin)
export async function DELETE(_req, { params }) {
  return handler(async () => {
    await requireAdmin();
    await connectDB();
    const resort = await Resort.findOneAndDelete({ slug: params.slug });
    if (!resort) return fail('Resort not found', 404);
    return ok({ deleted: true });
  });
}
