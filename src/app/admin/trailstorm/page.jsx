'use client';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useListEventsQuery,
  useListCompTicketsQuery,
  useCreateCompTicketMutation,
  useDeleteCompTicketMutation,
  useTrailstormMetricsQuery,
} from '@/store/api';

const VIP_TYPES = [
  { value: 'sponsor',         label: 'Sponsor' },
  { value: 'media',           label: 'Media' },
  { value: 'influencer',      label: 'Influencer' },
  { value: 'government',      label: 'Government Official' },
  { value: 'brand_guest',     label: 'Brand Guest' },
  { value: 'speaker',         label: 'Speaker' },
  { value: 'investor',        label: 'Investor' },
  { value: 'special_invitee', label: 'Special Invitee' },
];

const COMPETITOR_TYPES = [
  { value: 'pro_rider',           label: 'Pro Rider' },
  { value: 'brand_rider',         label: 'Brand Rider' },
  { value: 'influencer',          label: 'Influencer' },
  { value: 'special_invitee',     label: 'Special Invitee' },
  { value: 'competition_winner',  label: 'Competition Winner' },
];

const TAB_LABELS = {
  vip:                    'VIP Passes',
  club_champion:          'Club Champions',
  individual_competitor:  'Individual FOC',
};

function MetricCard({ label, value, accent, hint }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-wider text-charcoal-400">{label}</p>
      <p className={`text-2xl sm:text-3xl font-display mt-2 ${accent || 'text-white'}`}>{value ?? 0}</p>
      {hint && <p className="text-[10px] text-charcoal-500 mt-1">{hint}</p>}
    </div>
  );
}

// ============ FORMS ============

