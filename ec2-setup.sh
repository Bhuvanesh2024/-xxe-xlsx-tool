#!/bin/bash
# EC2 User Data Script - Auto setup on instance launch

# Update system
yum update -y

# Install Docker
yum install -y docker git
service docker start
usermod -a -G docker ec2-user
chkconfig docker on

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone project
cd /home/ec2-user
git clone https://github.com/Bhuvanesh3602/XXE-XLSX-INJECTION-TOOL-.git app
cd app

# Start application
docker-compose up -d --build

echo "✅ XXE XLSX Tool deployed successfully!"
echo "Access at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
