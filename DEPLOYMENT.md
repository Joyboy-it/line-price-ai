# คู่มือการอัปโปรเจคขึ้น VPS Linux (PostgreSQL)

## 📋 สิ่งที่ต้องเตรียม

### VPS Requirements
- Ubuntu 20.04+ / CentOS 8+ / Debian 10+
- RAM: 最低 2GB (แนะนำ 4GB+)
- Storage: 最低 20GB SSD
- CPU: 最低 2 cores

### Domain (ถ้ามี)
- ชื่อโดเมนสำหรับ pointing ไป VPS
- SSL Certificate (Let's Encrypt ฟรี)

---

## 🚀 ขั้นตอนการติดตั้ง

### 1. Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. ติดตั้ง Node.js
```bash
# ใช้ NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# ตรวจสอบเวอร์ชัน
node --version  # ต้องเป็น v18.x+
npm --version
```

### 3. ติดตั้ง PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib -y

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib -y
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 4. ตั้งค่า PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# สร้าง database และ user
CREATE DATABASE line_price_ai;
CREATE USER lineprice_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE line_price_ai TO lineprice_user;
\q

# ตั้งค่า password authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf
# เปลี่ยน peer เป็น md5 สำหรับ local connections
```

### 5. ติดตั้ง Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 6. ติดตั้ง PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

## 📁 การอัปโปรเจค

### 1. Clone Project
```bash
# สร้าง directory สำหรับโปรเจค
sudo mkdir -p /apps/Line_price
sudo chown $USER:$USER /apps/Line_price

# Clone จาก Git repository
cd /apps/Line_price
git clone <your-git-repo-url> .
```

### 2. ติดตั้ง Dependencies
```bash
npm install
npm run build
```

### 3. ตั้งค่า Environment Variables
```bash
# คัดลอก env.example และแก้ไข
cp .env.example .env
nano .env
```

**ตัวอย่างการตั้งค่า:**
```env
# Database
DATABASE_URL="postgresql://lineprice_user:your_strong_password@localhost:5432/line_price_ai"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your_very_strong_random_secret_here"

# LINE Login
LINE_CLIENT_ID="your_line_client_id"
LINE_CLIENT_SECRET="your_line_client_secret"

# File Upload
UPLOAD_DIR="/apps/Line_price/uploads"
MAX_FILE_SIZE="10485760"

# Server
NODE_ENV="production"
PORT="3000"
```

### 4. สร้าง Upload Directory
```bash
sudo mkdir -p /apps/Line_price/uploads
sudo chown -R $USER:$USER /apps/Line_price/uploads
chmod -R 755 /apps/Line_price/uploads
```

---

## 🗄️ การ Migrate Database

### 1. รัน SQL Schema
```bash
# ถ้ามีไฟล์ schema.sql
sudo -u postgres psql -d line_price_ai < sql/schema.sql

# หรือรัน migration scripts
sudo -u postgres psql -d line_price_ai < sql/migrations/add_log_actions.sql
```

### 2. ตรวจสอบ Database
```bash
sudo -u postgres psql -d line_price_ai
\dt  # แสดงตารางทั้งหมด
\q
```

---

## 🌐 ตั้งค่า Nginx

### สร้าง Nginx Config
```bash
sudo nano /etc/nginx/sites-available/line-price-ai
```

**Config สำหรับ HTTP:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/files {
        alias /apps/Line_price/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/line-price-ai /etc/nginx/sites-enabled/
sudo nginx -t  # ตรวจสอบ config
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate (Let's Encrypt)

### 1. ติดตั้ง Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. ขอ Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 3. Auto-renewal
```bash
sudo crontab -e
# เพิ่มบรรทัดนี้:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚀 การรัน Application

### 1. สร้าง PM2 Config
```bash
nano ecosystem.config.js
```

**PM2 Config:**
```javascript
module.exports = {
  apps: [{
    name: 'line-price-ai',
    script: 'npm',
    args: 'start',
    cwd: '/apps/Line_price',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/line-price-ai-error.log',
    out_file: '/var/log/pm2/line-price-ai-out.log',
    log_file: '/var/log/pm2/line-price-ai-combined.log',
    time: true
  }]
};
```

### 2. สร้าง Log Directory
```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### 3. Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # สร้าง startup script
```

---

## 🔧 การตรวจสอบและแก้ไขปัญหา

### ตรวจสอบ Status
```bash
# PM2 status
pm2 status
pm2 logs line-price-ai

# Nginx status
sudo systemctl status nginx

# PostgreSQL status
sudo systemctl status postgresql
```

### ตรวจสอบ Logs
```bash
# Application logs
pm2 logs line-price-ai

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Restart Services
```bash
# Restart application
pm2 restart line-price-ai

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 📊 การ Backup

### Database Backup Script
```bash
#!/bin/bash
# backup_db.sh
BACKUP_DIR="/var/backups/line-price-ai"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump line_price_ai > $BACKUP_DIR/backup_$DATE.sql
# เก็บไฟล์ 7 วันล่าสุด
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### Auto Backup
```bash
sudo crontab -e
# เพิ่มบรรทัดนี้ (backup ทุกวันตอนเที่ยงคืน):
0 0 * * * /path/to/backup_db.sh
```

---

## 🚨 Security Recommendations

### 1. Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

### 2. Fail2Ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### 3. อัปเดตระบบ
```bash
# สร้าง script สำหรับ auto-update
sudo nano /etc/cron.weekly/auto-update
```

**Auto-update script:**
```bash
#!/bin/bash
apt update && apt upgrade -y
```

---

## 📱 การทดสอบ

### 1. ทดสอบ Local
```bash
curl http://localhost:3000
```

### 2. ทดสอบ Domain
```bash
curl http://your-domain.com
curl https://your-domain.com
```

### 3. ทดสอบ API
```bash
curl https://your-domain.com/api/auth/signin
```

---

## 🆘 แก้ไขปัญหาที่พบบ่อย

### Database Connection Error
```bash
# ตรวจสอบ PostgreSQL รัน
sudo systemctl status postgresql

# ตรวจสอบ connection string
psql "postgresql://lineprice_user:password@localhost:5432/line_price_ai"
```

### Permission Error
```bash
# ตรวจสอบ file permissions
ls -la /apps/Line_price/
sudo chown -R $USER:$USER /apps/Line_price/
```

### Port Already in Use
```bash
# ตรวจสอบ port 3000
sudo netstat -tlnp | grep :3000
sudo kill -9 <PID>
```

---

## 📞 ติดต่อ

หากมีปัญหาในการติดตั้ง:
1. ตรวจสอบ logs ทั้งหมด
2. ตรวจสอบ environment variables
3. ตรวจสอบ firewall settings
4. ตรวจสอบ domain DNS settings

**Deployment เสร็จสิ้น! 🎉**
