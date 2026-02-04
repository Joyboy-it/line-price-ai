# สรุปการอัปเดต Permission System

## ✅ ไฟล์ที่อัปเดตแล้ว
1. `/lib/permissions.ts` - สร้าง helper functions สำหรับตรวจสอบสิทธิ์
2. `/api/admin/users/[id]/route.ts` - ใช้ `hasPermission(role, 'manage_users')`
3. `/api/admin/upload/route.ts` - ใช้ `hasPermission(role, 'upload_images')`

## 📋 ไฟล์ที่ต้องอัปเดตต่อ

### Manage Branches (manage_branches)
- `/api/admin/branches/route.ts`
- `/api/admin/branches/[id]/route.ts`

### Manage Price Groups (manage_price_groups)
- `/api/admin/price-groups/route.ts`
- `/api/admin/price-groups/[id]/route.ts`
- `/api/admin/price-groups/[id]/images/route.ts`

### Manage Announcements (manage_announcements)
- `/api/admin/announcements/route.ts`
- `/api/admin/announcements/[id]/route.ts`
- `/api/admin/announcements/[id]/images/route.ts`

### Approve Requests (approve_requests)
- `/api/access-requests/[id]/approve/route.ts`
- `/api/access-requests/[id]/reject/route.ts`

### View Analytics (view_analytics)
- `/api/admin/analytics/route.ts`

### Manage Users (manage_users)
- `/api/admin/users/[id]/branches/route.ts`
- `/api/admin/users/[id]/groups/route.ts`
- `/api/admin/users/[id]/groups/[groupId]/route.ts`

### View Dashboard (view_dashboard)
- ทุกหน้าใน `/admin/*` ต้องเช็ค `canAccessAdmin(role)`

## 🔧 วิธีอัปเดต

### สำหรับ API Routes:
```typescript
// เดิม
if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ใหม่
import { hasPermission } from '@/lib/permissions';

if (!session?.user || !hasPermission(session.user.role, 'permission_name')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### สำหรับ Admin Pages:
```typescript
// เดิม
if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
  redirect('/');
}

// ใหม่
import { canAccessAdmin, hasPermission } from '@/lib/permissions';

if (!session?.user || !canAccessAdmin(session.user.role)) {
  redirect('/');
}

// หรือเช็คสิทธิ์เฉพาะ
if (!session?.user || !hasPermission(session.user.role, 'permission_name')) {
  redirect('/admin');
}
```

## 📊 สรุปสิทธิ์แต่ละ Role

| Permission | Admin | Operator | Worker | User |
|-----------|-------|----------|--------|------|
| view_dashboard | ✅ | ✅ | ✅ | ❌ |
| manage_users | ✅ | ✅ | ❌ | ❌ |
| manage_branches | ✅ | ✅ | ❌ | ❌ |
| manage_price_groups | ✅ | ✅ | ❌ | ❌ |
| upload_images | ✅ | ✅ | ✅ | ❌ |
| manage_announcements | ✅ | ✅ | ❌ | ❌ |
| approve_requests | ✅ | ✅ | ❌ | ❌ |
| view_analytics | ✅ | ✅ | ❌ | ❌ |
| manage_roles | ✅ | ❌ | ❌ | ❌ |
