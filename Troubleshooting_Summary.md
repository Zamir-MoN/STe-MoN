# Valqore.Pro & STe-MoN Integration: Bug Fixes & VPS Commands

This document summarizes all the bugs we solved, the root causes, and the exact VPS commands used to fix the connection between the Valqore.Pro website and the STe-MoN desktop app.

---

## 🐛 Bug 1: "Network Error" in Desktop App
* **Issue:** The app failed to connect to the VPS, showing a red "Network Error" in Axios.
* **Root Cause 1 (AWS Firewall):** While UFW was open on the VPS, the AWS EC2 Security Group was blocking external traffic to ports `3001` and `4050`.
* **Root Cause 2 (CSP Block):** The `index.html` file in the frontend had a Content Security Policy (CSP) with a hardcoded `connect-src` pointing to the old IP (`13.212.175.6`). The browser forcefully blocked outgoing requests to the new IP (`65.1.84.238`).
* **Fix:** 
  1. Opened ports `3001` and `4050` in the AWS Management Console (Custom TCP, 0.0.0.0/0).
  2. Updated `frontend/src/renderer/index.html` to allow the new IP.
  3. Updated `frontend/src/renderer/src/api.ts` to point to port `3001` (the STe-MoN launcher database).

---

## 🐛 Bug 2: "Invalid Credentials" & "Server Error" on Website Integration
* **Issue:** After buying a game on the website, the generated password (`38ce9e...`) did not work in the app. The VPS logged `[STEAM MON GRANT ACCESS ERROR] { error: 'Server error' }`.
* **Root Cause 1 (Wrong Credentials):** The Valqore.Pro website was configured (via `.env`) to log into STe-MoN using `admin` / `valqore2026`. However, the actual admin in STe-MoN was `zamir` / `zamir`. This caused automated requests to fail.
* **Root Cause 2 (Outdated VPS Database):** We added the `app_id` feature to STe-MoN, but the STe-MoN backend on the VPS was still running the old code without the Prisma schema update. When Valqore asked STe-MoN to find a game by `app_id`, it crashed.
* **Root Cause 3 (Username Conflict):** The customer on the website was named `zamir`. The website told STe-MoN to create a customer named `zamir`, which conflicted with the admin account named `zamir`.
* **Fix:**
  1. Updated the VPS STe-MoN backend with the latest code and ran Prisma DB Push.
  2. Fixed Valqore.Pro's `.env` to use the correct `zamir` admin credentials.
  3. Realized we must test purchases with a non-admin username (like `testgamer`).

---

## 💻 Full VPS Commands Cheat Sheet

If you ever need to set this up on a new server or apply updates, run these commands.

### 1. Update STe-MoN Backend & Database
Applies new code from GitHub and updates the SQLite database structure.
```bash
cd ~/STe-MoN
git pull origin main
cd backend
npm install
npx prisma db push
npm run build
pm2 restart steam-mon-backend
```

### 2. Fix Valqore.Pro Website Connection (.env)
This allows the website to successfully talk to STe-MoN and create user accounts automatically.
```bash
nano ~/VALQORE_PRO/backend/.env
```
Ensure the bottom lines look EXACTLY like this:
```env
STEAM_MON_API_URL="http://localhost:3001/api"
STEAM_MON_ADMIN_USERNAME="zamir"
STEAM_MON_ADMIN_PASSWORD="zamir"
```
Save (`Ctrl+O`, `Enter`, `Ctrl+X`) and restart Valqore:
```bash
pm2 restart valqore-backend
```

### 3. Check Logs for Errors
If the automated account generation ever fails again, use these commands to see exactly why:
```bash
# Check Valqore.Pro website logs (shows integration errors)
pm2 logs valqore-backend

# Check STe-MoN launcher logs (shows database crashes)
pm2 logs steam-mon-backend
```
