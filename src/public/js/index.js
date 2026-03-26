// Homepage specific functionality
document.addEventListener('DOMContentLoaded', function () {
    loadFeaturedRooms();
    loadStats();
    loadTestimonials();
    setupQuickSearch();
    setupNewsletter();
});

async function loadFeaturedRooms() {
    try {
        const response = await getRooms({ limit: 3 });
        // Extract rooms from response - handle both array and object formats
        const rooms = Array.isArray(response) ? response : (response.rooms || response.data || []);
        const container = document.getElementById('roomsContainer');
        if (!container) return;

        container.innerHTML = rooms.map(room => `
            <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                <div class="room-item shadow rounded overflow-hidden">
                    <div class="position-relative">
                        <img class="img-fluid" src="${room.images ? room.images.split(',')[0] : 'img/room-1.jpg'}" alt="${room.name}">
                        <small class="position-absolute start-0 top-100 translate-middle-y bg-primary text-white rounded py-1 px-3 ms-4">$${room.price_per_night}/Night</small>
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
                            <small><i class="fa fa-wifi text-primary me-2"></i>${room.amenities ? 'Wifi' : 'No Wifi'}</small>
                        </div>
                        <p class="text-body mb-3">${room.description || 'Experience luxury and comfort in our premium rooms.'}</p>
                        <div class="d-flex justify-content-between">
                            <a class="btn btn-sm btn-primary rounded py-2 px-4" href="/room-detail?id=${room.id}">View Detail</a>
                            <a class="btn btn-sm btn-dark rounded py-2 px-4" href="/booking?room=${room.id}">Book Now</a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<small class="fa fa-star ${i <= rating ? 'text-primary' : 'text-muted'}"></small>`;
    }
    return stars;
}

async function loadStats() {
    try {
        const response = await getRooms({ limit: 100 });
        const rooms = Array.isArray(response) ? response : (response.rooms || response.data || []);
        const roomCount = document.getElementById('roomCount');
        if (roomCount) roomCount.textContent = rooms.length;

        // Staff count and client count would come from separate APIs
        const staffCount = document.getElementById('staffCount');
        const clientCount = document.getElementById('clientCount');
        if (staffCount) staffCount.textContent = '50';
        if (clientCount) clientCount.textContent = '5000+';

        // Animate counters
        $('[data-toggle="counter-up"]').counterUp({ delay: 10, time: 1000 });

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadTestimonials() {
    // This would come from an API
    const testimonials = [
        { name: 'John Doe', profession: 'Business Traveler', text: 'Amazing hotel with excellent service! Highly recommend.', image: 'testimonial-1.jpg' },
        { name: 'Jane Smith', profession: 'Tourist', text: 'Beautiful rooms and great location. Will visit again!', image: 'testimonial-2.jpg' },
        { name: 'Mike Johnson', profession: 'Food Critic', text: 'The restaurant here is phenomenal. Best breakfast ever!', image: 'testimonial-3.jpg' }
    ];

    const container = document.getElementById('testimonialContainer');
    if (!container) return;

    container.innerHTML = testimonials.map(t => `
        <div class="testimonial-item position-relative bg-white rounded overflow-hidden">
            <p>${t.text}</p>
            <div class="d-flex align-items-center">
                <img class="img-fluid flex-shrink-0 rounded" src="img/${t.image}" style="width: 45px; height: 45px;">
                <div class="ps-3">
                    <h6 class="fw-bold mb-1">${t.name}</h6>
                    <small>${t.profession}</small>
                </div>
            </div>
            <i class="fa fa-quote-right fa-3x text-primary position-absolute end-0 bottom-0 me-4 mb-n1"></i>
        </div>
    `).join('');

    // Initialize testimonial carousel
    $('.testimonial-carousel').owlCarousel({
        items: 1,
        loop: true,
        autoplay: true,
        smartSpeed: 500,
        margin: 30,
        nav: false,
        dots: true
    });
}

function setupQuickSearch() {
    const searchBtn = document.getElementById('quickSearchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function () {
            const checkIn = document.getElementById('checkIn')?.value;
            const checkOut = document.getElementById('checkOut')?.value;
            const adults = document.getElementById('adults')?.value;
            const children = document.getElementById('children')?.value;

            window.location.href = `/room?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`;
        });
    }
}

function setupNewsletter() {
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', async function () {
            const email = document.getElementById('newsletterEmail')?.value;
            if (!email) {
                toastr.warning('Please enter your email');
                return;
            }
            // This would call a newsletter API endpoint
            toastr.success('Subscribed successfully!');
            document.getElementById('newsletterEmail').value = '';
        });
    }
}