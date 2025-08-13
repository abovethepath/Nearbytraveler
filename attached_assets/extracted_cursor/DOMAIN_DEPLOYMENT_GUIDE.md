# 🌐 Domain Deployment Guide

## 🚀 **Quick Domain Deployment**

### **Step 1: Prepare Your Server**
1. **Get a VPS/Cloud Server** (DigitalOcean, AWS, etc.)
   - Minimum: 2GB RAM, 1 vCPU
   - Recommended: 4GB RAM, 2 vCPU for 5000+ users

2. **Connect to your server:**
   ```bash
   ssh root@your-server-ip
   ```

### **Step 2: Upload Your Code**
```bash
# On your server, clone or upload your project
git clone your-repository-url
cd newNT

# Or upload via SCP/SFTP from your local machine
```

### **Step 3: Set Up Environment**
```bash
# Copy environment template
cp env.production.template .env

# Edit with your real values
nano .env
```

**Required values in .env:**
- `DATABASE_URL` - Your Neon database connection
- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `SENDGRID_API_KEY` - Your SendGrid API key
- `SESSION_SECRET` - Generate with: `openssl rand -hex 64`

### **Step 4: Deploy the Application**

**Option A: Simple PM2 Deployment (100-1000 users)**
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# Install dependencies and build
npm ci --only=production
npm run build

# Start with PM2
pm2 start dist/index.js --name "nearbytraveler" --instances max
pm2 save
pm2 startup
```

**Option B: Docker Deployment (1000+ users)**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Deploy
./deploy-docker.sh
```

### **Step 5: Configure Your Domain**

1. **Point DNS to your server:**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add A record: `@` → `your-server-ip`
   - Add A record: `www` → `your-server-ip`

2. **Install Nginx (if using Docker, skip this):**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

3. **Create Nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/nearbytraveler
   ```

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
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

4. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/nearbytraveler /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### **Step 6: Set Up SSL (HTTPS)**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Step 7: Test Your Deployment**

1. **Check if app is running:**
   ```bash
   pm2 status  # or docker-compose ps
   ```

2. **Test your domain:**
   - Visit `https://yourdomain.com`
   - Should see your NearbyTraveler app

3. **Check logs if issues:**
   ```bash
   pm2 logs nearbytraveler  # or docker-compose logs app
   ```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **App not accessible:**
   - Check if app is running: `pm2 status`
   - Check firewall: `sudo ufw status`
   - Check Nginx: `sudo systemctl status nginx`

2. **SSL errors:**
   - Verify domain points to correct IP
   - Check Certbot logs: `sudo certbot certificates`

3. **Database connection:**
   - Verify DATABASE_URL in .env
   - Check if Neon database is accessible

### **Useful Commands:**
```bash
# Check app status
pm2 status
pm2 logs nearbytraveler

# Restart app
pm2 restart nearbytraveler

# Check Nginx
sudo nginx -t
sudo systemctl restart nginx

# Check firewall
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

## 🎯 **Your App Should Now Be Live At:**
- **HTTP:** `http://yourdomain.com` (redirects to HTTPS)
- **HTTPS:** `https://yourdomain.com`
- **Direct:** `http://yourdomain.com:5000`

## 📊 **Monitor Performance:**
```bash
# View real-time metrics
pm2 monit

# Check system resources
htop
df -h
free -h
```

---

**Need help?** Check the logs first, then refer to the main deployment guide!





