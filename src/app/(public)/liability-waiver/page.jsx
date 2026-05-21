export const metadata = {
  title: 'Liability Waiver | Trailstorm 2026 — Angels & Roadsters',
  description: 'Participant and attendee liability waivers for Trailstorm 2026 — Jaisalmer Desert Edition, organized by Angels & Roadsters.',
};

const RIDER_WAIVER = {
  heading: 'TRAILSTORM 2026 — PARTICIPANT LIABILITY WAIVER',
  sub: '(For Riders / Competitors)',
  intro: [
    'I, the undersigned participant, voluntarily agree to participate in “Trailstorm 2026 – Jaisalmer Desert Edition” organized by Angels & Roadsters.',
    'I understand and acknowledge that off-road riding, racing activities, endurance challenges, obstacle events, and all associated activities involve inherent risks including but not limited to serious injury, permanent disability, damage to property, or death.',
    'By registering and participating in this event, I agree to the following:',
  ],
  clauses: [
    'I am participating entirely at my own risk and responsibility.',
    'I confirm that I possess a valid driving license suitable for the motorcycle category I will be riding.',
    'I confirm that I am medically and physically fit to participate in off-road and endurance riding activities.',
    'I understand that desert terrain, sand dunes, weather conditions, technical obstacles, and rider errors may create hazardous situations.',
    'I agree to wear proper riding and safety gear at all times during participation, including helmet, riding boots, gloves, and protective equipment.',
    'I accept full responsibility for any damage caused to: Myself, My motorcycle, Other participants, Event property, Public or private property.',
    'I understand that the organizers may provide technical or mechanical assistance; however, all repair costs, spare parts, damages, towing, fuel, accommodation, food, and personal expenses remain my responsibility unless specifically mentioned otherwise.',
    'I release and hold harmless Angels & Roadsters, Trailstorm, event organizers, sponsors, volunteers, marshals, venue owners, partners, and associated personnel from any liability, claims, legal disputes, losses, injuries, accidents, theft, or damages arising directly or indirectly from my participation.',
    'I agree to follow all event rules, marshal instructions, safety protocols, and competition guidelines. Failure to comply may result in disqualification without refund.',
    'I grant permission to Angels & Roadsters and Trailstorm to use photographs, videos, drone footage, interviews, and media captured during the event for promotional and marketing purposes without compensation.',
    'I understand that registrations are non-refundable unless officially stated by the organizers.',
  ],
  outro: 'By checking the acceptance box and submitting my registration, I confirm that I have read, understood, and voluntarily accepted this liability waiver.',
};

const ATTENDEE_WAIVER = {
  heading: 'TRAILSTORM 2026 — ATTENDEE & SPECTATOR LIABILITY WAIVER',
  sub: '(For Visitors / Viewers / Non-Participants)',
  intro: [
    'I, the undersigned attendee/spectator, voluntarily agree to attend “Trailstorm 2026 – Jaisalmer Desert Edition” organized by Angels & Roadsters.',
    'I understand that the event includes motorcycle riding activities, racing competitions, stunt zones, moving vehicles, off-road terrain, loud environments, and public gathering areas which may involve certain risks.',
    'By attending this event, I agree to the following:',
  ],
  clauses: [
    'I am attending the event voluntarily and at my own risk.',
    'I understand that I must remain within designated spectator and attendee zones at all times.',
    'I agree to follow all safety instructions, barriers, announcements, and marshal directions during the event.',
    'I understand that the organizers are not responsible for: Personal injuries, Theft or loss of belongings, Damage to personal property, Accidents caused by negligence or violation of safety instructions.',
    'I acknowledge that desert conditions, weather, terrain, dust, and moving motorcycles may create potentially hazardous situations.',
    'I release and hold harmless Angels & Roadsters, Trailstorm, organizers, sponsors, volunteers, venue owners, partners, and associated personnel from any liability, claims, damages, injuries, or legal disputes arising from my attendance at the event.',
    'I understand that photographs and videos may be captured during the event, and I grant permission for my image or likeness to appear in promotional or marketing material without compensation.',
    'I understand that attendee passes are non-refundable unless officially stated otherwise by the organizers.',
  ],
  outro: 'By checking the acceptance box and submitting my registration, I confirm that I have read, understood, and voluntarily accepted this attendee liability waiver.',
};

function WaiverSection({ waiver }) {
  return (
    <section className="card p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-terra-400">{waiver.heading}</h2>
        <p className="text-charcoal-400 text-sm mt-1">{waiver.sub}</p>
      </div>

      <div className="space-y-3 text-charcoal-200 leading-relaxed text-sm sm:text-base">
        {waiver.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <ol className="space-y-3 list-decimal pl-5 text-charcoal-200 text-sm sm:text-base leading-relaxed">
        {waiver.clauses.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ol>

      <p className="text-charcoal-200 text-sm sm:text-base leading-relaxed font-medium border-t border-charcoal-800 pt-4">
        {waiver.outro}
      </p>
    </section>
  );
}

export default function LiabilityWaiverPage() {
  return (
    <div className="container-x pt-28 sm:pt-32 pb-20 max-w-4xl">
      <p className="eyebrow mb-2">LEGAL</p>
      <h1 className="section-title">Liability Waiver</h1>
      <p className="text-charcoal-400 mt-3 mb-8">
        Trailstorm 2026 — Jaisalmer Desert Edition. Please read both waivers carefully before
        registering for the event.
      </p>

      <div className="space-y-8">
        <WaiverSection waiver={RIDER_WAIVER} />
        <WaiverSection waiver={ATTENDEE_WAIVER} />
      </div>
    </div>
  );
}
