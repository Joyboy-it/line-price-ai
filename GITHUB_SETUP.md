# คู่มืออัปโปรเจคขึ้น GitHub

## 📋 ขั้นตอนการอัปโปรเจคขึ้น GitHub

### 1. ติดตั้ง Git (ถ้ายังไม่มี)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git -y

# ตรวจสอบเวอร์ชัน
git --version
```

### 2. ตั้งค่า Git Config
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. สร้าง Repository บน GitHub
1. เข้าไปที่ https://github.com
2. คลิก "New repository"
3. ตั้งชื่อ repository: `line-price-ai`
4. เลือก "Public" หรือ "Private"
5. **อย่าเลือก** "Initialize with README"
6. คลิก "Create repository"

### 4. เตรียมโปรเจคสำหรับอัปขึ้น GitHub
```bash
# ไปที่ directory โปรเจค
cd /apps/Line_price

# ถ้ายังไม่ได้ clone จาก Git ให้ init ใหม่
git init
```

### 5. สร้าง .gitignore
```bash
nano .gitignore
```

**เนื้อหา .gitignore:**
```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
.next/
out/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Uploads directory
uploads/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# PM2
.pm2/

# Database
*.sqlite
*.db

# Temporary files
tmp/
temp/
```

### 6. เพิ่มไฟล์ทั้งหมดและ commit
```bash
# เพิ่มไฟล์ทั้งหมด
git add .

# Commit ครั้งแรก
git commit -m "Initial commit: Line Price AI project setup

- Next.js 14 with App Router
- PostgreSQL database
- NextAuth.js with LINE Login
- File upload system
- Admin panel
- User management
- Price groups and announcements
- Image gallery with lightbox
- Activity logging system
- Responsive design with Tailwind CSS"

# ตรวจสอบสถานะ
git status
```

### 7. เชื่อมต่อกับ GitHub Repository
```bash
# เพิ่ม remote (เปลี่ยน YOUR_USERNAME เป็น username ของคุณ)
git remote add origin https://github.com/YOUR_USERNAME/line-price-ai.git

# ตรวจสอบ remote
git remote -v
```

### 8. อัปโหลดขึ้น GitHub
```bash
# Push ขึ้น GitHub (branch main)
git push -u origin main

# ถ้าใช้ branch master
# git push -u origin master
```

---

## 🔄 การอัปเดตโปรเจค

### หลังจากแก้ไขโค้ด
```bash
# ตรวจสอบสถานะ
git status

# เพิ่มไฟล์ที่เปลี่ยนแปลง
git add .

# Commit การเปลี่ยนแปลง
git commit -m "feat: add new feature description"

# Push ขึ้น GitHub
git push
```

### Commit Message ที่ดี
```bash
# Features
git commit -m "feat: add image gallery with lightbox"

# Bug fixes
git commit -m "fix: resolve upload file size validation"

# Documentation
git commit -m "docs: update deployment guide"

# Refactoring
git commit -m "refactor: optimize database queries"
```

---

## 🌐 การ Clone จาก GitHub บน VPS

### บน VPS Server
```bash
# ไปที่ directory ที่ต้องการ
cd /apps

# Clone จาก GitHub
git clone https://github.com/YOUR_USERNAME/line-price-ai.git Line_price

# เข้าไปใน directory
cd Line_price

# ติดตั้ง dependencies
npm install

# สร้าง .env และตั้งค่า
cp .env.example .env
nano .env

# Build โปรเจค
npm run build
```

---

## 🔐 การใช้ SSH Key (แนะนำ)

### 1. สร้าง SSH Key บน VPS
```bash
# สร้าง SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# เริ่ม ssh-agent
eval "$(ssh-agent -s)"

# เพิ่ม key ใน ssh-agent
ssh-add ~/.ssh/id_ed25519

# แสดง public key
cat ~/.ssh/id_ed25519.pub
```

### 2. เพิ่ม SSH Key ใน GitHub
1. คัดลอก public key ที่แสดง
2. เข้า GitHub → Settings → SSH and GPG keys
3. คลิก "New SSH key"
4. วาง key และตั้งชื่อ

### 3. ใช้ SSH แทน HTTPS
```bash
# เปลี่ยน remote เป็น SSH
git remote set-url origin git@github.com:YOUR_USERNAME/line-price-ai.git

# ทดสอบ connection
ssh -T git@github.com

# Push โดยไม่ต้องใส่ password
git push
```

---

## 🚀 การ Deploy จาก GitHub

### 1. สร้าง Deploy Script
```bash
nano deploy.sh
```

**Deploy Script:**
```bash
#!/bin/bash
echo "🚀 Starting deployment..."

# ไปที่ directory โปรเจค
cd /apps/Line_price

# Pull latest changes
git pull origin main

# ติดตั้ง dependencies
npm install

# Build โปรเจค
npm run build

# Restart application ด้วย PM2
pm2 restart line-price-ai

echo "✅ Deployment completed!"
```

### 2. ทำให้ script รันได้
```bash
chmod +x deploy.sh
```

### 3. รัน deployment
```bash
./deploy.sh
```

---

## 📝 สรุปคำสั่งที่ต้องรัน

### บนเครื่องพัฒนา (อัปขึ้น GitHub)
```bash
# 1. Init และ commit
git init
git add .
git commit -m "Initial commit"

# 2. เชื่อมต่อ GitHub
git remote add origin https://github.com/YOUR_USERNAME/line-price-ai.git

# 3. Push ขึ้น GitHub
git push -u origin main
```

### บน VPS (ดึงจาก GitHub)
```bash
# 1. Clone โปรเจค
cd /apps
git clone https://github.com/YOUR_USERNAME/line-price-ai.git Line_price

# 2. ติดตั้งและตั้งค่า
cd Line_price
npm install
cp .env.example .env
nano .env

# 3. Build และรัน
npm run build
pm2 start ecosystem.config.js
```

**พร้อมอัปโปรเจคขึ้น GitHub แล้ว! 🎉**
