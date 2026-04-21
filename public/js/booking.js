document.addEventListener('DOMContentLoaded', async function () {
    setupDatePickers();
    prefillBookingForm();
    setupBookingForm();
    setupSummaryListeners();
    calculateTotal();
});

function showBookingToast(type, message) {
    if (typeof toastr !== 'undefined' && toastr[type]) {
        toastr[type](message);
    }
}

function showSummaryMessage(type, message) {
    const summaryDiv = document.getElementById('bookingSummary');
    if (!summaryDiv) return;
    summaryDiv.innerHTML = `<p class="text-${type === 'success' ? 'success' : 'danger'} mb-0">${message}</p>`;
}

function getSelectedRoomPrice() {
    const roomSelect = document.getElementById('roomId');
    if (!roomSelect || !roomSelect.value) return 0;
    const selectedOption = roomSelect.options[roomSelect.selectedIndex];
    return Number(selectedOption.dataset.price || 0);
}

function updateSelectedRoomImage() {
    const roomSelect = document.getElementById('roomId');
    const roomImage = document.getElementById('bookingRoomImage');
    if (!roomSelect || !roomImage) return;

    const selectedOption = roomSelect.options[roomSelect.selectedIndex];
    const imageUrl = selectedOption?.dataset.image || 'img/room-1.jpg';
    const roomName = selectedOption?.textContent?.split(' -')[0]?.trim() || 'Selected room';

    roomImage.src = imageUrl;
    roomImage.alt = roomName;
    roomImage.onerror = function () {
        this.onerror = null;
        this.src = 'img/room-1.jpg';
    };
}

function getNights(checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
        return 0;
    }
    return Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
}

function getNextDate(value) {
    const date = new Date(value);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}

function setupDatePickers() {
    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    const today = new Date().toISOString().split('T')[0];

    if (checkIn) {
        checkIn.min = today;
        checkIn.addEventListener('change', function () {
            if (checkOut) {
                checkOut.min = checkIn.value ? getNextDate(checkIn.value) : today;
                if (checkOut.value && checkOut.value <= checkIn.value) {
                    checkOut.value = '';
                }
            }
            calculateTotal();
        });
    }

    if (checkOut) {
        checkOut.min = today;
        checkOut.addEventListener('change', calculateTotal);
    }
}

function prefillBookingForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const fields = {
        roomId: urlParams.get('room'),
        checkIn: urlParams.get('checkIn'),
        checkOut: urlParams.get('checkOut'),
        adults: urlParams.get('adults'),
        children: urlParams.get('children')
    };

    if (fields.checkIn) document.getElementById('checkIn').value = fields.checkIn;
    if (fields.checkOut) document.getElementById('checkOut').value = fields.checkOut;
    if (fields.adults) document.getElementById('adults').value = fields.adults;
    if (fields.children) document.getElementById('children').value = fields.children;
    if (fields.checkIn) {
        document.getElementById('checkOut').min = getNextDate(fields.checkIn);
    }
    updateSelectedRoomImage();

    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user) {
        if (user.name) document.getElementById('fullName').value = user.name;
        if (user.email) document.getElementById('email').value = user.email;
        if (user.phone) document.getElementById('phone').value = user.phone;
    }
}

function setupSummaryListeners() {
    ['roomId', 'checkIn', 'checkOut', 'adults', 'children'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', calculateTotal);
        document.getElementById(id)?.addEventListener('input', calculateTotal);
    });
}

function calculateTotal() {
    const roomSelect = document.getElementById('roomId');
    const checkIn = document.getElementById('checkIn')?.value;
    const checkOut = document.getElementById('checkOut')?.value;
    const adults = Number(document.getElementById('adults')?.value || 1);
    const children = Number(document.getElementById('children')?.value || 0);
    const summaryDiv = document.getElementById('bookingSummary');

    if (!summaryDiv) return null;
    updateSelectedRoomImage();

    if (!roomSelect?.value || !checkIn || !checkOut) {
        summaryDiv.innerHTML = '<p class="text-muted">Select room and dates to see summary</p>';
        return null;
    }

    const selectedOption = roomSelect.options[roomSelect.selectedIndex];
    const pricePerNight = getSelectedRoomPrice();
    const roomName = selectedOption.text.split(' -')[0];
    const nights = getNights(checkIn, checkOut);

    if (nights <= 0) {
        summaryDiv.innerHTML = '<p class="text-danger">Check-out date must be after check-in date.</p>';
        return null;
    }

    const subtotal = pricePerNight * nights;
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

    summaryDiv.innerHTML = `
        <table class="table table-sm">
            <tr><td>Room:</td><td class="text-end"><strong>${roomName}</strong></td></tr>
            <tr><td>Price per night:</td><td class="text-end">\u20B9${pricePerNight.toFixed(2)}</td></tr>
            <tr><td>Nights:</td><td class="text-end">${nights}</td></tr>
            <tr><td>Guests:</td><td class="text-end">${adults + children} (${adults} Adults, ${children} Children)</td></tr>
            <tr><td>Subtotal:</td><td class="text-end">\u20B9${subtotal.toFixed(2)}</td></tr>
            <tr><td>Tax (12%):</td><td class="text-end">\u20B9${tax.toFixed(2)}</td></tr>
            <tr class="border-top"><td><strong>Total:</strong></td><td class="text-end"><strong>\u20B9${total.toFixed(2)}</strong></td></tr>
        </table>
    `;

    return { nights, subtotal, tax, total };
}

function setupBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const roomId = document.getElementById('roomId').value;
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        const adults = Number(document.getElementById('adults').value || 0);
        const children = Number(document.getElementById('children').value || 0);
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const specialRequest = document.getElementById('specialRequest').value.trim();
        const totals = calculateTotal();

        if (!roomId || !checkIn || !checkOut || !fullName || !email || !phone || !totals) {
            showSummaryMessage('error', 'Please complete all required fields with valid dates.');
            return;
        }

        const bookBtn = document.getElementById('bookNowBtn');
        bookBtn.disabled = true;
        bookBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

        try {
            const result = await createBooking({
                room_id: Number(roomId),
                check_in: checkIn,
                check_out: checkOut,
                guests: adults + children,
                total_price: totals.total.toFixed(2),
                special_requests: specialRequest,
                guest_name: fullName,
                guest_email: email,
                guest_phone: phone
            });

            sessionStorage.setItem('lastBooking', JSON.stringify(result.booking));
            showBookingToast('success', 'Booking created successfully!');
            window.location.href = `/booking-confirmation?booking=${result.booking.id}`;
        } catch (error) {
            console.error('Booking error:', error);
            showSummaryMessage('error', error.message || 'Failed to create booking.');
            showBookingToast('error', error.message || 'Failed to create booking.');
            bookBtn.disabled = false;
            bookBtn.innerHTML = 'Proceed to Payment';
        }
    });
}
