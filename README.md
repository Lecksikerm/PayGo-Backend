# PayGo-Bakend

A Node.js & Express backend for PayGo, a fintech wallet application with user authentication, wallet management, Paystack integration, and transaction history.

Table of Contents

Features

Tech Stack

Setup & Installation

Environment Variables

API Endpoints

Paystack Webhooks

Testing

Deployment

License

Features

User authentication (register, login, forgot/reset password)

OTP verification for signup and password reset

Wallet management (balance, manual funding, Paystack funding)

Paystack integration for wallet top-ups

Transaction logging (credit/debit)

Wallet-to-wallet transfers with PIN verification

Admin and profile routes for management

Email notifications for wallet funding and account actions

Tech Stack

Backend: Node.js, Express

Database: MongoDB (Mongoose ORM)

Payments: Paystack API

Emails: Nodemailer

Documentation: Swagger UI

Setup & Installation

Clone the repository:

git clone <https://github.com/Lecksikerm/PayGo-Bakend>
cd paygo-backend


Install dependencies:

npm install


Set up environment variables
Create a .env file in the root directory (see Environment Variables
)

Run the development server:

npm run dev


Run production server:

npm start

Environment Variables
Key	Description
PORT	Server port (e.g., 5000)
MONGO_URI	MongoDB connection string
JWT_ACCESS_SECRET	JWT secret for access tokens
JWT_REFRESH_SECRET	JWT secret for refresh tokens
JWT_ACCESS_SECRET_EXPIRY	Access token expiry (e.g., 1d)
JWT_REFRESH_SECRET_EXPIRY	Refresh token expiry (e.g., 7d)
CLOUDINARY_CLOUD_NAME	Cloudinary cloud name for file uploads
CLOUDINARY_API_KEY	Cloudinary API key
CLOUDINARY_API_SECRET	Cloudinary API secret
PAYSTACK_PUBLIC_KEY	Paystack public key
PAYSTACK_SECRET_KEY	Paystack secret key
PAYSTACK_BASE_URL	Paystack API base URL
BACKEND_URL	Public backend URL (for webhooks/callbacks)
MAIL_HOST	SMTP host for emails
MAIL_PORT	SMTP port
MAIL_USER	SMTP username
MAIL_PASS	SMTP password
MAIL_FROM	Default "from" email
API Endpoints
Authentication
Endpoint	Method	Description
/api/auth/register	POST	Register new user & send OTP
/api/auth/verify-otp	POST	Verify OTP after registration
/api/auth/login	POST	Login user
/api/auth/forgot-password	POST	Send OTP for password reset
/api/auth/reset-password	POST	Reset password using OTP
Wallet
Endpoint	Method	Description
/api/wallet/balance	GET	Get user wallet balance
/api/wallet/fund/manual	POST	Manually fund wallet (dev/testing)
/api/wallet/fund/paystack	POST	Initialize Paystack payment
/api/wallet/verify/:reference	GET	Verify Paystack transaction (frontend)
/api/wallet/webhook/paystack	POST	Paystack webhook for auto wallet funding
/api/wallet/set-pin	POST	Set or update 4-digit wallet PIN
/api/wallet/verify-pin	POST	Verify PIN before sensitive actions
/api/wallet/transfer	POST	Transfer funds to another user
/api/wallet/transactions	GET	Paginated & filtered transaction history
/api/wallet/transactions/:id	GET	Get single transaction by ID
Profile
Endpoint	Method	Description
/api/profile	GET	Get user profile info
/api/profile	PUT	Update profile info
Admin
Endpoint	Method	Description
/api/admin/users	GET	Get all users (admin only)
/api/admin/[id]/suspend	POST	Suspend user account
/api/admin/[id]/activate	POST	Restore suspended account
Paystack Webhooks

Paystack sends events to your backend at:

POST /api/wallet/webhook/paystack


Used for automatic wallet funding.

HMAC signature validation ensures requests are authentic.

Testing

Use Postman or Insomnia for API requests.

For Paystack testing:

Use test cards provided by Paystack

Ensure backend is publicly accessible (ngrok or deployed) for webhooks.

Deployment

Deploy backend to Render, Heroku, Railway, or Vercel

Update BACKEND_URL in .env to the deployed URL

Frontend should now point to the deployed backend URL for API requests

License

This project is licensed under the MIT License.