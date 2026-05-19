'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Subscribed — check your inbox soon.');
    setEmail('');
  };
  return (
    <form className="card p-2 flex max-w-md" onSubmit={submit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email — get drops & event invites"
        className="flex-1 bg-transparent px-3 text-sm outline-none placeholder-charcoal-500"
      />
      <button type="submit" className="btn btn-gold text-xs px-5 h-10">Subscribe</button>
    </form>
  );
}
