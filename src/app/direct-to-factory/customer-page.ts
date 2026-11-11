import { redirect } from 'next/navigation';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isApprovedCustomer } from '@/lib/direct-to-factory/customer-access';

/** Customer pages are outside the /admin middleware, so each page checks the session itself. */
export async function getCustomerPageSession(): Promise<{ session: Session; approved: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  return { session, approved: await isApprovedCustomer(session.user.id) };
}
