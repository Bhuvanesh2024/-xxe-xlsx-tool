# AWS Deployment Guide — XXE XLSX Tool

## Architecture
```
Internet → EC2 (Docker)
              ├── nginx (port 80)  → serves React frontend
              └── Flask (port 8000) → API backend
```

---

## STEP 1 — Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Settings:
   - Name: xxe-xlsx-tool
   - AMI: Ubuntu 22.04 LTS (Free Tier)
   - Instance type: t2.micro (free tier) or t3.small
   - Key pair: Create new → download .pem file (keep it safe)
   - Security Group — Add these inbound rules:
     | Port | Protocol | Source    | Purpose        |
     |------|----------|-----------|----------------|
     | 22   | TCP      | My IP     | SSH access     |
     | 80   | TCP      | 0.0.0.0/0 | HTTP frontend  |
     | 8000 | TCP      | 0.0.0.0/0 | Backend API    |
3. Storage: 20 GB gp3
4. Click Launch Instance

---

## STEP 2 — Connect to EC2

```bash
# From your Windows terminal (PowerShell)
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>

# If permission error on .pem file:
icacls "your-key.pem" /inheritance:r /grant:r "%USERNAME%:R"
```

---

## STEP 3 — Install Docker on EC2

```bash
# Update packages
sudo apt-get update -y

# Install Docker
sudo apt-get install -y docker.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version
docker compose version
```

---

## STEP 4 — Clone and Deploy

```bash
# Clone your repo
git clone https://github.com/Bhuvanesh3602/XXE-XLSX-INJECTION-TOOL-.git
cd XXE-XLSX-INJECTION-TOOL-

# Build and start containers
docker compose up --build -d

# Check containers are running
docker compose ps

# Check logs
docker compose logs -f
```

---

## STEP 5 — Verify Deployment

```bash
# Test backend health
curl http://localhost:8000/api/health

# Test from browser
# Backend: http://<EC2-PUBLIC-IP>:8000/api/health
# Frontend: http://<EC2-PUBLIC-IP>
```

---

## STEP 6 — Update Deployment (after code changes)

```bash
# On your local machine — push changes
git add .
git commit -m "update"
git push origin main

# On EC2 — pull and redeploy
cd XXE-XLSX-INJECTION-TOOL-
git pull origin main
docker compose down
docker compose up --build -d
```

---

## Useful Docker Commands

```bash
# View running containers
docker compose ps

# View logs
docker compose logs backend
docker compose logs frontend

# Restart a service
docker compose restart backend

# Stop everything
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 80 not accessible | Check EC2 Security Group inbound rules |
| Container not starting | Run `docker compose logs backend` |
| Frontend shows blank | Run `docker compose logs frontend` |
| API 502 Bad Gateway | Backend not healthy, check `docker compose ps` |
