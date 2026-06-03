import { connectDB } from '@/lib/db';
import Registration from '@/lib/models/Registration';
import Event from '@/lib/models/Event';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, handler, toJSON } from '@/lib/apiUtils';

export async function PUT(req, { params }) {
  return handler(async () => {
    await connectDB();
    const user = await getCurrentUser();
    const { id } = params;
    const body = await req.json();

    const registration = await Registration.findById(id);
    if (!registration) return fail('Registration not found', 404);

    // Temporary bypass for connect@biztreck.world - remove this after debugging
    const isConnectEmail = registration.email?.toLowerCase()?.includes('connect@biztreck.world') ||
                          registration.members?.some(m => m.email?.toLowerCase()?.includes('connect@biztreck.world')) ||
                          registration.groupLeader?.email?.toLowerCase()?.includes('connect@biztreck.world');
    
    if (isConnectEmail) {
      console.log('TEMPORARY BYPASS: Allowing access for connect@biztreck.world registration');
      // Skip authorization for this email during debugging
    } else {
      // Normal authorization flow
      if (!user) {
        return fail('Authentication required. Please log in with the email used during booking.', 401);
      }

      // Check if user has access (either owns it or email matches or is a member)
      const userEmail = user.email?.toLowerCase()?.trim();
      const registrationEmail = registration.email?.toLowerCase()?.trim();
      
      const hasAccess = (
        // User ID matches (registration was made while logged in)
        (registration.user && registration.user.toString() === user._id.toString()) ||
        // Email matches main registration email
        registrationEmail === userEmail ||
        // User email matches one of the group members
        (registration.members && registration.members.some(m => m.email?.toLowerCase()?.trim() === userEmail)) ||
        // User email matches group leader email
        (registration.groupLeader && registration.groupLeader.email?.toLowerCase()?.trim() === userEmail)
      );

      if (!hasAccess) {
        return fail(`Unauthorized - You (${userEmail}) do not have access to this registration (${registrationEmail})`, 403);
      }
    }

    // Update based on registration type
    if (registration.registrationType === 'individual' || registration.registrationType === 'visitor') {
      // Update individual profile
      Object.keys(body).forEach(key => {
        if (key !== 'id' && body[key] !== undefined) {
          registration[key] = body[key];
        }
      });
      registration.profileCompleted = true;
    } else if (registration.registrationType === 'group') {
      // Update group photo if provided
      if (body.teamPhoto !== undefined) {
        registration.teamPhoto = body.teamPhoto;
      }
      // Update group/club logo if provided
      if (body.teamLogo !== undefined) {
        registration.teamLogo = body.teamLogo;
      }
      
      // Update group members if provided
      if (body.members) {
        body.members.forEach((updatedMember) => {
          const memberIndex = registration.members.findIndex(
            m => m._id.toString() === updatedMember._id
          );
          if (memberIndex !== -1) {
            // Update all fields for this member
            Object.keys(updatedMember).forEach(key => {
              if (updatedMember[key] !== undefined) {
                registration.members[memberIndex][key] = updatedMember[key];
              }
            });
            registration.members[memberIndex].profileCompleted = true;
          }
        });
        registration.markModified('members');
        
        // Check if all members have completed profiles
        const allCompleted = registration.members.every(m => m.profileCompleted);
        if (allCompleted) {
          registration.profileCompleted = true;
        }
      }
    }

    await registration.save();
    return ok({ 
      registration: toJSON(registration),
      message: 'Profile updated successfully'
    });
  });
}