function VipForm({ eventId, onSubmit, busy }) {
  const [f, setF] = useState({ name: '', mobile: '', email: '', vipType: 'sponsor', numPasses: 1, issuedBy: '', remarks: '' });
  const set = (k, max) => (e) => setF({ ...f, [k]: max ? e.target.value.slice(0, max) : e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    onSubmit({ ...f, event: eventId, category: 'vip', numPasses: Number(f.numPasses) || 1 });
    setF({ name: '', mobile: '', email: '', vipType: f.vipType, numPasses: 1, issuedBy: f.issuedBy, remarks: '' });
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label className="label">Name *</label><input className="input" required maxLength={80} value={f.name} onChange={set('name', 80)} /></div>
      <div>
        <label className="label">Category *</label>
        <select className="input" value={f.vipType} onChange={set('vipType')}>
          {VIP_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
      </div>
      <div><label className="label">Mobile</label><input className="input" maxLength={20} value={f.mobile} onChange={set('mobile', 20)} /></div>
      <div><label className="label">Email</label><input className="input" type="email" maxLength={100} value={f.email} onChange={set('email', 100)} /></div>
      <div><label className="label">Number of passes</label><input className="input" type="number" min="1" max="100" value={f.numPasses} onChange={set('numPasses')} /></div>
      <div><label className="label">Issued by</label><input className="input" maxLength={60} value={f.issuedBy} onChange={set('issuedBy', 60)} placeholder="e.g. Teja" /></div>
      <div className="sm:col-span-2"><label className="label">Remarks</label><input className="input" maxLength={200} value={f.remarks} onChange={set('remarks', 200)} /></div>
      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" disabled={busy} className="btn btn-gold h-10 px-5">{busy ? 'Issuing…' : '+ Issue VIP pass'}</button>
      </div>
    </form>
  );
}

function ClubChampionForm({ eventId, onSubmit, busy }) {
  const [f, setF] = useState({
    clubName: '', clubId: '', issuedBy: '', remarks: '',
    champions: [
      { name: '', mobile: '', motorcycle: '' },
      { name: '', mobile: '', motorcycle: '' },
      { name: '', mobile: '', motorcycle: '' },
      { name: '', mobile: '', motorcycle: '' },
    ],
  });
  const set = (k, max) => (e) => setF({ ...f, [k]: max ? e.target.value.slice(0, max) : e.target.value });
  const setChamp = (i, k) => (e) => {
    const nx = [...f.champions];
    nx[i] = { ...nx[i], [k]: e.target.value };
    setF({ ...f, champions: nx });
  };
  const submit = (e) => {
    e.preventDefault();
    if (!f.clubName.trim()) return toast.error('Club name required');
    const named = f.champions.filter((c) => c.name.trim());
    if (named.length === 0) return toast.error('Add at least one champion');
    onSubmit({ ...f, event: eventId, category: 'club_champion' });
    setF({
      clubName: '', clubId: '', issuedBy: f.issuedBy, remarks: '',
      champions: [
        { name: '', mobile: '', motorcycle: '' }, { name: '', mobile: '', motorcycle: '' },
        { name: '', mobile: '', motorcycle: '' }, { name: '', mobile: '', motorcycle: '' },
      ],
    });
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="label">Club name *</label><input className="input" required maxLength={80} value={f.clubName} onChange={set('clubName', 80)} /></div>
        <div><label className="label">Club ID</label><input className="input" maxLength={40} value={f.clubId} onChange={set('clubId', 40)} placeholder="ticket ID or admin code" /></div>
      </div>
      <div className="space-y-2">
        <p className="eyebrow">4 champion slots</p>
        {f.champions.map((c, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_180px] gap-2">
            <input className="input" placeholder={`Champion ${i + 1} name`} value={c.name} onChange={setChamp(i, 'name')} maxLength={80} />
            <input className="input" placeholder="Mobile" value={c.mobile} onChange={setChamp(i, 'mobile')} maxLength={20} />
            <input className="input" placeholder="Motorcycle" value={c.motorcycle} onChange={setChamp(i, 'motorcycle')} maxLength={60} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="label">Issued by</label><input className="input" maxLength={60} value={f.issuedBy} onChange={set('issuedBy', 60)} /></div>
        <div><label className="label">Remarks</label><input className="input" maxLength={200} value={f.remarks} onChange={set('remarks', 200)} /></div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn btn-gold h-10 px-5">{busy ? 'Saving…' : '+ Add club champions'}</button>
      </div>
    </form>
  );
}

function IndividualForm({ eventId, onSubmit, busy }) {
  const [f, setF] = useState({
    name: '', mobile: '', email: '', motorcycle: '',
    riderCategory: 'pro_rider', reasonForFOC: '', approvedBy: '', remarks: '',
  });
  const set = (k, max) => (e) => setF({ ...f, [k]: max ? e.target.value.slice(0, max) : e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    onSubmit({ ...f, event: eventId, category: 'individual_competitor' });
    setF({ name: '', mobile: '', email: '', motorcycle: '', riderCategory: f.riderCategory, reasonForFOC: '', approvedBy: f.approvedBy, remarks: '' });
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label className="label">Rider name *</label><input className="input" required maxLength={80} value={f.name} onChange={set('name', 80)} /></div>
      <div>
        <label className="label">Category *</label>
        <select className="input" value={f.riderCategory} onChange={set('riderCategory')}>
          {COMPETITOR_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
      </div>
      <div><label className="label">Mobile</label><input className="input" maxLength={20} value={f.mobile} onChange={set('mobile', 20)} /></div>
      <div><label className="label">Email</label><input className="input" type="email" maxLength={100} value={f.email} onChange={set('email', 100)} /></div>
      <div><label className="label">Motorcycle</label><input className="input" maxLength={80} value={f.motorcycle} onChange={set('motorcycle', 80)} /></div>
      <div><label className="label">Approved by</label><input className="input" maxLength={60} value={f.approvedBy} onChange={set('approvedBy', 60)} /></div>
      <div className="sm:col-span-2"><label className="label">Reason for FOC</label><input className="input" maxLength={200} value={f.reasonForFOC} onChange={set('reasonForFOC', 200)} placeholder="e.g. Stage 1 winner 2025" /></div>
      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" disabled={busy} className="btn btn-gold h-10 px-5">{busy ? 'Saving…' : '+ Add competitor'}</button>
      </div>
    </form>
  );
}

// ============ ROW ============

function TicketRow({ t, onDelete }) {
  return (
    <tr className="hover:bg-white/[0.02]">
      <td className="p-3 font-mono text-[11px]">{t.ticketId}</td>
      <td className="p-3">
        <div className="font-semibold text-sm">{t.name}</div>
        <div className="text-[11px] text-charcoal-500">{[t.mobile, t.email].filter(Boolean).join(' · ')}</div>
      </td>
      <td className="p-3 text-xs">
        {t.category === 'vip' && <>
          <span className="badge bg-gold-500/15 text-gold-400">{(t.vipType || '').replace('_', ' ')}</span>
          <div className="text-[11px] text-charcoal-400 mt-1">{t.numPasses} pass{t.numPasses === 1 ? '' : 'es'}</div>
        </>}
        {t.category === 'club_champion' && <>
          <div className="font-medium">{t.clubName}</div>
          <div className="text-[11px] text-charcoal-500">Slot {t.slot || '?'} {t.motorcycle ? `· ${t.motorcycle}` : ''}</div>
        </>}
        {t.category === 'individual_competitor' && <>
          <span className="badge bg-terra-500/15 text-terra-400">{(t.riderCategory || '').replace('_', ' ')}</span>
          <div className="text-[11px] text-charcoal-500 mt-1">{t.motorcycle}</div>
        </>}
      </td>
      <td className="p-3 text-xs text-charcoal-400">{t.issuedBy || t.approvedBy || '—'}</td>
      <td className="p-3 text-xs text-charcoal-400 max-w-[200px] truncate">{t.remarks || t.reasonForFOC || '—'}</td>
      <td className="p-3 text-right">
        <button onClick={() => onDelete(t)} className="text-red-400 hover:text-red-300 text-xs">Revoke</button>
      </td>
    </tr>
  );
}

// ============ PAGE ============

export default function AdminTrailstormPage() {
  const { data: eventsData } = useListEventsQuery();
  const events = useMemo(() => eventsData?.events || [], [eventsData]);
  const [eventId, setEventId] = useState('');
  useEffect(() => {
    if (!eventId && events.length) {
      // Prefer a Trailstorm event when present
      const ts = events.find((e) => e.slug?.includes('trailstorm')) || events[0];
      setEventId(ts._id);
    }
  }, [events, eventId]);

  const [tab, setTab] = useState('vip');

  const { data: metricsData } = useTrailstormMetricsQuery({ event: eventId }, { skip: !eventId });
  const m = metricsData?.metrics || {};

  const { data: ticketsData, isFetching } = useListCompTicketsQuery(
    { event: eventId, category: tab },
    { skip: !eventId }
  );
  const tickets = ticketsData?.compTickets || [];

  const [createTicket, { isLoading: creating }] = useCreateCompTicketMutation();
  const [deleteTicket] = useDeleteCompTicketMutation();

  const onCreate = async (payload) => {
    try {
      await createTicket(payload).unwrap();
      toast.success('Saved');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed');
    }
  };

  const onDelete = async (t) => {
    if (!confirm(`Revoke ${t.ticketId} (${t.name})?`)) return;
    try {
      await deleteTicket(t._id).unwrap();
      toast.success('Revoked');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">EVENT OPERATIONS</p>
          <h1 className="text-3xl sm:text-4xl font-display">Trailstorm · Comp Tickets</h1>
          <p className="text-charcoal-400 text-sm mt-1">Issue VIP passes, name club champions, and approve individual FOC entries.</p>
        </div>
        <select className="input w-full sm:w-72" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">Select an event…</option>
          {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
        <MetricCard label="VIP passes issued (FOC)"   value={m.vipPassesFoc}        accent="text-gold-400" />
        <MetricCard label="Club Champions PAID"       value={m.clubChampionsPaid}   accent="text-emerald-400" hint={`${m.paidGroupRegs ?? 0} paid clubs × 4 seats`} />
        <MetricCard label="FOC Competitors (Indiv.)"  value={m.focCompetitors}      accent="text-terra-400" />
        <MetricCard label="FOC Clubs"                 value={m.focClubs}            accent="text-purple-400" />
        <MetricCard label="Paid Competitors"          value={m.paidCompetitors}     accent="text-emerald-400" />
        <MetricCard label="Paid Tickets Sold"         value={m.paidTickets}         accent="text-emerald-400" />
        <MetricCard label="Total Registrations"       value={m.totalIncludingFoc}   accent="text-white" hint={`${m.totalRegistrations ?? 0} paid + ${(m.vipPassesFoc || 0) + (m.clubChampionsFoc || 0) + (m.focCompetitors || 0)} FOC`} />
      </div>

      {!eventId ? (
        <div className="card p-10 text-center text-charcoal-400">Pick an event above to start issuing complimentary entries.</div>
      ) : (
        <>
          {/* TABS */}
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
            {Object.entries(TAB_LABELS).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`chip whitespace-nowrap ${tab === k ? 'border-terra-500 text-terra-400' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* FORM */}
          <div className="card p-5 sm:p-6 mb-6">
            <h2 className="font-display text-xl mb-1">Issue new {TAB_LABELS[tab].toLowerCase()}</h2>
            <p className="text-xs text-charcoal-400 mb-4">
              {tab === 'vip' && 'Sponsors / Media / Influencers / Officials / Brand Guests / Speakers / Investors / Special Invitees.'}
              {tab === 'club_champion' && 'Each registered club gets 4 free champion rider entries — name the 4 slots.'}
              {tab === 'individual_competitor' && 'Pro riders, brand riders, influencers, special invitees, competition winners.'}
            </p>
            {tab === 'vip' && <VipForm eventId={eventId} onSubmit={onCreate} busy={creating} />}
            {tab === 'club_champion' && <ClubChampionForm eventId={eventId} onSubmit={onCreate} busy={creating} />}
            {tab === 'individual_competitor' && <IndividualForm eventId={eventId} onSubmit={onCreate} busy={creating} />}
          </div>

          {/* LIST */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-charcoal-800/60 text-xs text-charcoal-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Ticket</th>
                  <th className="text-left p-3">Name / Contact</th>
                  <th className="text-left p-3">Details</th>
                  <th className="text-left p-3">Issued by</th>
                  <th className="text-left p-3">Notes</th>
                  <th className="text-right p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {isFetching && (
                  <tr><td colSpan={6} className="p-8 text-center text-charcoal-400">Loading…</td></tr>
                )}
                {!isFetching && tickets.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-charcoal-400">No {TAB_LABELS[tab].toLowerCase()} issued yet.</td></tr>
                )}
                {!isFetching && tickets.map((t) => <TicketRow key={t._id} t={t} onDelete={onDelete} />)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
