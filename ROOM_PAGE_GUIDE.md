# Room Page Loading Guide

## Common Issues and Solutions

### 1. "Failed to load rooms" Error

**Cause:** Backend server is not running and the frontend cannot connect to the API.

**Solution:**
```bash
# In backend directory
cd backend
npm install
npm start
```

The backend server must be running on `http://localhost:5000` for the room page to load properly.

### 2. Check Browser Console for Errors

1. Open DevTools: Press `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Look for error messages
4. Check **Network** tab to see failed API requests

### 3. Verify API Connection

Test if backend is running:
```
http://localhost:5000/health
```

Should return:
```json
{"status": "Server is running"}
```

### 4. Test Rooms API Directly

```
http://localhost:5000/api/rooms
```

Should return:
```json
{
  "message": "Rooms fetched successfully",
  "data": [...array of rooms...],
  "rooms": [...array of rooms...]
}
```

### 5. CORS Issues

If you see CORS errors in the console:
- Make sure backend has CORS enabled (it does by default)
- Restart the backend server
- Clear browser cache (Ctrl+Shift+Delete)

### 6. Port Already in Use

If port 5000 is already in use:

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -i :5000
kill -9 <PID>
```

### 7. Database Not Initialized

If backend starts but rooms don't load:
1. Delete `backend/hotel.db` file
2. Restart backend server
3. Database will be recreated with sample rooms

### 8. CSS/Image Not Loading

If room cards look broken:
- Check CSS links are correct with `../css/`
- Verify image paths in console
- Ensure `img/` folder has room images

## Expected Room Data Structure

Each room should have:
```javascript
{
    id: 1,
    name: "Room Name",
    description: "Room description",
    price: 100,
    price_per_night: 100,
    capacity: 2,
    image_url: "https://...",
    images: "https://...",
    beds: 2,
    bathrooms: 2,
    amenities: "WiFi, AC, TV",
    rating: 4
}
```

## API Response Format

The backend returns:
```json
{
    "message": "Rooms fetched successfully",
    "data": [
        {..room objects..}
    ],
    "rooms": [
        {..room objects..}
    ]
}
```

The frontend extracts rooms from either `data` or `rooms` property.

## Complete Setup Steps

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start backend:**
   ```bash
   npm start
   ```

3. **Open room page:**
   ```
   http://localhost:8000/frontend/room.html
   ```
   
   Or if backend has CORS allow localhost:3000, you can open directly:
   ```
   file:///path/to/hotel-html-template/frontend/room.html
   ```

4. **Check console for logs:**
   - Look for "loading rooms" messages
   - Check for any error messages
   - Verify room data in Network tab

## Debugging

Add this to the beginning of rooms.js for detailed logging:
```javascript
console.log('Rooms page loaded');
console.log('API_BASE_URL:', API_BASE_URL);

// Check if auth info exists
console.log('Is logged in:', isLoggedIn());
console.log('Current filters:', currentFilters);
```

## Still Having Issues?

1. Check that `config.js` is loaded before `api.js` and `rooms.js`
2. Verify all script tags have correct paths with `../js/`
3. Make sure backend database has sample rooms (check console logs)
4. Try disabling browser extensions that might interfere with requests
5. Test in a fresh incognito window to avoid caching issues
