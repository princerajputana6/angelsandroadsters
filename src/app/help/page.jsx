'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMeQuery } from '@/store/api';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'booking', label: '🎫 Booking Issue' },
  { value: 'payment', label: '💳 Payment Problem' },
  { value: 'technical', label: '⚙️ Technical Issue' },
  { value: 'general', label: '💬 General Enquiry' },
  { value: 'other', label: '📋 Other' },
];

const FAQS = [
  { q: "How do I get my QR code?", a: "Complete your profile from the booking confirmation page. Once your profile is 100% complete, your QR code will be generated automatically." },
  { q: "I paid but my status still shows Pending.", a: "Payment verification usually takes a few seconds. Try refreshing your booking page. If it persists beyond 10 minutes, raise a support ticket with your payment ID." },
  { q: "Can I change my registration type?", a: "Registration types cannot be changed after booking. Please raise a ticket and our team will assist you with cancellations or modifications." },
  { q: "My image upload is failing.", a: "Make sure your image is under 5 MB and in JPG, PNG, or WebP format. Avoid uploading PDFs for rider photos." },
  { q: "How do I transfer my ticket to someone else?", a: "Tickets are non-transferable as per our policy. Contact support if you have an exceptional circumstance." },
  { q: "I didn't receive a confirmation email.", a: "Check your spam/junk folder. If you still can't find it, raise a ticket and we'll resend the confirmation." },
];

// Separated into its own component so it can be wrapped in <Suspense>
// (useSearchParams() cannot run during static prerender without a boundary)
function SearchParamPrefill({ onPrefill }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const tid = searchParams.get('bookingTicketId');
    if (tid) onPrefill(tid);
  }, [searchParams, onPrefill]);
  return null;
}

function HelpPageInner() {
  const { data: meData } = useMeQuery();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', category: 'general', message: '', bookingTicketId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const handlePrefill = (tid) => {
    setForm((prev) => ({ ...prev, bookingTicketId: tid, category: 'booking' }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      setSubmitted(data.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container-x max-w-2xl mx-auto text-center">
          <div className="card-glass p-10">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="font-display text-3xl mb-3 text-green-400">Ticket Raised Successfully!</h1>
            <p className="text-charcoal-300 mb-2">
              Your support ticket has been received. We'll get back to you within <strong>24–48 hours</strong>.
            </p>
            <div className="bg-charcoal-900 rounded-xl p-4 my-6 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-400">Ticket ID</span>
                <span className="font-mono text-terra-400 font-bold">{submitted.ticketRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Subject</span>
                <span className="font-semibold">{submitted.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-400">Status</span>
                <span className="text-yellow-400 capitalize">{submitted.status}</span>
              </div>
            </div>
            <p className="text-xs text-charcoal-400 mb-6">
              A confirmation email has been sent to <strong>{submitted.email}</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {meData?.user && (
                <Link href="/dashboard/support" className="btn btn-gold">View My Tickets</Link>
              )}
              <Link href="/" className="btn btn-outline">Go Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Reads ?bookingTicketId= and pre-fills the form — needs Suspense */}
      <Suspense fallback={null}>
        <SearchParamPrefill onPrefill={handlePrefill} />
      </Suspense>

      <div className="container-x max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="eyebrow mb-2">SUPPORT</p>
          <h1 className="section-title mb-3">Help & Support</h1>
          <p className="text-charcoal-400 max-w-xl mx-auto">
            Have a question about your booking, payment, or the event? We're here to help.
            Raise a ticket and our team will respond within 24–48 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Raise Ticket Form */}
          <div>
            <div className="card-glass p-6 sm:p-8">
              <h2 className="font-display text-2xl mb-1">Raise a Ticket</h2>
              <p className="text-charcoal-400 text-sm mb-6">Tell us what's going on and we'll sort it out.</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Your Name *</label>
                    <input
                      className="input" name="name" required
                      value={form.name} onChange={handleChange}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      className="input" name="email" type="email" required
                      value={form.email} onChange={handleChange}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone</label>
                    <input
                      className="input" name="phone"
                      value={form.phone} onChange={handleChange}
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <div>
                    <label className="label">Category *</label>
                    <select className="input" name="category" value={form.category} onChange={handleChange}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Booking Ticket ID (optional)</label>
                  <input
                    className="input" name="bookingTicketId"
                    value={form.bookingTicketId} onChange={handleChange}
                    placeholder="e.g. TR-ABCD1234"
                  />
                  <p className="text-xs text-charcoal-500 mt-1">Fill this if your issue is related to a specific booking</p>
                </div>

                <div>
                  <label className="label">Subject *</label>
                  <input
                    className="input" name="subject" required
                    value={form.subject} onChange={handleChange}
                    placeholder="Brief subject of your issue"
                  />
                </div>

                <div>
                  <label className="label">Message *</label>
                  <textarea
                    className="input" name="message" required rows={5}
                    value={form.message} onChange={handleChange}
                    placeholder="Describe your issue in detail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-gold w-full"
                >
                  {submitting ? 'Submitting…' : '🎫 Submit Support Ticket'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-charcoal-800 space-y-2 text-sm text-charcoal-400">
                <p>📧 <a href="mailto:info@angelsandroadsters.com" className="text-terra-400 hover:underline">info@angelsandroadsters.com</a></p>
                <p>📞 <a href="tel:+918384099474" className="text-terra-400 hover:underline">+91 83840 99474</a></p>
                <p>🕐 Response time: 24–48 hours</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="font-display text-2xl mb-5">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="card border border-charcoal-800/60">
                  <button
                    type="button"
                    className="w-full text-left flex items-center justify-between p-4 font-semibold text-sm"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className="text-terra-400 ml-3 shrink-0">
                      {openFaq === i ? '▲' : '▼'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-charcoal-300 border-t border-charcoal-800/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {meData?.user && (
              <div className="mt-6 card p-4 bg-terra-500/5 border border-terra-500/20">
                <h4 className="font-semibold text-terra-400 mb-1">View your previous tickets</h4>
                <p className="text-xs text-charcoal-400 mb-3">Track replies and manage your open support requests.</p>
                <Link href="/dashboard/support" className="btn btn-outline text-xs px-4 py-2">
                  My Support Tickets →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return <HelpPageInner />;
}
