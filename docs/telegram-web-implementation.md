# 📋 Implementation Spec: ระบบส่งราคาผ่านเว็บ (แทน telegram.py)

## 📌 สรุประบบเดิม (telegram.py)

### การทำงานของ telegram.py

| หน้า | ฟีเจอร์ | รายละเอียด |
|------|---------|------------|
| **Tab 1: ส่งชีต** | เลือก Excel Sheet → แปลงเป็นรูป → ส่งเข้า Telegram | เลือกได้หลาย sheet, เลือกกลุ่ม 1 กลุ่ม |
| **Tab 2: ส่งข้อความ** | พิมพ์ข้อความ + แนบรูป → ส่งเข้า Telegram | ส่งข้อความ/รูปภาพ เลือกกลุ่ม 1 กลุ่ม |

### ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|------|---------|
| `setting/bot_token.txt` | Token ของ Telegram Bot |
| `setting/IMGUR_CLIENT_ID.txt` | Client ID สำหรับ Imgur |
| `token/*.txt` | ไฟล์กลุ่ม (แต่ละบรรทัด: `ชื่อกลุ่ม chat_id`) |
| `sheet.txt` | รายชื่อ sheet + ตำแหน่ง cell (เช่น `งานมอไซด์!AJ1:BH53`) |
| `../รายการรับซื้อสินค้า...xlsx` | ไฟล์ Excel หลักที่เก็บราคาสินค้า |

### Flow การส่งราคาจาก Excel (Tab 1)

```
1. เลือก Sheet(s) จาก listbox (multi-select)
2. เลือกกลุ่มปลายทาง
3. ยืนยัน 2 ครั้ง
4. excel2img แปลง sheet → รูปภาพ (.png)
5. PIL resize เป็น 1600x2008
6. ส่งข้อความ header: "สวัสดีทุกท่าน ส.เจริญชัย อัพเดทราคาวันที่ DD-MM-YYYY HH:MM:SS"
7. ส่งรูปภาพทีละใบไปทุก chat_id ในกลุ่ม
8. ลบไฟล์รูปภาพชั่วคราว
```

### รูปแบบ sheet.txt

```
งานมอไซด์!AJ1:BH53
ราคา_Team!B1:AA61
ราคาเขมร!AE1:BA56
แจ้งส่งของ,อัพเดต!I42:I81
1.!B2:W42
ราคาH.ไอช์P.ปิติ,พี่แกละ!AD2:AX71
งานกระดาษ!A4:V33
4.ราคาร้านแบต!A1:H42
รายใหญ่_ทองแดงมิเนียม!A2:AB86
```

**Format:** `ชื่อ Sheet!ตำแหน่งเริ่มต้น:ตำแหน่งสิ้นสุด`

---

## 🌐 ระบบใหม่บนเว็บ

### สิ่งที่มีอยู่แล้วในระบบ

| รายการ | ตาราง/ไฟล์ | ฟิลด์ |
|--------|-----------|-------|
| **ชื่อกลุ่มราคา** | `price_groups` | `name` |
| **Telegram Chat ID** | `price_groups` | `telegram_chat_id` |
| **LINE Group ID** | `price_groups` | `line_group_id` |
| **Telegram Bot** | `src/lib/telegram.ts` | `sendMessage()`, `sendPhotoFile()` |
| **LINE Bot** | `src/lib/line.ts` | `sendLineMessage()` |
| **Upload รูปภาพ** | `src/app/api/admin/upload/route.ts` | Upload + Send |
| **Image Uploader UI** | `ImageUploader.tsx` | Drag & Drop, Progress |

### สิ่งที่ขาด / ต้องเพิ่ม

| รายการ | คำอธิบาย |
|--------|----------|
| **Excel Sheet Config** | ชื่อ sheet + ตำแหน่ง cell range ที่ต้องอ่าน |
| **Excel → Image Conversion** | แปลง Excel เป็นรูปภาพบน server-side (Node.js) |
| **Multi-group Select** | เลือกส่งได้หลายกลุ่มพร้อมกัน |
| **Multi-sheet Select** | เลือกได้หลาย sheet |
| **Send Status/History** | ประวัติการส่งและสถานะ |

---

## 🗃️ Database Schema (เพิ่มเติม)

### ตารางใหม่: `excel_sheets`

