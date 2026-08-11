# STe-MoN (Steam Mon) VPS Setup Guide

This guide provides step-by-step instructions for deploying the backend of the STe-MoN project to a Linux VPS (e.g., Ubuntu 20.04/22.04 or Debian).

## Prerequisites
- A Linux VPS with root or sudo access.
- Basic knowledge of the terminal.

## 1. Update the System
Before installing any packages, ensure your system is up to date.
```bash
sudo apt update
sudo apt upgrade -y
```

## 2. Install Node.js & npm
The backend is a Node.js application. We recommend installing Node.js (v18 or v20).
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 3. Install Git and PM2
PM2 is a production process manager for Node.js apps. It will keep your app running in the background and restart it on crashes.
```bash
sudo apt install -y git
sudo npm install -g pm2
```

## 4. Clone or Upload the Project
Upload the project files to your VPS. You can use `scp`, `rsync`, or clone a Git repository.
For this guide, assume the project is placed in `~/STe-MoN`.

```bash
# Example if using git
git clone <your-repo-url> ~/STe-MoN
cd ~/STe-MoN/backend
```

## 5. Install Backend Dependencies
Install the required Node.js packages for the backend.
```bash
cd ~/STe-MoN/backend
npm install
```

## 6. Configure Environment Variables
Create a `.env` file in the `backend` directory based on the configuration required.
```bash
nano .env
```
Paste the following (modify if needed):
```env
# Change connection string if using PostgreSQL, else it might default to SQLite via schema
DATABASE_URL="postgresql://postgres:password@localhost:5432/steam_hub?schema=public"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=3001

DEFAULT_ADMIN_USERNAME="zamir"
DEFAULT_ADMIN_PASSWORD="your_secure_password"
```

## 7. Setup the Database (Prisma)
Generate the Prisma client and push the schema to the database (or migrate).
```bash
npx prisma generate
npx prisma db push
```
*Note: Depending on your database setup in `.env`, ensure the database engine (like PostgreSQL) is installed and running if you aren't using the default SQLite.*

## 8. Build the Backend
Compile the TypeScript code to JavaScript.
```bash
npm run build
```

## 9. Start the Server using PM2
Run the compiled code in the background using PM2.
```bash
pm2 start dist/index.js --name "stemon-backend"
```
To ensure PM2 starts automatically on server reboot:
```bash
pm2 startup
# Run the command that the output of the above gives you, then:
pm2 save
```

## 10. Updating the Frontend Client
Ensure that the frontend client (`frontend/src/renderer/src/api.ts`) points to your new VPS IP address:
```typescript
const api = axios.create({
  baseURL: 'http://<YOUR_VPS_IP>:3001/api',
  // ...
})
```
Then build the frontend executable using `npm run build:exe` and distribute it to your users.
