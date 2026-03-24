// Rooms page functionality
let currentPage = 1;
let totalRooms = [];
let currentFilters = {};

function renderStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += i < Math.floor(rating) ? '<i class="fa fa-star text-warning"></i>' : '<i class="fa fa-star text-muted"></i>';
    }
    return stars;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Rooms page loaded - API_BASE_URL:', API_BASE_URL);
    loadRooms();
    setupFilters();
    setupURLParams();
    setupLoadMore();
});

async function loadRooms(append = false) {
    const container = document.getElementById('roomsContainer');
    const spinner = document.getElementById('loadingSpinner');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!append && spinner) spinner.style.display = 'block';
    
    try {
        const params = { ...currentFilters, page: currentPage, limit: 6 };
        console.log('Loading rooms with params:', params);
        const response = await getRooms(params);
        
        console.log('API Response:', response);
        // Extract rooms array from response - handle both formats
        const rooms = Array.isArray(response) ? response : (response.rooms || response.data || []);
        
        if (!append && container) container.innerHTML = '';
        
        if (rooms.length === 0 && !append) {
            if (container) container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No rooms found matching your criteria.</p></div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }
        
        rooms.forEach((room, index) => {
            console.log('Rendering room:', room.name, 'ID:', room.id);
            const imageUrl = room.images || room.image_url || '../img/room-1.jpg';
            const price = room.price_per_night || room.price || 0;
            const roomHtml = `
                <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.${index % 3}s">
                    <div class="room-item shadow rounded overflow-hidden">
                        <div class="position-relative">
                            <img class="img-fluid" src="${imageUrl}" alt="${room.name}" onerror="this.src='../img/room-1.jpg'">
                            <small class="position-absolute start-0 top-100 translate-middle-y bg-primary text-white rounded py-1 px-3 ms-4">$${price}/Night</small>
                        </div>
                        <div class="p-4 mt-2">
                            <div class="d-flex justify-content-between mb-3">
                                <h5 class="mb-0">${room.name}</h5>
                                <div class="ps-2">
                                    ${renderStars(room.rating || 4)}
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <small class="border-end me-3 pe-3"><i class="fa fa-bed text-primary me-2"></i>${room.beds || 2} Bed</small>
                                <small class="border-end me-3 pe-3"><i class="fa fa-bath text-primary me-2"></i>${room.bathrooms || 2} Bath</small>
                                <small><i class="fa fa-wifi text-primary me-2"></i>Wifi</small>
                            </div>
                            <p class="text-body mb-3">${room.description || 'Experience luxury and comfort in our premium rooms.'}</p>
                            <div class="d-flex justify-content-between">
                                <button class="btn btn-sm btn-primary rounded py-2 px-4" onclick="showRoomDetail(${room.id})">View Detail</button>
                                <a class="btn btn-sm btn-dark rounded py-2 px-4" href="booking.html?room=${room.id}">Book Now</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            if (container) container.insertAdjacentHTML('beforeend', roomHtml);
        });
        
        // Re-initialize WOW for newly added elements
        if (typeof WOW !== 'undefined' && WOW !== null) {
            try {
                new WOW().init();
            } catch(e) {
                console.log('WOW not available:', e);
            }
        }
        
        if (rooms.length === 6) {
            if (loadMoreBtn) loadMoreBtn.style.display = 'block';
        } else {
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading rooms:', error);
        console.error('Error details:', error.message);
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Failed to Load Rooms</h4>
                        <p>The backend server might not be running.</p>
                        <hr>
                        <p class="mb-0"><small><strong>To fix:</strong></small></p>
                        <p class="mb-0"><small>1. Open terminal in backend folder</small></p>
                        <p class="mb-0"><small>2. Run: <code>npm install && npm start</code></small></p>
                        <p class="mb-2"><small>3. Server should run on http://localhost:5000</small></p>
                        <p class="mb-0"><small style="color: #666;">${error.message}</small></p>
                    </div>
                </div>
            `;
        }
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

function setupFilters() {
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const roomType = document.getElementById('filterRoomType')?.value;
            const price = document.getElementById('filterPrice')?.value;
            const capacity = document.getElementById('filterCapacity')?.value;
            
            currentFilters = {};
            if (roomType) currentFilters.type = roomType;
            if (price) {
                const [min, max] = price.split('-');
                currentFilters.minPrice = min;
                currentFilters.maxPrice = max;
            }
            if (capacity) currentFilters.capacity = capacity;
            
            currentPage = 1;
            loadRooms(false);
        });
    }
}

function setupURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const checkIn = urlParams.get('checkIn');
    const checkOut = urlParams.get('checkOut');
    const adults = urlParams.get('adults');
    const children = urlParams.get('children');
    
    if (checkIn && checkOut) {
        currentFilters.checkIn = checkIn;
        currentFilters.checkOut = checkOut;
    }
    if (adults) currentFilters.adults = adults;
    if (children) currentFilters.children = children;
    
    loadRooms();
}

function showRoomDetail(roomId) {
    window.location.href = `room-detail.html?id=${roomId}`;
}

function setupLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            currentPage++;
            console.log('Loading page:', currentPage);
            loadRooms(true);
        });
    }
}