```sql
CREATE TABLE excel_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,          -- ชื่อแสดงผล เช่น "งานมอไซด์"
  sheet_name VARCHAR(255) NOT NULL,    -- ชื่อ sheet ใน Excel เช่น "งานมอไซด์"
  cell_range VARCHAR(100) NOT NULL,    -- ตำแหน่ง cell เช่น "AJ1:BH53"
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### ตารางใหม่: `price_send_logs`

```sql
CREATE TABLE price_send_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sent_by UUID NOT NULL REFERENCES users(id),
  send_type VARCHAR(50) NOT NULL,       -- 'excel_sheets' | 'message' | 'image'
  status VARCHAR(50) NOT NULL DEFAULT 'processing', -- 'processing' | 'completed' | 'failed'
  
  -- ข้อมูลกลุ่มที่ส่ง
  group_ids TEXT[],                      -- UUID[] ของ price_groups ที่เลือก
  group_names TEXT[],                    -- ชื่อกลุ่มที่ส่ง (snapshot)
  
  -- ข้อมูล sheet ที่ส่ง (กรณี send_type = 'excel_sheets')
  sheet_ids TEXT[],                      -- UUID[] ของ excel_sheets ที่เลือก
  sheet_names TEXT[],                    -- ชื่อ sheet ที่ส่ง (snapshot)
  
  -- ข้อมูลข้อความ (กรณี send_type = 'message')
  message_text TEXT,
  
  -- ผลลัพธ์
  total_targets INTEGER DEFAULT 0,       -- จำนวน chat ที่ต้องส่ง (Telegram + LINE)
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  error_details JSONB,                   -- รายละเอียด error
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_price_send_logs_user ON price_send_logs(sent_by);
CREATE INDEX idx_price_send_logs_created ON price_send_logs(created_at DESC);
```

---

## 📐 UI Design

### หน้าหลัก: `/admin/send-price` (2 Tabs เหมือนระบบเดิม)

```
┌─────────────────────────────────────────────────────────────┐
│  📢 ส่งราคาเข้ากลุ่ม                                        │
├────────────────────┬────────────────────────────────────────┤
│ 📊 ส่งชีตราคา     │ 💬 ส่งข้อความ+รูป                      │
├────────────────────┴────────────────────────────────────────┤
│                                                             │
│  (เนื้อหาตาม Tab ที่เลือก)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Tab 1: ส่งชีตราคา

```
┌─────────────────────────────────────────────────────────────┐
│  📊 เลือก Sheet ที่จะส่ง          📁 เลือกกลุ่มปลายทาง      │
│  ┌─────────────────────────┐     ┌─────────────────────────┐│
│  │ ☑ งานมอไซด์             │     │ ☑ กลุ่มราคา 1  🟢TG 🟢LINE││
│  │ ☑ ราคา_Team             │     │ ☑ กลุ่มราคา 2  🟢TG 🔴LINE││
│  │ ☐ ราคาเขมร              │     │ ☐ กลุ่มราคา 3  🟢TG 🟢LINE││
│  │ ☐ แจ้งส่งของ,อัพเดต      │     │ ☐ กลุ่มราคา 4  🔴TG 🟢LINE││
│  │ ☐ 1.                    │     │                         ││
│  │ ☐ ราคาH.ไอช์P.ปิติ      │     │ เลือก: 2 กลุ่ม          ││
│  │ ☐ งานกระดาษ             │     │ ─────────────────────── ││
│  │ ☐ 4.ราคาร้านแบต         │     │ ช่องทางที่จะส่ง:         ││
│  │ ☐ รายใหญ่_ทองแดงมิเนียม │     │ ☑ Telegram              ││
│  │                         │     │ ☑ LINE                  ││
│  │ เลือก: 2 sheet          │     │                         ││
│  └─────────────────────────┘     └─────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  ⚙️ ตั้งค่าเพิ่มเติม                                     ││
│  │  ☑ ส่งข้อความ header ก่อนรูป                              ││
│  │  ☑ ปรับขนาดรูปเป็น 1600x2008                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  📋 สรุปก่อนส่ง                                          ││
│  │  Sheet: งานมอไซด์, ราคา_Team (2 รายการ)                  ││
│  │  กลุ่ม: กลุ่มราคา 1, กลุ่มราคา 2 (2 กลุ่ม)                ││
│  │  ช่องทาง: Telegram ✅ LINE ✅                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [ ล้างข้อมูล ]                    [ 📢 ส่งราคาเข้ากลุ่ม ]  │
└─────────────────────────────────────────────────────────────┘
```

