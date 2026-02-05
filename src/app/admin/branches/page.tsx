import { query } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>
      <BranchList branches={branches} />
    </div>
  );
}
