'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginMutation } from '@/store/api';
import toast from 'react-hot-toast';

function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || sp.get('redirect') || '/dashboard';
  const message = sp.get('message');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form).unwrap();
      toast.success('Welcome back!');
      router.push(next);
    } catch (err) {
      toast.error(err?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-4xl font-display">WELCOME BACK</h1>
        <p className="text-charcoal-400 mt-2">Sign in to continue your adventure.</p>
        {message && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-400">
            {message}
          </div>
        )}
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <button type="submit" disabled={isLoading} className="btn btn-gold w-full h-12">
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
      <p className="text-sm text-charcoal-400">
        No account? <Link href="/register" className="text-terra-400">Sign up</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md animate-pulse text-charcoal-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
