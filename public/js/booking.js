// Booking page functionality
let selectedRoom = null;

document.addEventListener('DOMContentLoaded', function () {
    loadRoomsForDropdown();
    setupDatePickers();
    setupBookingForm();
    loadRoomFromURL();

    // Calculate total when dates or room changes
    document.getElementById('roomId')?.addEventListener('change', calculateTotal);
    document.getElementById('checkIn')?.addEventListener('change', calculateTotal);
    document.getElementById('checkOut')?.addEventListener('change', calculateTotal);
    document.getElementById('adults')?.addEventListener('change', calculateTotal);
    document.getElementById('children')?.addEventListener('change', calculateTotal);
});

async function loadRoomsForDropdown() {
    try {
        const response = await getRooms({ limit: 100 });
        // Extract rooms from response - handle both array and object formats
        const rooms = Array.isArray(response) ? response : (response.rooms || response.data || []);
        const select = document.getElementById('roomId');
        if (!select) return;

        console.log('Rooms loaded for dropdown:', rooms.length);
        select.innerHTML = '<option value="">Select a Room</option>' +
            rooms.map(room => {
                const price = room.price_per_night || room.price || 0;
                return `<option value="${room.id}" data-price="${price}">${room.name} - $${price}/night</option>`;
            }).join('');

    } catch (error) {
        console.error('Error loading rooms:', error);
        toastr.error('Failed to load rooms: ' + error.message);
    }
}

function loadRoomFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    if (roomId && document.getElementById('roomId')) {
        document.getElementById('roomId').value = roomId;
        calculateTotal();
    }
}

function setupDatePickers() {
    // Initialize date pickers
    if (typeof moment !== 'undefined') {
        $('#date3, #date4').datetimepicker({
            format: 'YYYY-MM-DD',
            minDate: moment(),
            useCurrent: false
        });
    }
}

function calculateTotal() {
    const roomSelect = document.getElementById('roomId');
    const checkIn = document.getElementById('checkIn')?.value;
    const checkOut = document.getElementById('checkOut')?.value;
    const adults = parseInt(document.getElementById('adults')?.value) || 1;
    const children = parseInt(document.getElementById('children')?.value) || 0;
    const summaryDiv = document.getElementById('bookingSummary');

    if (!roomSelect || !roomSelect.value || !checkIn || !checkOut) {
        if (summaryDiv) {
            summaryDiv.innerHTML = '<p class="text-muted">Select room and dates to see summary</p>';
        }
        return;
    }

    const selectedOption = roomSelect.options[roomSelect.selectedIndex];
    const pricePerNight = parseFloat(selectedOption.dataset.price);
    const roomName = selectedOption.text.split(' -')[0];

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
        if (summaryDiv) {
            summaryDiv.innerHTML = '<p class="text-danger">Check-out date must be after check-in date</p>';
        }
        return;
    }

    const subtotal = pricePerNight * nights;
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <table class="table table-sm">
                <tr><td>Room:</td><td class="text-end"><strong>${roomName}</strong></td></tr>
                <tr><td>Price per night:</td><td class="text-end">$${pricePerNight}</td></tr>
                <tr><td>Nights:</td><td class="text-end">${nights}</td></tr>
                <tr><td>Guests:</td><td class="text-end">${adults + children} (${adults} Adults, ${children} Children)</td></tr>
                <tr><td>Subtotal:</td><td class="text-end">$${subtotal.toFixed(2)}</td></tr>
                <tr><td>Tax (12%):</td><td class="text-end">$${tax.toFixed(2)}</td></tr>
                <tr class="border-top"><td><strong>Total:</strong></td><td class="text-end"><strong>$${total.toFixed(2)}</strong></td></tr>
            </table>
        `;
    }
}

function setupBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Check if user is logged in
        if (!isLoggedIn()) {
            toastr.warning('Please login to book a room');
            setTimeout(() => {
                window.location.href = `/login?redirect=/booking?room=${document.getElementById('roomId').value}`;
            }, 1500);
            return;
        }

        const roomId = document.getElementById('roomId').value;
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        const adults = parseInt(document.getElementById('adults').value);
        const children = parseInt(document.getElementById('children').value) || 0;
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const specialRequest = document.getElementById('specialRequest').value;

        if (!roomId || !checkIn || !checkOut) {
            toastr.warning('Please fill all required fields');
            return;
        }

        // Calculate total
        const selectedOption = document.getElementById('roomId').options[document.getElementById('roomId').selectedIndex];
        const pricePerNight = parseFloat(selectedOption.dataset.price);
        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        const totalPrice = pricePerNight * nights * 1.12; // including tax

        const bookingData = {
            room_id: roomId,
            check_in: checkIn,
            check_out: checkOut,
            guests: adults + children,
            total_price: totalPrice.toFixed(2),
            special_requests: specialRequest,
            guest_name: fullName,
            guest_email: email,
            guest_phone: phone
        };

        const bookBtn = document.getElementById('bookNowBtn');
        bookBtn.disabled = true;
        bookBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

        try {
            const result = await createBooking(bookingData);
            toastr.success('Booking created successfully!');
            setTimeout(() => {
                window.location.href = `/booking-confirmation?booking=${result.booking.id}`;
            }, 1500);
        } catch (error) {
            console.error('Booking error:', error);
            toastr.error(error.message || 'Failed to create booking');
            bookBtn.disabled = false;
            bookBtn.innerHTML = 'Proceed to Payment';
        }
    });
}