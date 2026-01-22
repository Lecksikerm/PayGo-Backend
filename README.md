# PayGo-Bakend
Slide 1 – Header / Project Title

Title: PayGo Backend 🚀
Subtitle: Node.js & Express backend for a fintech wallet
Visuals: Wallet icon, Paystack logo, simple background
Description:
A Node.js & Express backend for PayGo, a fintech wallet application with:

User authentication

Wallet management

Paystack integration

Transaction history

Slide 2 – Table of Contents

Features

Tech Stack

Setup & Installation

Environment Variables

API Endpoints

Paystack Webhooks

Testing

Deployment

License

Slide 3 – Features ✨

Icons + Bullets for Visual Appeal

🔑 User authentication (register, login, forgot/reset password)

📨 OTP verification for signup & password reset

💰 Wallet management (balance, manual & Paystack funding)

🔄 Paystack integration for wallet top-ups

📜 Transaction logging (credit/debit)

💳 Wallet-to-wallet transfers with PIN verification

👤 Admin & profile routes for management

📧 Email notifications for wallet funding & account actions

Slide 4 – Tech Stack 🛠️

Table or 3 columns with icons

Backend	Database	Payments & Email	Docs
Node.js + Express	MongoDB (Mongoose)	Paystack API	Swagger UI
JWT Authentication	Atlas	Nodemailer	
Slide 5 – Setup & Installation ⚡

Step-by-step with code blocks

1️⃣ Clone the repo

git clone https://github.com/Lecksikerm/PayGo-Bakend
cd paygo-backend


2️⃣ Install dependencies

npm install


3️⃣ Create .env file (see Environment Variables)

4️⃣ Run development server

npm run dev


5️⃣ Run production server

npm start
----
Slide 6 – Environment Variables 🗝️
Key	Description
PORT	Server port (e.g., 5000)
MONGO_URI	MongoDB connection string
JWT_ACCESS_SECRET	JWT secret for access tokens
JWT_REFRESH_SECRET	JWT secret for refresh tokens
JWT_ACCESS_SECRET_EXPIRY	Access token expiry (1d)
JWT_REFRESH_SECRET_EXPIRY	Refresh token expiry (7d)
CLOUDINARY_CLOUD_NAME	Cloudinary cloud name
CLOUDINARY_API_KEY	Cloudinary API key
CLOUDINARY_API_SECRET	Cloudinary API secret
PAYSTACK_PUBLIC_KEY	Paystack public key
PAYSTACK_SECRET_KEY	Paystack secret key
PAYSTACK_BASE_URL	Paystack API base URL
BACKEND_URL	Public backend URL
MAIL_HOST	SMTP host
MAIL_PORT	SMTP port
MAIL_USER	SMTP username
MAIL_PASS	SMTP password
MAIL_FROM	Default sender email
----

---
Slide 7 – API Endpoints (Authentication) 🔐
Endpoint	Method	Description
/api/auth/register	POST	Register user & send OTP
/api/auth/verify-otp	POST	Verify OTP
/api/auth/login	POST	Login user
/api/auth/forgot-password	POST	Send OTP for password reset
/api/auth/reset-password	POST	Reset password with OTP
---

---
Slide 8 – API Endpoints (Wallet) 💰
Endpoint	Method	Description
/api/wallet/balance	GET	Get wallet balance
/api/wallet/fund/manual	POST	Manual wallet funding
/api/wallet/fund/paystack	POST	Initialize Paystack payment
/api/wallet/verify/:reference	GET	Verify Paystack transaction
/api/wallet/webhook/paystack	POST	Auto wallet funding
/api/wallet/set-pin	POST	Set/update 4-digit wallet PIN
/api/wallet/verify-pin	POST	Verify PIN before actions
/api/wallet/transfer	POST	Wallet-to-wallet transfer
/api/wallet/transactions	GET	Paginated transaction history
/api/wallet/transactions/:id	GET	Get single transaction
---

---
Slide 9 – API Endpoints (Profile & Admin) 👤

Profile:

Endpoint	Method	Description
/api/profile	GET	Get user profile info
/api/profile	PUT	Update profile info

Admin:

Endpoint	Method	Description
/api/admin/users	GET	Get all users (admin only)
/api/admin/[id]/suspend	POST	Suspend user account
/api/admin/[id]/activate	POST	Restore suspended account
---

---
Slide 10 – Paystack Webhooks 🔔

Endpoint: POST /api/wallet/webhook/paystack

Auto funds wallet on charge.success

Validates HMAC signature for security

Prevents double-processing of transactions
---

---
Slide 11 – Testing 🧪

Use Postman / Insomnia for API requests

Use Paystack test cards for payments

For webhook testing: ngrok or deployed backend must be public
---

---
Slide 12 – Deployment 🚀

1️⃣ Deploy backend to Render / Heroku / Railway / Vercel
2️⃣ Update BACKEND_URL in .env to deployed URL
3️⃣ Connect frontend to deployed backend API
---

---
Slide 13 – License ⚖️

MIT License