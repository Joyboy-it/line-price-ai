# 📱 Line Price AI - ระบบเช็คราคาสินค้าผ่าน LINE

ระบบเว็บแอปพลิเคชันสำหรับจัดการและแชร์ราคาสินค้าให้กับผู้ใช้ผ่าน LINE Login พร้อมระบบจัดการสิทธิ์การเข้าถึงแบบละเอียด

## 🚀 Tech Stack

| เทคโนโลยี | รายละเอียด |
|-----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL 15+ |
| **Authentication** | NextAuth.js v4 with LINE Provider |
| **UI Components** | Custom components with Lucide React icons |
| **Notification** | Telegram Bot API |

## ✨ Features

### 👤 สำหรับผู้ใช้ทั่วไป (User)
- LINE Login เข้าสู่ระบบด้วย LINE Account
- Request Access ขอสิทธิ์เข้าถึงกลุ่มราคา
- View Price Groups ดูรายการกลุ่มราคาที่ได้รับอนุญาต
- View Images ดูรูปภาพราคาแบบ Lightbox Gallery
- View Announcements ดูประกาศข่าวสาร

### 👨‍💼 สำหรับ Admin
- Dashboard สรุปสถิติคำขอและลิงก์ไปยังหน้าจัดการต่างๆ
- Manage Requests อนุมัติ/ปฏิเสธคำขอพร้อมเลือกกลุ่มราคา
- Manage Users แก้ไขข้อมูล, กำหนดสิทธิ์, จัดการกลุ่ม
- Manage Price Groups สร้าง/แก้ไข/ลบกลุ่มราคา พร้อมตั้งค่า Telegram
- Upload Images อัปโหลดหลายไฟล์พร้อมกัน + ส่งไป Telegram อัตโนมัติ
- Manage Announcements สร้าง/แก้ไข/ลบประกาศพร้อมรูปภาพ
- View Logs ดูประวัติการใช้งาน

## 📦 Installation

### 1. Prerequisites

```bash
# Required
- Node.js 18+
- PostgreSQL 15+
- npm or yarn
```

### 2. Clone & Install

```bash
git clone <repository-url>
cd line-price-ai
npm install
```

### 3. Database Setup

```bash
# Create database
createdb line_price_db

# Run schema
psql -d line_price_db -f sql/schema.sql
```

### 4. Environment Variables

```bash
# Copy example env file
cp env.example .env.local

# Edit .env.local with your settings
```

### 5. Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🗂️ Project Structure

```
line-price-ai/
├── sql/
│   └── schema.sql              # Complete database schema
├── src/
│   ├── app/
│   │   ├── api/                # API routes
│   │   ├── admin/              # Admin pages
│   │   ├── auth/               # Auth pages
│   │   ├── price-groups/       # Price group pages
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   ├── lib/                    # Utilities (db, auth, storage, telegram)
│   └── types/                  # TypeScript types
├── uploads/                    # Local file storage
├── env.example                 # Environment variables example
└── package.json
```

## 🔐 LINE OAuth Setup

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new provider and channel (LINE Login)
3. Add callback URL: `http://localhost:3000/api/auth/callback/line`
4. Copy Channel ID and Channel Secret to `.env.local`

## 📄 License

This project is private and proprietary.
