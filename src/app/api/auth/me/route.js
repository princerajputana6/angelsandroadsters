import { getCurrentUser } from '@/lib/auth';
import { ok } from '@/lib/apiUtils';

export async function GET() {
  const user = await getCurrentUser();
  return ok({ user });
}
