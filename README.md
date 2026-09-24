# Admin Panel — Staff & Role Management

A self-hosted Node.js + Express + MongoDB admin panel for managing staff
accounts and roles (Admin / Manager / Staff), with JWT-based login.

## What's included

- **Roles:** `admin` (full control), `manager` (view-only for now), `staff` (sees only their own profile)
- **Auth:** email + password login, JWT sessions (8-hour expiry by default)
- **Admin can:** add staff, edit details, change roles, reset passwords, enable/disable accounts, delete accounts
- **Auto-bootstrap:** the very first time you run the server with an empty database, it automatically creates one admin account for you, using the credentials in `.env`

## Requirements

- [Node.js](https://nodejs.org) v18 or newer
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, OR a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your environment file**
   ```bash
   copy .env.example .env
   ```
   Then open `.env` and fill in:
   - `MONGODB_URI` — your MongoDB connection string
   - `JWT_SECRET` — any long random string (used to sign login sessions)
   - `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` — the first admin account's login

3. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```
   (Skip this if you're using MongoDB Atlas — just make sure your `MONGODB_URI` points to it.)

4. **Start the server**
   ```bash
   npm start
   ```
   You should see:
   ```
   ✅ MongoDB connected: admin_panel
   👑 First-time setup: an admin account was created
      Email:    admin@example.com
      Password: ChangeMe123!
   🚀 Server running at http://localhost:4000
   ```

5. **Open the admin panel**
   Go to `http://localhost:4000/login.html` in your browser and log in with the bootstrap admin credentials shown above.
   **Change that password immediately** (edit your own account from the dashboard, or via the API).

## Project structure

```
admin-panel/
├── server.js              # Express app entry point
├── config/db.js           # MongoDB connection
├── models/User.js         # Staff/user schema (with password hashing)
├── middleware/auth.js     # JWT verification + role-based access control
├── routes/auth.js         # POST /api/auth/login, GET /api/auth/me
├── routes/staff.js        # Staff CRUD + role management endpoints
└── public/                # Frontend (plain HTML/CSS/JS, no build step)
    ├── login.html
    ├── dashboard.html
    ├── css/style.css
    └── js/{login,dashboard}.js
```

## API reference

| Method | Endpoint                  | Access        | Description                     |
|--------|----------------------------|---------------|----------------------------------|
| POST   | `/api/auth/login`          | Public        | Log in, returns a JWT           |
| GET    | `/api/auth/me`              | Any logged-in | Get your own profile            |
| GET    | `/api/staff`                | Any logged-in | List staff (staff role sees only self) |
| POST   | `/api/staff`                | Admin only    | Create a new staff account      |
| PUT    | `/api/staff/:id`            | Admin only    | Edit name/email/status          |
| PUT    | `/api/staff/:id/role`       | Admin only    | Change a user's role            |
| PUT    | `/api/staff/:id/password`   | Admin only    | Reset a user's password         |
| DELETE | `/api/staff/:id`            | Admin only    | Delete a staff account          |

Safeguards built in: an admin can't delete their own account, can't demote
themselves out of the admin role, and can't delete the last remaining admin
account (so you're never locked out).

## Deploying to your own server

This is a plain Node.js app, so it runs on any VPS, Render, Railway,
DigitalOcean, or similar. Typical steps:

1. Push this code to your server (git, SFTP, etc.)
2. Run `npm install --production`
3. Set the environment variables from `.env` (most hosts have a place to set these in their dashboard instead of a `.env` file)
4. Start it with `npm start`, or better, keep it running with a process manager like [PM2](https://pm2.keymetrics.io/):
   ```bash
   npm install -g pm2
   pm2 start server.js --name admin-panel
   pm2 save
   ```
5. Put a reverse proxy (Nginx, Caddy) in front of it for HTTPS.

## Security notes

- Passwords are hashed with bcrypt before being stored — never stored in plain text.
- Change `JWT_SECRET` to a real random value before going live (don't keep the example value).
- Change the bootstrap admin password immediately after first login.
