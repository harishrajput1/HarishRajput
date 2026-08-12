# Harish Rajput Subscribe System

Frontend: `subscribe.html` + `subscribe.css` (GitHub Pages compatible).
Backend: Node.js/Express + SQLite in `server.js`.

## Setup
1. Deploy the backend to a Node.js host.
2. Run `npm install` then `npm start`.
3. Copy `.env.example` to `.env` and fill in values.
4. In `subscribe.html`, replace `https://YOUR-BACKEND-DOMAIN.example.com/api` with your API URL.
5. Configure WhatsApp Business Platform/Cloud API and create an approved notification template with three body variables: subscriber name, article title, article URL.

## API
POST `/api/subscribe` with `{name, phone, consent:true}`
POST `/api/unsubscribe` with `{phone}`
POST `/api/notify-new-article` with header `x-admin-key` and `{title,url}`
GET `/api/health`

Never put the WhatsApp access token or ADMIN_KEY in frontend code. Use HTTPS and keep subscriber data private.
