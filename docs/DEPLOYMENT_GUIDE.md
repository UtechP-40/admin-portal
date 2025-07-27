# Admin Portal Deployment Guide

## Overview

This guide covers the complete deployment process for the Mobile Mafia Game Admin Portal, including infrastructure setup, security configuration, monitoring, and maintenance procedures.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or CentOS 8+
- **CPU**: Minimum 4 cores, Recommended 8+ cores
- **RAM**: Minimum 8GB, Recommended 16GB+
- **Storage**: Minimum 100GB SSD, Recommended 500GB+ SSD
- **Network**: Stable internet connection with static IP

### Software Dependencies
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 20.x (for development)
- Git 2.30+
- SSL certificates (Let's Encrypt or commercial)

### Access Requirements
- Root or sudo access to deployment server
- Domain name with DNS control
- Email service for notifications
- Monitoring service accounts (optional)

## Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### 2. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 4000/tcp  # Admin API
sudo ufw status
```

### 3. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-admin-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Using Commercial Certificate
```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/certs/admin-portal

# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/certs/admin-portal/
sudo cp your-private-key.key /etc/ssl/certs/admin-portal/
sudo cp ca-bundle.crt /etc/ssl/certs/admin-portal/

# Set proper permissions
sudo chmod 600 /etc/ssl/certs/admin-portal/*
```

## Application Deployment

### 1. Code Deployment

```bash
# Clone repository
git clone https://github.com/your-org/mobile-mafia-game.git
cd mobile-mafia-game

# Checkout production branch
git checkout main

# Create environment files
cp admin-portal/.env.example admin-portal/.env
cp backend/.env.example backend/.env
```

### 2. Environment Configuration

#### Admin Portal Environment (.env)
```bash
# Admin Portal Configuration
VITE_API_URL=https://your-domain.com/api
VITE_ADMIN_API_URL=https://your-domain.com/admin-api
VITE_SOCKET_URL=https://your-domain.com
VITE_ENVIRONMENT=production
VITE_VERSION=1.0.0
```

#### Backend Environment (.env)
```bash
# Server Configuration
NODE_ENV=production
PORT=3000
ADMIN_PORT=4000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://admin:password@mongodb:27017/mafia_game?authSource=admin
REDIS_URL=redis://:password@redis:6379

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here
ADMIN_JWT_SECRET=your-super-secure-admin-jwt-secret-here
BCRYPT_ROUNDS=12

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# External Services
GEMINI_API_KEY=your-gemini-api-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
METRICS_PORT=9090
```

#### Docker Compose Environment
```bash
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure-mongo-password
MONGO_DATABASE=mafia_game
REDIS_PASSWORD=secure-redis-password

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here
ADMIN_JWT_SECRET=your-super-secure-admin-jwt-secret-here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# External Services
GEMINI_API_KEY=your-gemini-api-key

# Monitoring
GRAFANA_PASSWORD=secure-grafana-password
```

### 3. Build and Deploy

```bash
# Build and start services
docker-compose -f docker-compose.admin.yml up -d --build

# Verify deployment
docker-compose -f docker-compose.admin.yml ps
docker-compose -f docker-compose.admin.yml logs -f
```

### 4. Database Initialization

```bash
# Run database migrations
docker-compose -f docker-compose.admin.yml exec backend npm run migrate

# Seed initial data (optional)
docker-compose -f docker-compose.admin.yml exec backend npm run seed

# Create admin user
docker-compose -f docker-compose.admin.yml exec backend npm run create-admin
```

## Security Configuration

### 1. Network Security

```bash
# Create custom Docker network with restricted access
docker network create --driver bridge \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.240.0/20 \
  mafia-secure-network
```

### 2. Container Security

#### Dockerfile Security Hardening
```dockerfile
# Use non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Remove unnecessary packages
RUN apk del .build-deps

# Set security headers
ENV NODE_OPTIONS="--max-old-space-size=1024"
```

### 3. Application Security

#### Security Headers Configuration
```nginx
# Add to nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### 4. Database Security

```bash
# MongoDB security configuration
docker-compose -f docker-compose.admin.yml exec mongodb mongo admin
> db.createUser({
    user: "admin",
    pwd: "secure-password",
    roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
  })

# Enable authentication
# Add to mongod.conf: security.authorization: enabled
```

## Monitoring Setup

### 1. Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'admin-portal'
    static_configs:
      - targets: ['admin-portal:80']
  
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000', 'backend:4000']
  
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb:27017']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 2. Grafana Dashboard Setup

```bash
# Import pre-built dashboards
curl -X POST \
  http://admin:password@localhost:3001/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @monitoring/grafana/dashboards/admin-portal-dashboard.json
```

### 3. Log Aggregation

```yaml
# docker-compose.admin.yml - Add logging configuration
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Backup and Recovery

### 1. Automated Backup Setup

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# MongoDB backup
mongodump --host mongodb:27017 \
  --username $MONGO_USERNAME \
  --password $MONGO_PASSWORD \
  --out $BACKUP_DIR/mongodb_$DATE

# Redis backup
redis-cli -h redis -p 6379 -a $REDIS_PASSWORD \
  --rdb $BACKUP_DIR/redis_$DATE.rdb

# Compress backups
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz \
  $BACKUP_DIR/mongodb_$DATE \
  $BACKUP_DIR/redis_$DATE.rdb

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.tar.gz \
  s3://your-backup-bucket/admin-portal/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

### 2. Recovery Procedures

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1
RESTORE_DIR="/tmp/restore"

# Extract backup
tar -xzf $BACKUP_FILE -C $RESTORE_DIR

# Stop services
docker-compose -f docker-compose.admin.yml stop

# Restore MongoDB
mongorestore --host mongodb:27017 \
  --username $MONGO_USERNAME \
  --password $MONGO_PASSWORD \
  --drop $RESTORE_DIR/mongodb_*/

# Restore Redis
redis-cli -h redis -p 6379 -a $REDIS_PASSWORD \
  --rdb $RESTORE_DIR/redis_*.rdb

# Start services
docker-compose -f docker-compose.admin.yml start

# Verify restoration
docker-compose -f docker-compose.admin.yml exec backend npm run health-check
```

## Performance Optimization

### 1. Database Optimization

```javascript
// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.games.createIndex({ "createdAt": -1 })
db.rooms.createIndex({ "status": 1, "createdAt": -1 })
db.analytics.createIndex({ "timestamp": -1, "event": 1 })
```

### 2. Caching Strategy

```javascript
// Redis caching configuration
const redis = require('redis');
const client = redis.createClient({
  host: 'redis',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retry_strategy: (options) => {
    return Math.min(options.attempt * 100, 3000);
  }
});

// Cache frequently accessed data
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

### 3. Load Balancing

```nginx
# nginx/nginx.conf
upstream backend {
    least_conn;
    server backend1:3000 weight=3;
    server backend2:3000 weight=2;
    server backend3:3000 weight=1;
}

upstream admin_backend {
    least_conn;
    server backend1:4000;
    server backend2:4000;
    server backend3:4000;
}
```

## Maintenance Procedures

### 1. Regular Maintenance Tasks

```bash
#!/bin/bash
# scripts/maintenance.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker system
docker system prune -f
docker volume prune -f

# Rotate logs
docker-compose -f docker-compose.admin.yml exec backend npm run rotate-logs

# Update SSL certificates
sudo certbot renew --quiet

# Backup database
./scripts/backup.sh

# Check disk space
df -h

# Monitor system resources
top -b -n1 | head -20
```

### 2. Health Checks

```bash
#!/bin/bash
# scripts/health-check.sh

# Check service status
docker-compose -f docker-compose.admin.yml ps

# Test API endpoints
curl -f http://localhost:3000/health || echo "Main API down"
curl -f http://localhost:4000/health || echo "Admin API down"
curl -f http://localhost:8080/health || echo "Admin Portal down"

# Check database connectivity
docker-compose -f docker-compose.admin.yml exec mongodb mongo --eval "db.adminCommand('ping')"
docker-compose -f docker-compose.admin.yml exec redis redis-cli ping

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "Warning: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 80 ]; then
  echo "Warning: Memory usage is ${MEMORY_USAGE}%"
fi
```

### 3. Update Procedures

```bash
#!/bin/bash
# scripts/update.sh

# Backup before update
./scripts/backup.sh

# Pull latest code
git fetch origin
git checkout main
git pull origin main

# Update dependencies
cd admin-portal && npm ci
cd ../backend && npm ci

# Run database migrations
docker-compose -f docker-compose.admin.yml exec backend npm run migrate

# Rebuild and restart services
docker-compose -f docker-compose.admin.yml up -d --build

# Run health checks
./scripts/health-check.sh

# Run smoke tests
npm run test:smoke
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.admin.yml logs service-name

# Check resource usage
docker stats

# Restart specific service
docker-compose -f docker-compose.admin.yml restart service-name
```

#### Database Connection Issues
```bash
# Check MongoDB status
docker-compose -f docker-compose.admin.yml exec mongodb mongo --eval "db.adminCommand('ping')"

# Check Redis status
docker-compose -f docker-compose.admin.yml exec redis redis-cli ping

# Restart database services
docker-compose -f docker-compose.admin.yml restart mongodb redis
```

#### High Memory Usage
```bash
# Check memory usage by service
docker stats --no-stream

# Restart memory-intensive services
docker-compose -f docker-compose.admin.yml restart backend

# Clear Redis cache
docker-compose -f docker-compose.admin.yml exec redis redis-cli FLUSHALL
```

#### SSL Certificate Issues
```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/admin-portal/certificate.crt -text -noout | grep "Not After"

# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal

# Restart nginx
docker-compose -f docker-compose.admin.yml restart nginx
```

### Emergency Procedures

#### Complete System Recovery
```bash
# Stop all services
docker-compose -f docker-compose.admin.yml down

# Restore from backup
./scripts/restore.sh /backups/backup_YYYYMMDD_HHMMSS.tar.gz

# Start services
docker-compose -f docker-compose.admin.yml up -d

# Verify system health
./scripts/health-check.sh
```

#### Database Corruption Recovery
```bash
# Stop services
docker-compose -f docker-compose.admin.yml stop backend admin-portal

# Repair MongoDB
docker-compose -f docker-compose.admin.yml exec mongodb mongod --repair

# Restore from backup if repair fails
./scripts/restore.sh /backups/latest_backup.tar.gz

# Start services
docker-compose -f docker-compose.admin.yml start
```

## Security Incident Response

### 1. Incident Detection
- Monitor security alerts and logs
- Check for unusual access patterns
- Verify system integrity

### 2. Immediate Response
```bash
# Block suspicious IPs
sudo ufw deny from suspicious.ip.address

# Disable compromised accounts
docker-compose -f docker-compose.admin.yml exec backend npm run disable-user user@email.com

# Change all passwords and secrets
./scripts/rotate-secrets.sh
```

### 3. Investigation and Recovery
- Analyze logs for attack vectors
- Assess data integrity
- Restore from clean backups if necessary
- Update security measures

## Compliance and Auditing

### 1. Audit Log Configuration
```javascript
// Enable comprehensive audit logging
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'audit.log' }),
    new winston.transports.Console()
  ]
});
```

### 2. Data Retention Policies
```bash
# Automated cleanup of old data
# Add to crontab: 0 2 * * 0 /scripts/cleanup-old-data.sh

#!/bin/bash
# scripts/cleanup-old-data.sh

# Remove logs older than 90 days
find /var/log -name "*.log" -mtime +90 -delete

# Archive old analytics data
docker-compose -f docker-compose.admin.yml exec backend npm run archive-analytics

# Clean up temporary files
find /tmp -mtime +7 -delete
```

### 3. Compliance Reporting
```bash
# Generate compliance reports
docker-compose -f docker-compose.admin.yml exec backend npm run generate-compliance-report

# Export audit logs
docker-compose -f docker-compose.admin.yml exec backend npm run export-audit-logs --from=2024-01-01 --to=2024-12-31
```

This deployment guide provides comprehensive instructions for setting up, securing, monitoring, and maintaining the Admin Portal in a production environment. Follow these procedures carefully and adapt them to your specific infrastructure requirements.