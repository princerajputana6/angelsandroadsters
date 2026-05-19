import { cookies } from 'next/headers';
import { clearAuthCookies } from '@/lib/auth';
import { ok } from '@/lib/apiUtils';

export async function POST() {
  clearAuthCookies(cookies());
  return ok({ message: 'Logged out' });
}
