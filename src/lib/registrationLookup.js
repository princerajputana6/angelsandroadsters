import Registration from '@/lib/models/Registration';

// Resolve a registration ID (TR-…) to a single person. An ID can be:
//   • a registration's own ticketId  → individual / visitor / staff /
//     volunteer / organizer (or a group as a whole), or
//   • a group member's registrationId → one person inside a group.
//
// `groupKey` is the parent registration's _id — identical for every member of
// the same group, so callers can enforce "all guests belong to the same group".
export async function lookupRegistration(rawId) {
  const id = String(rawId || '').trim().toUpperCase();
  if (!id) return null;

  // Direct ticketId match (single-person registrations, or the group itself).
  const byTicket = await Registration.findOne({ ticketId: id }).lean();
  if (byTicket) {
    const person = byTicket.registrationType === 'group'
      ? {
          name: byTicket.groupLeader?.name || byTicket.teamCaptainName || byTicket.groupName || '',
          email: byTicket.groupLeader?.email || byTicket.teamCaptainEmail || byTicket.email || '',
          phone: byTicket.groupLeader?.phone || byTicket.teamCaptainMobile || byTicket.phone || '',
        }
      : { name: byTicket.name || '', email: byTicket.email || '', phone: byTicket.phone || '' };

    return {
      registrationId: id,
      type: byTicket.registrationType,
      status: byTicket.status,
      groupKey: String(byTicket._id),
      isGroupWhole: byTicket.registrationType === 'group',
      eventId: String(byTicket.event),
      person,
    };
  }

  // Member match (a person inside a group).
  const byMember = await Registration.findOne({ 'members.registrationId': id }).lean();
  if (byMember) {
    const member = (byMember.members || []).find((m) => String(m.registrationId).toUpperCase() === id);
    if (member) {
      return {
        registrationId: id,
        type: 'group',
        status: member.status || byMember.status,
        groupKey: String(byMember._id),
        isGroupWhole: false,
        eventId: String(byMember.event),
        person: { name: member.name || '', email: member.email || '', phone: member.phone || '' },
      };
    }
  }

  return null;
}
