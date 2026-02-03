# Database Migration: Add Log Actions

## ปัญหา
ระบบไม่สามารถบันทึก log สำหรับกิจกรรม branch และ announcement ได้ เพราะฐานข้อมูล PostgreSQL ยังไม่มีค่าเหล่านี้ใน ENUM `log_action`

## วิธีแก้ไข
รันคำสั่ง SQL ต่อไปนี้ในฐานข้อมูลของคุณ:

```sql
-- เพิ่มกิจกรรมใหม่ใน log_action enum
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'create_branch';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'update_branch';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'delete_branch';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'create_announcement';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'update_announcement';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'delete_announcement';
```

## วิธีรัน

### ผ่าน psql (Command Line)
```bash
psql -U your_username -d line_price_db -f sql/migrations/add_log_actions.sql
```

### ผ่าน pgAdmin
1. เปิด pgAdmin
2. เชื่อมต่อกับฐานข้อมูล `line_price_db`
3. เปิด Query Tool
4. คัดลอกคำสั่ง SQL จากไฟล์ `add_log_actions.sql`
5. กด Execute (F5)

### ผ่าน DBeaver หรือ Database Client อื่นๆ
1. เชื่อมต่อกับฐานข้อมูล
2. เปิด SQL Editor
3. คัดลอกและรันคำสั่ง SQL

## ตรวจสอบผลลัพธ์
หลังจากรันคำสั่งแล้ว ตรวจสอบว่า ENUM มีค่าครบถ้วนหรือไม่:

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'log_action'::regtype 
ORDER BY enumsortorder;
```

ควรได้ผลลัพธ์:
- login
- logout
- register
- upload_image
- delete_image
- create_group
- update_group
- delete_group
- create_branch
- update_branch
- delete_branch
- create_announcement
- update_announcement
- delete_announcement
- approve_request
- reject_request
- update_user
- delete_user

## หลังจากรัน Migration
1. รีสตาร์ทเซิร์ฟเวอร์ Next.js (`npm run dev`)
2. ทดสอบการสร้าง/แก้ไข/ลบ สาขาและประกาศ
3. ตรวจสอบหน้า `/admin/logs` ว่ามีการบันทึก log ถูกต้อง
