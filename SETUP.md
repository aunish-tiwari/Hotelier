# Hotelier - Hotel Booking System

A complete hotel booking web application with frontend and backend components.

## Project Structure

```
hotel-html-template/
├── frontend/           # HTML, CSS, JS files for the web interface
├── backend/            # Node.js/Express API server
├── css/                # Bootstrap and custom styles
├── js/                 # Frontend JavaScript files
├── lib/                # Third-party libraries
└── img/                # Images
```

## Features

✅ User Registration & Login
✅ Browse Rooms
✅ Check Room Availability
✅ Make Bookings
✅ View Booking History
✅ Cancel Bookings
✅ Responsive Design

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm
- Modern Web Browser

### Setup Instructions

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

Server will run on: `http://localhost:5000`

#### 2. Frontend Setup

Open any of the HTML files in a web browser:
- `frontend/index.html` - Main homepage
- `frontend/room.html` - Browse all rooms
- `frontend/room-detail.html` - Room details
- `frontend/booking.html` - Make a booking
- `frontend/login.html` - User login
- `frontend/register.html` - New user registration

**Or use a local server:**

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000
```

Then open: `http://localhost:8000/frontend/index.html`

## API Configuration

The frontend is configured to connect to the backend API at `http://localhost:5000/api`

To change the API URL, edit `js/config.js`:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## API Documentation

For detailed API documentation, see [backend/README.md](backend/README.md)

### Main Endpoints

- **Authentication**
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - User login
  - `GET /api/auth/me` - Get current user (protected)

- **Rooms**
  - `GET /api/rooms` - Get all rooms
  - `GET /api/rooms/:id` - Get room details
  - `GET /api/rooms/:id/availability` - Check availability

- **Bookings**
  - `POST /api/bookings` - Create booking (protected)
  - `GET /api/bookings/my-bookings` - Get user bookings (protected)
  - `PUT /api/bookings/:id/cancel` - Cancel booking (protected)

## Testing Credentials

After registration, you can login with:
- Email: your-registered-email@example.com
- Password: your-registered-password

## Frontend Pages

| Page | URL | Purpose |
|------|-----|---------|
| Homepage | `index.html` | Main landing page |
| About | `about.html` | About the hotel |
| Services | `service.html` | Available services |
| Team | `team.html` | Team members |
| Testimonials | `testimonial.html` | Customer reviews |
| Rooms | `room.html` | Browse all rooms |
| Room Details | `room-detail.html` | Individual room details & reviews |
| Booking | `booking.html` | Make a booking |
| Contact | `contact.html` | Contact information |
| Login | `login.html` | User login |
| Register | `register.html` | New user registration |

## Technology Stack

### Frontend
- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (Vanilla)
- Libraries: Toastr, Owl Carousel, WOW, Animate.css

### Backend
- Node.js
- Express.js
- SQLite3
- JWT Authentication
- bcryptjs (Password hashing)
- CORS enabled

## Important Notes

1. **APIs Must Be Connected:**
   - Ensure backend server is running before accessing bookings/login features
   - Check browser console for API errors

2. **CSS Paths:**
   - All CSS files are in the root `css/` folder
   - HTML files in `frontend/` reference them with `../css/`

3. **LocalStorage:**
   - User authentication tokens stored in browser LocalStorage
   - Cleared on logout

4. **Sample Data:**
   - 4 sample rooms created automatically on first backend run
   - You can add more rooms via database

## Development Notes

- For development, use `npm run dev` in backend directory for auto-reload
- Frontend files can be edited and refreshed directly in browser
- Database: `backend/hotel.db` (SQLite)

## Troubleshooting

### API Connection Issues
1. Check if backend server is running on port 5000
2. Open browser DevTools (F12) and check Console tab
3. Verify `API_BASE_URL` in `js/config.js`

### Database Issues
1. Delete `backend/hotel.db` to reset
2. Restart backend server

### Port Already in Use
```bash
# Find and kill process using port 5000
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

## License

MIT License - See LICENSE.txt file

## Support

For issues or questions, check the respective README files:
- Frontend issues: See inline comments in `js/` files
- Backend issues: See `backend/README.md`