### Tab 2: ส่งข้อความ+รูป

```
┌─────────────────────────────────────────────────────────────┐
│  💬 พิมพ์ข้อความ                  📁 เลือกกลุ่มปลายทาง      │
│  ┌─────────────────────────┐     ┌─────────────────────────┐│
│  │                         │     │ ☑ กลุ่มราคา 1  🟢TG 🟢LINE││
│  │  (Text Area)            │     │ ☑ กลุ่มราคา 2  🟢TG 🔴LINE││
│  │                         │     │ ☐ กลุ่มราคา 3  🟢TG 🟢LINE││
│  │                         │     │                         ││
│  │                         │     │ เลือก: 2 กลุ่ม          ││
│  │                         │     │ ─────────────────────── ││
│  └─────────────────────────┘     │ ช่องทางที่จะส่ง:         ││
│                                  │ ☑ Telegram              ││
│  📎 แนบรูปภาพ                    │ ☑ LINE                  ││
│  ┌─────────────────────────┐     │                         ││
│  │ 🖼️ ลากไฟล์มาวาง         │     └─────────────────────────┘│
│  │ หรือคลิกเพื่อเลือก       │                               │
│  └─────────────────────────┘                                │
│  📄 image1.jpg  ✕                                           │
│                                                             │
│  [ ล้างข้อมูล ]                       [ 💬 ส่งข้อความ ]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Implementation Plan

### Phase 1: Database & Backend Setup

#### 1.1 Migration: สร้างตาราง `excel_sheets`

```
ไฟล์: sql/migrations/00X_create_excel_sheets.sql
```

- สร้างตาราง `excel_sheets`
- Insert ข้อมูลจาก `sheet.txt` เป็น seed data

#### 1.2 Migration: สร้างตาราง `price_send_logs`

```
ไฟล์: sql/migrations/00X_create_price_send_logs.sql
```

#### 1.3 Type Definitions

```typescript
// src/types/index.ts (เพิ่มเติม)

