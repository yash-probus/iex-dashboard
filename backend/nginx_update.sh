#!/bin/bash
cat > /tmp/gems << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name 13.203.106.159;

    root /var/www/gems;
    index index.html;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check proxy
    location /health {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

sudo mv /tmp/gems /etc/nginx/sites-available/gems
sudo rm -f /etc/nginx/sites-enabled/iex-backend
sudo nginx -t && sudo systemctl restart nginx
