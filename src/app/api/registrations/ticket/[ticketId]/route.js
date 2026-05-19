import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Registration from '@/models/Registration';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { ticketId } = params;

    const registration = await Registration.findOne({ ticketId })
      .populate('event', 'title location startDate endDate')
      .lean();

    if (!registration) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 });
    }

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Error fetching registration:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
