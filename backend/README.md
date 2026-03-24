# Hotel Backend API Setup Guide

## Overview
This is a Node.js/Express backend server for the Hotel Booking Application. It uses SQLite for database and JWT for authentication.

## Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Edit `.env` file in the backend directory
   - Change `JWT_SECRET` to a secure value for production

## Running the Server

### Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restart on file changes.

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Documentation

### Authentication Endpoints

**Register User**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

**Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response includes JWT token to be used in subsequent requests.

**Get Current User**
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Room Endpoints

**Get All Rooms**
```
GET /api/rooms
```

**Get Room by ID**
```
GET /api/rooms/:id
```

**Check Room Availability**
```
GET /api/rooms/:id/availability?checkIn=2024-03-25&checkOut=2024-03-27
```

### Booking Endpoints

**Create Booking**
```
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": 1,
  "checkIn": "2024-03-25",
  "checkOut": "2024-03-27",
  "totalPrice": 300
}
```

**Get User Bookings**
```
GET /api/bookings/my-bookings
Authorization: Bearer <token>
```

**Cancel Booking**
```
PUT /api/bookings/:id/cancel
Authorization: Bearer <token>
```

## Database

- **Database File:** `hotel.db` (SQLite)
- **Tables:** users, rooms, bookings
- **Sample Rooms:** 4 sample rooms are automatically inserted on first run

## Error Handling

All API endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security Notes

1. **Change JWT_SECRET** in `.env` file for production
2. **Passwords** are hashed using bcryptjs
3. **CORS** is enabled for frontend access
4. **Authentication** is required for protected endpoints (bookings, user data)

## Troubleshooting

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

**Database issues:**
- Delete `hotel.db` file to reset database
- Database will be automatically recreated on server start

**Module not found:**
- Run `npm install` again to ensure all dependencies are installed

## Development Notes

- The database uses SQLite for simplicity in development
- For production, consider migrating to PostgreSQL or MySQL
- Implement rate limiting for production deployments
- Add request validation and sanitization for production
