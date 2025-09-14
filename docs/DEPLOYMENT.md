# SAVAGE DEPLOYMENT GUIDE - UNLEASH THE BEAST!!! 🚀🔥🚀

## Overview

This guide will help you deploy the Worker Check-In System to production with maximum performance and security.

## Prerequisites

- Docker and Docker Compose
- SSL certificates (Let's Encrypt recommended)
- Domain name pointing to your server
- Server with at least 2GB RAM and 20GB storage

---

## Quick Start (Docker Deployment)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd worker-check-in-system

# Copy environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

### 2. Configure Environment
Edit `.env.production` with your production values:

```bash
# Database - SECURE THESE VALUES!!!
DB_HOST=postgres
DB_PASSWORD=your-secure-db-password

# JWT - CHANGE THIS SECRET!!!
JWT_SECRET=your-production-jwt-secret-minimum-32-characters-long

# Admin - CHANGE THIS PASSWORD!!!
ADMIN_PASSWORD=your-secure-admin-password

# Domain
API_URL=https://your-domain.com/api
```

### 3. SSL Certificates
```bash
# Create SSL directory
mkdir ssl

# Copy your SSL certificates
cp /path/to/your/cert.pem ssl/cert.pem
cp /path/to/your/key.pem ssl/key.pem

# Or use Let's Encrypt
certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
```

### 4. Deploy
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Initialize Database
```bash
# Run migrations
docker-compose exec server npm run migrate

# Seed initial data
docker-compose exec server tsx scripts/seed-data.ts
```

---

## Manual Deployment

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE worker_checkin;
CREATE USER checkin_user WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE worker_checkin TO checkin_user;
\q
```

### 3. Application Setup
```bash
# Clone repository
git clone <your-repo-url>
cd worker-check-in-system

# Install dependencies
npm run install:all

# Build application
npm run build

# Copy environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

### 4. Database Migration
```bash
# Run migrations
npm run migrate

# Seed data
tsx server/scripts/seed-data.ts
```

### 5. PM2 Configuration
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'worker-checkin-api',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 6. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 7. Nginx Configuration
Create `/etc/nginx/sites-available/worker-checkin`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Serve client files
    location / {
        root /path/to/worker-check-in-system/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/worker-checkin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Security Hardening

### 1. Firewall Setup
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSL Security
Add to Nginx configuration:
```nginx
# SSL Security
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;

# Security Headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

### 3. Database Security
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf

# Set listen_addresses = 'localhost'
# Set password_encryption = scram-sha-256

# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Change to scram-sha-256 authentication
```

---

## Monitoring and Maintenance

### 1. Log Management
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/worker-checkin

# Add configuration:
/path/to/worker-check-in-system/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload worker-checkin-api
    endscript
}
```

### 2. Backup Script
Create `scripts/backup.sh`:
```bash
#!/bin/bash
# Database backup
pg_dump -h localhost -U checkin_user worker_checkin > backup_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 30 days
find /path/to/backups -name "backup_*.sql" -mtime +30 -delete
```

### 3. Health Checks
```bash
# Add to crontab
crontab -e

# Add health check every 5 minutes
*/5 * * * * curl -f http://localhost:3001/health || pm2 restart worker-checkin-api
```

### 4. Performance Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor PM2 processes
pm2 monit

# Check application logs
pm2 logs worker-checkin-api
```

---

## Scaling and Performance

### 1. Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_workers_email ON workers(email);
CREATE INDEX CONCURRENTLY idx_workers_phone ON workers(phone);
CREATE INDEX CONCURRENTLY idx_checkins_worker_event ON checkins(worker_id, event_id);
CREATE INDEX CONCURRENTLY idx_checkins_timestamp ON checkins(timestamp);
CREATE INDEX CONCURRENTLY idx_events_active ON events(is_active);
```

### 2. Redis Caching
```bash
# Configure Redis
sudo nano /etc/redis/redis.conf

# Set maxmemory and policy
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 3. Load Balancing
For high traffic, use multiple server instances:

```nginx
upstream api_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    keepalive 32;
}
```

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U checkin_user -d worker_checkin
   ```

2. **Application Won't Start**
   ```bash
   # Check PM2 logs
   pm2 logs worker-checkin-api
   
   # Check environment variables
   pm2 env 0
   ```

3. **High Memory Usage**
   ```bash
   # Monitor memory
   pm2 monit
   
   # Restart if needed
   pm2 restart worker-checkin-api
   ```

4. **SSL Certificate Issues**
   ```bash
   # Test SSL
   openssl s_client -connect your-domain.com:443
   
   # Renew Let's Encrypt
   certbot renew
   ```

### Performance Issues

1. **Slow Database Queries**
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   ```

2. **High CPU Usage**
   ```bash
   # Check processes
   htop
   
   # Reduce PM2 instances if needed
   pm2 scale worker-checkin-api 2
   ```

---

## Updates and Maintenance

### 1. Application Updates
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm run install:all

# Build application
npm run build

# Run migrations
npm run migrate

# Restart application
pm2 restart worker-checkin-api
```

### 2. System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js if needed
sudo npm install -g n
sudo n stable

# Restart services
sudo systemctl restart nginx
pm2 restart all
```

---

## Support and Maintenance

- Monitor logs daily: `pm2 logs`
- Check system resources: `htop`, `df -h`
- Backup database weekly
- Update SSL certificates before expiry
- Monitor application performance
- Keep system packages updated

🔥 **THE BEAST IS NOW DEPLOYED AND READY FOR BATTLE!** 💀