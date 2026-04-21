document.addEventListener('DOMContentLoaded', function () {
    loadReviewTestimonials();
});

function escapeTestimonialHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function renderTestimonialStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fa fa-star ${i <= Number(rating) ? 'text-primary' : 'text-muted'}"></i>`;
    }
    return stars;
}

async function loadReviewTestimonials() {
    const container = document.getElementById('testimonialContainer');
    if (!container) return;

    try {
        const response = await getReviews();
        const reviews = Array.isArray(response) ? response : (response.reviews || []);

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
                    <p>${escapeTestimonialHtml(review.comment || 'Wonderful stay and friendly service.')}</p>
                    <div class="d-flex align-items-center">
                        <img class="img-fluid flex-shrink-0 rounded" src="img/testimonial-${(index % 4) + 1}.jpg" style="width: 45px; height: 45px;">
                        <div class="ps-3">
                            <h6 class="fw-bold mb-1">${escapeTestimonialHtml(review.guest_name || 'Guest')}</h6>
                            <small>${escapeTestimonialHtml(review.room_name || 'Verified Stay')}</small>
                            <div>${renderTestimonialStars(review.rating)}</div>
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
        container.innerHTML = '<div class="testimonial-item bg-white rounded overflow-hidden"><p class="mb-0">Reviews could not be loaded right now.</p></div>';
    }
}
