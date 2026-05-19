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
      <form className="card p-6 mt-6 space-y-4" onSubmit={submit}>
        <div><label className="label">Name</label><input className="input" required /></div>
        <div><label className="label">Email</label><input className="input" type="email" required /></div>
        <div><label className="label">Message</label><textarea className="input" rows="5" required /></div>
        <button type="submit" className="btn btn-gold">Send Message</button>
      </form>
    </div>
  );
}
