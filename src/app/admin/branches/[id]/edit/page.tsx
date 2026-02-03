import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditBranchForm from './EditBranchForm';

export default async function EditBranchPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    redirect('/');
  }

  return <EditBranchForm />;
}
