# RVMS - Rental Vehicle Management System (Node.js Version)

A complete rental vehicle management system built with Node.js, Express, and Sequelize ORM.

## Features

- **User Management**: Role-based access control (Admin, Fleet Supervisor, Receptionist, Mechanic, Customer)
- **Vehicle Management**: Track vehicle inventory, status, maintenance schedules
- **Booking System**: Create and manage vehicle bookings
- **Payment Processing**: Support for multiple payment methods including M-Pesa
- **Maintenance Tracking**: Schedule and track vehicle maintenance
- **Inventory Management**: Manage parts, supplies, and inventory
- **Reporting**: Generate reports on bookings, revenue, and fleet utilization
- **Notifications**: Email and SMS notifications for bookings and maintenance alerts

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Default Admin Account

After first run, create an admin account through the registration form or use the Django admin to create one.

## Project Structure

```
rvms-nodejs/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── models/          # Sequelize models
├── routes/          # Express routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── views/           # EJS templates
├── public/          # Static files
└── server.js        # Application entry point
```

## Database

The system uses SQLite by default for development. To use MySQL, change the `DB_TYPE` in `.env` to `mysql` and provide MySQL connection details.

## Environment Variables

Create a `.env` file in the project root. Common variables:

```bash
# Core
NODE_ENV=development
PORT=3000
SESSION_SECRET=change-me
APP_URL=http://localhost:3000

# Database (SQLite default)
DB_TYPE=sqlite
DB_PATH=./database.sqlite

# Email notifications (use your own SMTP / Gmail account)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-address@gmail.com      # your email
EMAIL_PASSWORD=your-app-password       # Gmail App Password (not your normal password)
EMAIL_FROM=RVMS <your-address@gmail.com>

# M-Pesa (Safaricom)
# MPESA_MODE=simulation -> no Safaricom account needed; the STK push and the
#   Safaricom callback are emulated locally (great for demos/testing).
# MPESA_MODE=sandbox    -> performs a real Daraja sandbox STK push using the
#   credentials below; Safaricom then calls MPESA_CALLBACK_URL.
MPESA_MODE=simulation
MPESA_SIM_DELAY_MS=4000
MPESA_CALLBACK_URL=http://localhost:3000/payments/mpesa/callback
# Only needed when MPESA_MODE=sandbox:
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379
MPESA_PASSKEY=
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
```

### Email setup (Gmail)
To send real emails from your own Gmail address, enable 2-Step Verification on
your Google account and create an **App Password** (Google Account → Security →
App passwords). Put that 16-character password in `EMAIL_PASSWORD` and your
address in `EMAIL_USER` / `EMAIL_FROM`.

### M-Pesa payment (Safaricom)
The Payments page has a **"Pay via M-Pesa (STK Push)"** form. In `simulation`
mode (default) it records a pending transaction, emulates Safaricom prompting the
customer's phone, and then completes the payment via the callback — updating the
booking balance and emailing a receipt. Switch `MPESA_MODE=sandbox` and add your
Daraja credentials to test against Safaricom's real sandbox.

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Login
- `GET /admin/login` - Admin login page
- `POST /admin/login` - Admin login
- `GET /register` - Registration page
- `POST /register` - Register
- `GET /logout` - Logout

### Main Routes
- `GET /` - Dashboard
- `GET /vehicles` - Vehicle list
- `GET /bookings` - Booking list
- `GET /customers` - Customer list
- `GET /payments` - Payment list
- `GET /maintenance` - Maintenance dashboard
- `GET /inventory` - Inventory list
- `GET /reports` - Reports dashboard
- `GET /users` - User list

### Payments & M-Pesa
- `POST /payments/record` - Record a manual payment (cash, bank, card, mpesa)
- `POST /payments/mpesa/stkpush` - Initiate an M-Pesa STK push for a booking
- `POST /payments/mpesa/callback` - Safaricom (or simulator) payment callback
- `GET /payments/mpesa/status/:checkoutRequestId` - Poll STK push status

### Admin Data Export
- `GET /admin/export/:scope?format=xlsx|csv` - Export data (`reception`, `fleet`, `all`)

## License

ISC
