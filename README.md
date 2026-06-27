# TicketBari Server

TicketBari is an online ticket booking platform server built with Express.js, MongoDB, JWT authentication, role-based access control, booking workflow, payment workflow, seat map support, and dashboard APIs.

## Features

* Express.js REST API server
* MongoDB Atlas database connection
* JWT authentication with HTTP-only cookie support
* Role-based access control for User, Vendor, and Admin
* User profile creation and role management
* Vendor ticket creation with pending approval status
* Admin ticket approval and rejection system
* Admin advertised ticket control with maximum 6 advertised tickets
* Public approved ticket listing
* Search tickets by from and to location
* Filter tickets by transport type
* Sort tickets by price
* Pagination support for approved tickets
* Home page advertised tickets API
* Latest tickets API
* Protected ticket details API
* Booking request system
* Vendor accept or reject booking requests
* User booking cancellation before vendor acceptance
* Stripe payment intent support
* Development mock payment success route
* Payment success flow with booking status update
* Ticket quantity reduction after successful payment
* Transaction history API
* Bus seat map API
* Selected seat validation
* Double seat booking prevention
* Vendor revenue overview API
* Vendor dashboard chart data API
* Production-safe CORS setup
* 404 route handler
* Global error handler

## Technologies Used

* Node.js
* Express.js
* MongoDB
* JSON Web Token
* Cookie Parser
* CORS
* Stripe
* Dotenv

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the server root directory and add the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_CURRENCY=usd
IMGBB_API_KEY=
```

Important: The `.env` file must not be pushed to GitHub.

## Run Locally

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

## Server Health Check

```txt
GET /
GET /health
```

## API Endpoints

### JWT Authentication

```txt
POST /api/jwt/create
POST /api/jwt/logout
GET /api/jwt/me
```

### Users

```txt
POST /api/users
GET /api/users/me
GET /api/users/role
GET /api/users
PATCH /api/users/:email/role
PATCH /api/users/:email/fraud
```

### Tickets

```txt
GET /api/tickets/approved
GET /api/tickets/advertised
GET /api/tickets/latest
POST /api/tickets
GET /api/tickets/my-tickets
GET /api/tickets/admin/all
PATCH /api/tickets/admin/:id/status
GET /api/tickets/admin/advertisement
PATCH /api/tickets/admin/:id/advertise
GET /api/tickets/:id/seats
GET /api/tickets/:id
PATCH /api/tickets/:id
DELETE /api/tickets/:id
```

### Bookings

```txt
POST /api/bookings
GET /api/bookings/my-bookings
GET /api/bookings/vendor-requests
PATCH /api/bookings/vendor/:id/status
PATCH /api/bookings/:id/cancel
```

### Payments

```txt
POST /api/payments/create-payment-intent
POST /api/payments/complete-payment
POST /api/payments/mock-success
GET /api/payments/my-transactions
```

### Vendor Dashboard

```txt
GET /api/vendor/revenue-overview
```

## Main API Details

### Approved Tickets

```txt
GET /api/tickets/approved
```

Query parameters:

```txt
from
to
transportType
sort
page
limit
```

Example:

```txt
/api/tickets/approved?from=Dhaka&to=Chittagong&transportType=Bus&sort=price-asc&page=1&limit=6
```

### Advertised Tickets

```txt
GET /api/tickets/advertised
```

This API returns maximum 6 approved advertised tickets.

### Latest Tickets

```txt
GET /api/tickets/latest
```

This API returns latest approved tickets.

### Ticket Seat Map

```txt
GET /api/tickets/:id/seats
```

This API returns available and booked seats for bus tickets.

### Create Booking

```txt
POST /api/bookings
```

Example body:

```json
{
  "ticketId": "ticket_id_here",
  "bookingQuantity": 2,
  "selectedSeats": ["A1", "A2"]
}
```

### Vendor Accept or Reject Booking

```txt
PATCH /api/bookings/vendor/:id/status
```

Example body:

```json
{
  "status": "accepted"
}
```

or

```json
{
  "status": "rejected"
}
```

### Create Stripe Payment Intent

```txt
POST /api/payments/create-payment-intent
```

Example body:

```json
{
  "bookingId": "booking_id_here"
}
```

### Complete Payment

```txt
POST /api/payments/complete-payment
```

Example body:

```json
{
  "bookingId": "booking_id_here",
  "paymentIntentId": "stripe_payment_intent_id_here"
}
```

### Development Mock Payment

```txt
POST /api/payments/mock-success
```

Example body:

```json
{
  "bookingId": "booking_id_here"
}
```

This route is only for development testing when Stripe key is not available. It is disabled in production.

## Role Based Access

### User

* Can view approved tickets
* Can view ticket details
* Can create booking request
* Can cancel pending booking
* Can pay after vendor accepts booking
* Can view transaction history

### Vendor

* Can add tickets
* Can view own added tickets
* Can update own tickets
* Can delete own tickets
* Can view booking requests
* Can accept or reject booking requests
* Can view revenue overview and chart data

### Admin

* Can view all users
* Can change user role
* Can mark vendor as fraud
* Can view all tickets
* Can approve or reject tickets
* Can advertise approved tickets
* Can control maximum 6 advertised tickets

## Payment Flow

1. User submits a booking request.
2. Booking status becomes pending.
3. Vendor accepts the booking.
4. Booking status becomes accepted.
5. User can pay after vendor acceptance.
6. Payment success changes booking status to paid.
7. Ticket quantity decreases.
8. Sold quantity increases.
9. Transaction is saved in payments collection.
10. User can view transaction history.

## Seat Map Flow

1. Bus ticket has generated seat labels.
2. User can select seats while booking.
3. Selected seat count must match booking quantity.
4. Duplicate seats are not allowed.
5. Already booked seats cannot be booked again.
6. Pending, accepted, and paid bookings make selected seats unavailable.
7. Cancelled or rejected bookings release the seats.

## Important Notes

* MongoDB credentials must be stored only in `.env`.
* JWT secret must be stored only in `.env`.
* Stripe secret key must be stored only in `.env`.
* Real Stripe payment requires a valid Stripe test secret key.
* Development mock payment is available only for local testing.
* Frontend URL must be added to `CLIENT_URL`.
* `.env` file must not be committed to GitHub.
* Before final deployment, update MongoDB password if it was shared anywhere.

## Deployment Notes

For Render or other Node.js hosting:

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required environment variables must be added in the hosting dashboard.

## Project Status

Server side includes authentication APIs, user management, role based access, ticket management, admin approval system, booking workflow, payment workflow, seat map support, vendor revenue overview, and production-ready middleware.

## Author

TicketBari Assignment Project
