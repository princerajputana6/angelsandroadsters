'use client';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const submit = (e) => {
    e.preventDefault();
    toast.success('Thanks! We will be in touch.');
  };
  return (
    <div className="container-x pt-28 sm:pt-32 pb-16 max-w-2xl">
      <p className="eyebrow mb-2">CONTACT</p>
      <h1 className="section-title">GET IN TOUCH</h1>
      <p className="text-charcoal-400 mt-3">Have a question, a partnership idea, or want to host an event with us?</p>
      <p className="mt-4 text-sm text-charcoal-300">
        Email us at{' '}
        <a href="mailto:info@angelsandroadsters.com" className="text-terra-400 hover:underline">
          info@angelsandroadsters.com
        </a>
      </p>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <a href="https://www.instagram.com/angels_roadsters" target="_blank" rel="noopener noreferrer" className="chip hover:border-terra-500 hover:text-terra-400 transition">Instagram</a>
        <a href="https://www.instagram.com/trailstormofficial" target="_blank" rel="noopener noreferrer" className="chip hover:border-terra-500 hover:text-terra-400 transition">Trailstorm Instagram</a>
        <a href="https://www.youtube.com/@angels_roadsters" target="_blank" rel="noopener noreferrer" className="chip hover:border-terra-500 hover:text-terra-400 transition">YouTube</a>
      </div>
      <form className="card p-6 mt-6 space-y-4" onSubmit={submit}>
        <div><label className="label">Name</label><input className="input" required /></div>
        <div><label className="label">Email</label><input className="input" type="email" required /></div>
        <div><label className="label">Message</label><textarea className="input" rows="5" required /></div>
        <button type="submit" className="btn btn-gold">Send Message</button>
      </form>
    </div>
  );
}
