// Homepage specific functionality
document.addEventListener('DOMContentLoaded', function () {
    loadFeaturedRooms();
    loadStats();
    loadTestimonials();
    setupNewsletter();
});

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

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
                        <img class="img-fluid" src="${room.images ? room.images.split(',')[0] : 'img/room-1.jpg'}" alt="${escapeHtml(room.name)}">
                        <small class="position-absolute start-0 top-100 translate-middle-y bg-primary text-white rounded py-1 px-3 ms-4">₹${room.price_per_night}/Night</small>
                    </div>
                    <div class="p-4 mt-2">
                        <div class="d-flex justify-content-between mb-3">
                            <h5 class="mb-0">${escapeHtml(room.name)}</h5>
                            <div class="ps-2">
                                ${renderStars(room.rating || 4)}
                            </div>
                        </div>
                        <div class="d-flex mb-3">
                            <small class="border-end me-3 pe-3"><i class="fa fa-bed text-primary me-2"></i>${room.beds || 2} Bed</small>
                            <small class="border-end me-3 pe-3"><i class="fa fa-bath text-primary me-2"></i>${room.bathrooms || 2} Bath</small>
                            <small><i class="fa fa-wifi text-primary me-2"></i>${room.amenities ? 'Wifi' : 'No Wifi'}</small>
                        </div>
                        <p class="text-body mb-3">${escapeHtml(room.description || 'Experience luxury and comfort in our premium rooms.')}</p>
                        <div class="d-flex">
                            <a class="btn btn-sm btn-primary rounded py-2 px-4 w-100" href="/room-detail?id=${room.id}">View Detail</a>
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
        const response = await getSiteStats();
        const stats = response.stats || {};
        const roomCount = document.getElementById('roomCount');
        const staffCount = document.getElementById('staffCount');
        const clientCount = document.getElementById('clientCount');
        if (roomCount) roomCount.textContent = stats.rooms || 0;
        if (staffCount) staffCount.textContent = stats.staff || 0;
        if (clientCount) clientCount.textContent = stats.clients || 0;

        // Animate counters
        $('[data-toggle="counter-up"]').counterUp({ delay: 10, time: 1000 });

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadTestimonials() {
    try {
        const response = await getReviews();
        const reviews = Array.isArray(response) ? response : (response.reviews || []);
        const container = document.getElementById('testimonialContainer');
        if (!container) return;

        if ($('.testimonial-carousel').hasClass('owl-loaded')) {
            $('.testimonial-carousel').trigger('destroy.owl.carousel').removeClass('owl-loaded');
            $('.testimonial-carousel').find('.owl-stage-outer').children().unwrap();
        }

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="testimonial-item position-relative bg-white rounded overflow-hidden">
                    <p>Guest reviews will appear here as soon as visitors share their stay experience.</p>
                    <div class="d-flex align-items-center">
                        <img class="img-fluid flex-shrink-0 rounded" src="img/testimonial-1.jpg" style="width: 45px; height: 45px;">
                        <div class="ps-3">
                            <h6 class="fw-bold mb-1">Hotelier Guest</h6>
                            <small>Verified Stay</small>
                        </div>
                    </div>
                    <i class="fa fa-quote-right fa-3x text-primary position-absolute end-0 bottom-0 me-4 mb-n1"></i>
                </div>
            `;
        } else {
            container.innerHTML = reviews.map((review, index) => `
                <div class="testimonial-item position-relative bg-white rounded overflow-hidden">
                    <p>${escapeHtml(review.comment || 'Wonderful stay and friendly service.')}</p>
                    <div class="d-flex align-items-center">
                        <img class="img-fluid flex-shrink-0 rounded" src="img/testimonial-${(index % 4) + 1}.jpg" style="width: 45px; height: 45px;">
                        <div class="ps-3">
                            <h6 class="fw-bold mb-1">${escapeHtml(review.guest_name || 'Guest')}</h6>
                            <small>${escapeHtml(review.room_name || 'Verified Stay')} - ${renderStars(Number(review.rating) || 0)}</small>
                        </div>
                    </div>
                    <i class="fa fa-quote-right fa-3x text-primary position-absolute end-0 bottom-0 me-4 mb-n1"></i>
                </div>
            `).join('');
        }

        $('.testimonial-carousel').owlCarousel({
            items: 1,
            loop: reviews.length > 1,
            autoplay: true,
            smartSpeed: 500,
            margin: 30,
            nav: false,
            dots: true
        });
    } catch (error) {
        console.error('Error loading testimonials:', error);
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
            if (!email.match(/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/)) {
                toastr.error('Please enter a valid email address');
                return;
            }
            toastr.success('Subscribed successfully!');
            document.getElementById('newsletterEmail').value = '';
        });
    }
}
