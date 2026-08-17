'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMeQuery, useMyAffiliateQuery, useApplyAffiliateMutation } from '@/store/api';
import toast from 'react-hot-toast';

const PERKS = [
  ['🔗', 'Your own share link', 'Get a unique referral URL the moment you join.'],
  ['🏷️', 'Followers save', 'People who use your link get a discount at checkout.'],
  ['💸', 'You earn', 'Earn commission on every sale from your link, paid after a 7-day hold.'],
];

export default function AffiliateJoinPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useMeQuery();
  const { data: affData, isLoading: affLoading } = useMyAffiliateQuery(undefined, { skip: !me?.user });
  const [apply, { isLoading: submitting }] = useApplyAffiliateMutation();
  const user = me?.user;

  const [form, setForm] = useState({
    displayName: '', phone: '', instagram: '', youtube: '', otherSocial: '',
    audienceSize: '', promoDescription: '', payoutUpiId: '', payoutName: '',
  });
  const [agree, setAgree] = useState(false);

  // Auto-fill contact details from the account once loaded.
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        displayName: f.displayName || user.name || '',
        phone: f.phone || user.phone || '',
        payoutName: f.payoutName || user.name || '',
      }));
    }
  }, [user]);

  // Already enrolled → send them to their dashboard.
  useEffect(() => {
    if (affData?.affiliate) router.replace('/dashboard/affiliate');
  }, [affData, router]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!agree) return toast.error('Please accept the affiliate terms to continue.');
    try {
      await apply(form).unwrap();
      toast.success('You\'re in! Here\'s your affiliate dashboard.');
      router.push('/dashboard/affiliate');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not submit application');
    }
  };

  if (meLoading || (user && affLoading)) {
    return <div className="animate-pulse text-charcoal-400">Loading...</div>;
  }

  // Not signed in — gate behind login/signup, returning here afterward.
  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <p className="eyebrow mb-2">AFFILIATE PROGRAM</p>
        <h1 className="text-4xl sm:text-5xl font-display mb-4">Ride. Refer. Earn.</h1>
        <p className="text-charcoal-400 mb-8">
          Share Angels &amp; Roadsters with your community — your followers save, and you earn commission on every sale.
        </p>
        <div className="grid gap-3 mb-8 text-left">
          {PERKS.map(([i, t, d]) => (
            <div key={t} className="card p-4 flex gap-3">
              <span className="text-2xl">{i}</span>
              <div><div className="font-semibold">{t}</div><div className="text-sm text-charcoal-400">{d}</div></div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login?next=/affiliate/join" className="btn btn-gold h-12 px-6">Sign in to join</Link>
          <Link href="/register?next=/affiliate/join" className="btn btn-outline h-12 px-6">Create an account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="eyebrow mb-2">AFFILIATE PROGRAM</p>
      <h1 className="text-4xl sm:text-5xl font-display mb-2">Join the affiliate program</h1>
      <p className="text-charcoal-400 mb-8">
        Signed in as <span className="text-terra-400">{user.email}</span>. Tell us a bit about how you'll promote —
        you'll get your share link right after submitting.
      </p>

      <form onSubmit={submit} className="card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Display name</label>
            <input className="input" value={form.displayName} onChange={set('displayName')} placeholder="Public name / handle" required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={set('phone')} placeholder="Contact number" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Instagram</label>
            <input className="input" value={form.instagram} onChange={set('instagram')} placeholder="@handle or URL" />
          </div>
          <div>
            <label className="label">YouTube</label>
            <input className="input" value={form.youtube} onChange={set('youtube')} placeholder="Channel URL" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Other platform / website</label>
            <input className="input" value={form.otherSocial} onChange={set('otherSocial')} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Audience size</label>
            <input className="input" value={form.audienceSize} onChange={set('audienceSize')} placeholder="e.g. 10k followers" />
          </div>
        </div>

        <div>
          <label className="label">How will you promote?</label>
          <textarea className="input min-h-[90px]" value={form.promoDescription} onChange={set('promoDescription')} placeholder="Reels, ride communities, club WhatsApp groups, blog..." />
        </div>

        <div className="border-t border-charcoal-800 pt-5">
          <p className="text-sm font-semibold mb-1">Payout details</p>
          <p className="text-xs text-charcoal-500 mb-4">Commission is transferred manually via UPI after a 7-day hold on each sale.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">UPI ID</label>
              <input className="input" value={form.payoutUpiId} onChange={set('payoutUpiId')} placeholder="name@bank" />
            </div>
            <div>
              <label className="label">Account holder name</label>
              <input className="input" value={form.payoutName} onChange={set('payoutName')} placeholder="As per UPI account" />
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 text-sm text-charcoal-300">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
          <span>I agree to the affiliate program terms. Discount and commission rates are set by Angels &amp; Roadsters and may change.</span>
        </label>

        <button type="submit" disabled={submitting} className="btn btn-gold w-full h-12">
          {submitting ? 'Submitting...' : 'Join & get my link'}
        </button>
      </form>
    </div>
  );
}
