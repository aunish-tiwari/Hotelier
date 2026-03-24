// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth APIs
async function login(email, password) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

async function register(name, email, password, phone) {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone })
    });
}

// Room APIs
async function getRooms(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/rooms${params ? `?${params}` : ''}`);
}

async function getRoomById(id) {
    return apiRequest(`/rooms/${id}`);
}

// Booking APIs
async function createBooking(bookingData) {
    return apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
    });
}

async function getUserBookings() {
    return apiRequest('/bookings/my-bookings');
}

async function cancelBooking(bookingId) {
    return apiRequest(`/bookings/${bookingId}/cancel`, {
        method: 'PUT'
    });
}

// Check room availability
async function checkAvailability(roomId, checkIn, checkOut) {
    return apiRequest(`/rooms/${roomId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
}