export interface ExcelSheet {
  id: string;
  name: string;
  sheet_name: string;
  cell_range: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PriceSendLog {
  id: string;
  sent_by: string;
  send_type: 'excel_sheets' | 'message' | 'image';
  status: 'processing' | 'completed' | 'failed';
  group_ids: string[];
  group_names: string[];
  sheet_ids: string[] | null;
  sheet_names: string[] | null;
  message_text: string | null;
  total_targets: number;
  success_count: number;
  fail_count: number;
  error_details: Record<string, unknown> | null;
  created_at: Date;
  completed_at: Date | null;
  // joined
  sent_by_name?: string;
}
```

---

### Phase 2: API Routes

#### 2.1 Excel Sheets CRUD

```
GET    /api/admin/excel-sheets          → รายการ sheets ทั้งหมด
POST   /api/admin/excel-sheets          → สร้าง sheet ใหม่
PATCH  /api/admin/excel-sheets/[id]     → แก้ไข sheet
DELETE /api/admin/excel-sheets/[id]     → ลบ sheet
```

#### 2.2 Send Price API

```
POST   /api/admin/send-price            → ส่งราคา (Excel sheets / ข้อความ+รูป)
```

**Request Body (ส่งชีตราคา):**

```json
{
  "send_type": "excel_sheets",
  "group_ids": ["uuid1", "uuid2"],
  "sheet_ids": ["uuid3", "uuid4"],
  "channels": {
    "telegram": true,
    "line": true
  },
  "send_header": true,
  "resize_image": true
}
```

**Request Body (ส่งข้อความ+รูป):**

```json
{
  "send_type": "message",
  "group_ids": ["uuid1", "uuid2"],
  "message_text": "ข้อความ",
  "channels": {
    "telegram": true,
    "line": true
  }
}
```

#### 2.3 Send History API

```
GET    /api/admin/send-price/history    → ประวัติการส่ง
```

---

### Phase 3: Excel → Image Conversion (Server-Side)

#### ทางเลือกในการแปลง Excel → รูปภาพบน Node.js

| วิธี | Library | ข้อดี | ข้อเสีย |
|------|---------|-------|---------|
| **1. ExcelJS + Canvas** | `exceljs` + `canvas` | Pure Node.js, ไม่ต้องติดตั้งเพิ่ม | ต้องเขียน render เอง |
| **2. LibreOffice CLI** | `libreoffice --headless` | ผลลัพธ์ดี, รองรับ format ครบ | ต้องติดตั้ง LibreOffice บน VPS |
| **3. Puppeteer** | `puppeteer` | Screenshot จาก HTML table | ต้องติดตั้ง Chrome |
| **4. Upload รูปภาพสำเร็จ** | ไม่ต้องแปลง | ง่ายที่สุด, ใช้ระบบเดิมที่มี | ไม่ได้อ่าน Excel โดยตรง |

#### ✅ แนะนำ: วิธีที่ 4 (Upload รูปภาพสำเร็จ) + วิธีที่ 2 (LibreOffice) เป็น Phase ถัดไป

**เหตุผล:**
- ระบบปัจจุบัน upload รูปภาพเข้ากลุ่มราคาได้อยู่แล้ว (`ImageUploader.tsx`)
- เพิ่มแค่ "ส่งรูปที่มีอยู่แล้วไปหลายกลุ่มพร้อมกัน"
- ลดความซับซ้อนในการ implement
- ถ้าต้องการแปลง Excel จริงๆ ค่อยเพิ่ม LibreOffice ทีหลัง

---

### Phase 4: Frontend Pages

#### 4.1 หน้าส่งราคา

```
ไฟล์: src/app/admin/send-price/page.tsx         (Server Component)
ไฟล์: src/app/admin/send-price/SendPriceClient.tsx (Client Component)
```

**Component Structure:**

```
SendPriceClient
├── Tab Navigation (ส่งชีตราคา | ส่งข้อความ+รูป)
├── Tab 1: SendSheetTab
│   ├── SheetSelector          (multi-select checkbox list)
│   ├── GroupSelector           (multi-select checkbox list + channel badges)
│   ├── ChannelSelector         (Telegram/LINE checkboxes)
│   ├── SettingsPanel           (header, resize options)
│   ├── SendSummary             (สรุปก่อนส่ง)
│   └── ActionButtons           (ล้าง, ส่ง)
├── Tab 2: SendMessageTab
│   ├── MessageInput            (textarea)
│   ├── ImageAttacher           (drag & drop, file select)
│   ├── GroupSelector           (shared component)
│   ├── ChannelSelector         (shared component)
│   └── ActionButtons
├── ConfirmDialog               (ยืนยัน 2 ขั้นตอน เหมือนระบบเดิม)
└── SendProgressDialog          (แสดง progress การส่ง)
```

#### 4.2 หน้าจัดการ Excel Sheets

```
ไฟล์: src/app/admin/excel-sheets/page.tsx
```

- CRUD ชื่อ sheet + cell range
- ลำดับการแสดงผล (sort_order)
- เปิด/ปิด active

#### 4.3 หน้าประวัติการส่ง

```
ไฟล์: src/app/admin/send-history/page.tsx
```

- ตาราง log การส่ง
- Filter ตาม: วันที่, ประเภท, ผู้ส่ง
- สถานะ: สำเร็จ/ล้มเหลว

---

## 📋 สรุปไฟล์ที่ต้องสร้าง/แก้ไข

### ไฟล์ใหม่

| ไฟล์ | หน้าที่ |
|------|---------|
| `sql/migrations/00X_create_excel_sheets.sql` | Migration สร้างตาราง |
| `sql/migrations/00X_create_price_send_logs.sql` | Migration สร้างตาราง |
| `src/app/api/admin/excel-sheets/route.ts` | API: GET, POST |
| `src/app/api/admin/excel-sheets/[id]/route.ts` | API: PATCH, DELETE |
| `src/app/api/admin/send-price/route.ts` | API: ส่งราคา |
| `src/app/api/admin/send-price/history/route.ts` | API: ประวัติการส่ง |
| `src/app/admin/send-price/page.tsx` | หน้าส่งราคา (Server) |
| `src/app/admin/send-price/SendPriceClient.tsx` | หน้าส่งราคา (Client) |
| `src/app/admin/excel-sheets/page.tsx` | หน้าจัดการ Excel Sheets |
| `src/app/admin/send-history/page.tsx` | หน้าประวัติการส่ง |

### ไฟล์ที่ต้องแก้ไข

| ไฟล์ | การแก้ไข |
|------|----------|
| `src/types/index.ts` | เพิ่ม ExcelSheet, PriceSendLog types |
| `src/lib/telegram.ts` | เพิ่มฟังก์ชัน sendLineImage (ถ้ายังไม่มี) |
| `src/lib/line.ts` | เพิ่มฟังก์ชัน sendLineImage (ถ้าต้องการส่งรูปผ่าน LINE) |
| Sidebar/Navigation | เพิ่มเมนู "ส่งราคา", "จัดการ Sheet", "ประวัติการส่ง" |

---

## 🚀 ลำดับการพัฒนา

### Sprint 1: พื้นฐาน (Database + API)
1. ✅ สร้าง migration `excel_sheets`
2. ✅ สร้าง migration `price_send_logs`
3. ✅ เพิ่ม Types
4. ✅ สร้าง Excel Sheets CRUD API

### Sprint 2: หน้าจัดการ Excel Sheets
5. ✅ หน้า `/admin/excel-sheets` (CRUD)
6. ✅ Import ข้อมูลจาก `sheet.txt`

### Sprint 3: หน้าส่งราคา (Tab 1 - ส่งรูปจากกลุ่มราคา)
7. ✅ UI: เลือก Sheet + เลือกกลุ่ม (multi-select)
8. ✅ API: ส่งรูปภาพที่มีอยู่ไปหลายกลุ่ม
9. ✅ ConfirmDialog + Progress

### Sprint 4: หน้าส่งราคา (Tab 2 - ส่งข้อความ+รูป)
10. ✅ UI: พิมพ์ข้อความ + แนบรูป + เลือกกลุ่ม
11. ✅ API: ส่งข้อความ+รูปไปหลายกลุ่ม

### Sprint 5: ประวัติการส่ง
12. ✅ หน้า `/admin/send-history`
13. ✅ API: ดึงประวัติ + filter

### Sprint 6 (Optional): Excel → Image Conversion
14. ⬜ ติดตั้ง LibreOffice บน VPS
15. ⬜ สร้าง API แปลง Excel → รูปภาพ
16. ⬜ เชื่อมต่อกับระบบส่งราคา

---

## ⚠️ ข้อควรระวัง

1. **Rate Limit:** Telegram Bot API มี rate limit (30 msg/sec per bot) → ต้องมี delay ระหว่างส่ง
2. **LINE Messaging API:** มี quota จำกัดต่อเดือน (Free plan: 500 msg/month)
3. **File Size:** Telegram photo limit 10MB, ควรบีบอัดก่อนส่ง
4. **Error Handling:** ถ้าส่งล้มเหลวบางกลุ่ม ต้อง log และแจ้งผู้ใช้
5. **Concurrency:** ถ้าหลายคนส่งพร้อมกัน ต้องจัดการ queue

---

## 🔗 เทียบระบบเดิม vs ระบบใหม่

| Feature | telegram.py (เดิม) | เว็บ (ใหม่) |
|---------|-------------------|-------------|
| **Platform** | Desktop (Windows) | Web Browser |
| **เลือกกลุ่ม** | 1 กลุ่ม | **หลายกลุ่ม** ✅ |
| **เลือก Sheet** | หลาย sheet | **หลาย sheet** ✅ |
| **ช่องทาง** | Telegram เท่านั้น | **Telegram + LINE** ✅ |
| **ประวัติ** | ไม่มี | **มี log ทั้งหมด** ✅ |
| **สิทธิ์** | ใครก็ใช้ได้ | **ตามสิทธิ์ผู้ใช้** ✅ |
| **Excel → Image** | excel2img + PIL | Phase ถัดไป (LibreOffice) |
| **ข้อมูลกลุ่ม** | Text files | **Database (มีอยู่แล้ว)** ✅ |
| **แนบรูป** | เลือกจากเครื่อง | **Drag & Drop + Upload** ✅ |
| **ยืนยันก่อนส่ง** | 2 ขั้นตอน | **2 ขั้นตอน (เหมือนเดิม)** ✅ |
