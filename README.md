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

## License

ISC
