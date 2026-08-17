'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRegisterMutation } from '@/store/api';
import toast from 'react-hot-toast';

function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [register, { isLoading }] = useRegisterMutation();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || sp.get('redirect') || '/dashboard';

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(form).unwrap();
      toast.success('Account created!');
      router.push(next);
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-4xl font-display">JOIN THE CREW</h1>
        <p className="text-charcoal-400 mt-2">Create your account.</p>
      </div>
      <div>
        <label className="label">Name</label>
        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" minLength="6" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
        {isLoading ? 'Creating...' : 'Create Account'}
      </button>
      <p className="text-sm text-charcoal-400">
        Have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-terra-400">Sign in</Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md animate-pulse text-charcoal-400">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
