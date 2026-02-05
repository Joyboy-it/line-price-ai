import { query } from '@/lib/db';
import BranchList from './BranchList';

interface Branch {
  id: string;
  name: string;
  code: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function getBranches(): Promise<Branch[]> {
  return query<Branch>(
    `SELECT * FROM branches ORDER BY sort_order, name`
  );
}

export default async function BranchesPage() {
  const branches = await getBranches();

  return <BranchList branches={branches} />;
}
