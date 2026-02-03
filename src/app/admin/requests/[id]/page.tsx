import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { AccessRequest, User, PriceGroup } from '@/types';
import { formatDateTime } from '@/lib/utils';
import ApproveForm from './ApproveForm';
import UserInfoFormWrapper from './UserInfoFormWrapper';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAccessRequest(id: string): Promise<(AccessRequest & { user: User }) | null> {
  return queryOne<AccessRequest & { user: User }>(
    `SELECT ar.*, 
      json_build_object(
        'id', u.id, 'name', u.name, 'email', u.email, 'image', u.image,
        'shop_name', u.shop_name, 'phone', u.phone, 'address', u.address,
        'bank_info', u.bank_info, 'note', u.note
      ) as user,
      json_build_object(
        'id', ar_branch.id, 'name', ar_branch.name, 'code', ar_branch.code
      ) as requested_branch,
      json_agg(
        json_build_object(
          'id', b.id, 'name', b.name, 'code', b.code
        )
      ) as branches
     FROM access_requests ar
     JOIN users u ON u.id = ar.user_id
     LEFT JOIN branches ar_branch ON ar_branch.id = ar.branch_id
     LEFT JOIN user_branches ub ON ub.user_id = u.id
     LEFT JOIN branches b ON b.id = ub.branch_id
     WHERE ar.id = $1
     GROUP BY ar.id, u.id, u.name, u.email, u.image, u.shop_name, u.phone, u.address, u.bank_info, u.note, ar_branch.id, ar_branch.name, ar_branch.code`,
    [id]
  );
}

async function getAllPriceGroups(): Promise<PriceGroup[]> {
  return query<PriceGroup>(
    `SELECT * FROM price_groups WHERE is_active = true ORDER BY sort_order, name`
  );
}

async function getAllBranches() {
  return query<{ id: string; name: string; code: string }>(
    `SELECT id, name, code FROM branches WHERE is_active = true ORDER BY sort_order, name`
  );
}

export default async function RequestDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    redirect('/');
  }

  const request = await getAccessRequest(id);
  if (!request) {
    notFound();
  }

  const [priceGroups, branches] = await Promise.all([
    getAllPriceGroups(),
    getAllBranches(),
  ]);

  const user = typeof request.user === 'object' ? request.user : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 relative">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลผู้ใช้</h2>
            
            {user && <UserInfoFormWrapper user={user} />}
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">ชื่อผู้ใช้</label>
                <p className="text-gray-800 font-medium">{user?.name || 'ไม่ระบุ'}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">ชื่อร้าน</label>
                <p className="text-gray-800">{user?.shop_name || 'ไม่ระบุ'}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">เบอร์โทร</label>
                <p className="text-gray-800">{user?.phone || 'ไม่ระบุ'}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">ที่อยู่</label>
                <p className="text-gray-800 text-sm">{user?.address || 'ไม่ระบุ'}</p>
              </div>

              {user?.bank_info && (
                <div>
                  <label className="text-xs font-medium text-gray-500">ข้อมูลธนาคาร</label>
                  <div className="text-sm text-gray-800">
                    {typeof user.bank_info === 'object' ? (
                      <>
                        <p>ธนาคาร: {user.bank_info.bank_name || 'ไม่ระบุ'}</p>
                        <p>เลขบัญชี: {user.bank_info.bank_account || 'ไม่ระบุ'}</p>
                      </>
                    ) : (
                      <p>{user.bank_info}</p>
                    )}
                  </div>
                </div>
              )}

              {user?.note && (
                <div>
                  <label className="text-xs font-medium text-gray-500">หมายเหตุ</label>
                  <p className="text-sm text-gray-800">{user.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request Info Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">รายละเอียดคำขอ</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">ชื่อร้าน</label>
                <p className="text-gray-800 font-medium">{request.shop_name}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">วันที่ส่งคำขอ</label>
                <p className="text-gray-800">{formatDateTime(request.created_at)}</p>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">หมายเหตุ</label>
                <p className="text-gray-800">{request.note || 'ไม่มี'}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">สาขาที่กรอกคำขอ</label>
                <div className="mt-1">
                  {request.requested_branch ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {request.requested_branch.name}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">ไม่ระบุ</span>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">สาขาที่เลือก</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {request.branches && request.branches.length > 0 ? (
                    request.branches.map((branch: any) => (
                      <span key={branch.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {branch.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">ยังไม่ได้เลือกสาขา</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">สถานะ</label>
                <p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'approved' ? 'bg-green-100 text-green-700' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {request.status === 'approved' ? 'อนุมัติแล้ว' :
                     request.status === 'rejected' ? 'ปฏิเสธแล้ว' : 'รออนุมัติ'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {request.status === 'pending' && (
        <ApproveForm 
          requestId={id} 
          userId={request.user_id} 
          priceGroups={priceGroups}
          branches={branches}
        />
      )}

      {request.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800">คำขอนี้ได้รับการอนุมัติแล้ว</p>
          {request.reviewed_at && (
            <p className="text-sm text-green-600 mt-2">
              อนุมัติเมื่อ {formatDateTime(request.reviewed_at)}
            </p>
          )}
        </div>
      )}

      {request.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">คำขอนี้ถูกปฏิเสธ</p>
          {request.reject_reason && (
            <p className="text-sm text-red-600 mt-2">เหตุผล: {request.reject_reason}</p>
          )}
          {request.reviewed_at && (
            <p className="text-sm text-red-600 mt-2">
              ปฏิเสธเมื่อ {formatDateTime(request.reviewed_at)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
