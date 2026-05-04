// ===== BOOKING PAGE JAVASCRIPT =====

// Global variables
let currentListing = null;
let bookingData = {
    id: null,
    checkin: null,
    checkout: null,
    guests: null
};
let selectedPaymentMethod = 'whatsapp';
let formValid = false;
let bookedDates = []; // Store booked date ranges

// === URL PARAMS & DATA ===
document.addEventListener('DOMContentLoaded', function() {
    initializeBookingPage();
});

async function initializeBookingPage() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    bookingData.id = urlParams.get('id');
    bookingData.checkin = urlParams.get('checkin');
    bookingData.checkout = urlParams.get('checkout');
    bookingData.guests = urlParams.get('guests');
    
    // Validate required parameters
    if (!bookingData.id || !bookingData.checkin || !bookingData.checkout || !bookingData.guests) {
        showErrorState();
        return;
    }
    
    try {
        // Fetch apartment data from API
        const response = await window.lekkirStaysAPI.getApartment(bookingData.id);
        
        if (!response.success || !response.apartment) {
            console.error('Failed to load apartment data:', response);
            showErrorState();
            return;
        }
        
        // Set current listing from API data
        currentListing = response.apartment;
        
        // Parse dates
        bookingData.checkin = new Date(bookingData.checkin);
        bookingData.checkout = new Date(bookingData.checkout);
        bookingData.guests = parseInt(bookingData.guests);
        
        // Show booking content and populate data
        document.getElementById('bookingContent').style.display = 'block';
        populateBookingData();
        initializeInteractions();
        
        // Check availability for these dates
        checkDateAvailability();
        
    } catch (error) {
        console.error('Error loading booking page:', error);
        showErrorState();
    }
}

function showErrorState() {
    document.getElementById('errorState').style.display = 'block';
}

// === AVAILABILITY CHECKING ===
async function checkDateAvailability() {
    try {
        // Fetch booked dates for this apartment
        const response = await window.lekkirStaysAPI.getBookedDates(bookingData.id);
        
        if (response.success && response.bookedDates) {
            bookedDates = response.bookedDates;
            
            // Check if selected dates conflict with any bookings
            const conflict = checkDateConflict(bookingData.checkin, bookingData.checkout);
            
            if (conflict) {
                showDateConflictPopup(conflict);
            }
        }
    } catch (error) {
        console.error('Failed to check availability:', error);
        // Continue without blocking - the backend will validate again
    }
}

function checkDateConflict(checkin, checkout) {
    for (const booking of bookedDates) {
        const bookedCheckIn = new Date(booking.checkIn);
        const bookedCheckOut = new Date(booking.checkOut);
        
        // Check if dates overlap
        // Overlap occurs if: checkin < bookedCheckOut AND checkout > bookedCheckIn
        if (checkin < bookedCheckOut && checkout > bookedCheckIn) {
            return booking;
        }
    }
    
    return null;
}

function showDateConflictPopup(booking) {
    // Hide booking content
    document.getElementById('bookingContent').style.display = 'none';
    
    // Create conflict popup
    const conflictDiv = document.createElement('div');
    conflictDiv.id = 'dateConflictPopup';
    conflictDiv.className = 'date-conflict-container';
    
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    
    conflictDiv.innerHTML = `
        <div class="conflict-content">
            <div class="conflict-icon">
                <i data-lucide="calendar-x"></i>
            </div>
            <h2>Dates Not Available</h2>
            <p class="conflict-message">Unfortunately, the dates you selected are no longer available.</p>
            
            <div class="conflict-details">
                <div class="detail-row">
                    <span class="detail-label">Your selected dates:</span>
                    <span class="detail-value">${formatDate(bookingData.checkin)} - ${formatDate(bookingData.checkout)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Conflicting booking:</span>
                    <span class="detail-value">${formatDateFull(checkInDate)} - ${formatDateFull(checkOutDate)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-${booking.status}">${booking.status === 'pending' ? 'Awaiting Confirmation' : 'Confirmed'}</span>
                </div>
            </div>
            
            <p class="conflict-help">Please go back and select different dates for your stay.</p>
            
            <div class="conflict-actions">
                <button class="btn-back" onclick="goBackToListing()">
                    <i data-lucide="arrow-left"></i>
                    Choose Different Dates
                </button>
                <button class="btn-contact" onclick="contactViaWhatsApp()">
                    <i data-lucide="message-circle"></i>
                    Contact Us
                </button>
            </div>
        </div>
    `;
    
    // Insert before booking content
    const container = document.querySelector('.booking-main .container');
    container.insertBefore(conflictDiv, document.getElementById('bookingContent'));
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function goBackToListing() {
    // Convert apartment ID to listing number (apt-1 -> 1, apt-2 -> 2, etc.)
    const listingNumber = bookingData.id.replace('apt-', '');
    window.location.href = `../listings/listing-${listingNumber}.html`;
}

function contactViaWhatsApp() {
    const message = `Hello! I'm interested in booking ${currentListing.name} but the dates ${formatDate(bookingData.checkin)} - ${formatDate(bookingData.checkout)} are not available. Can you help me find alternative dates?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/2349039269846?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

function formatDateFull(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// === SUMMARY CARD ===
function populateBookingData() {
    // Update breadcrumb
    document.getElementById('apartmentBreadcrumb').textContent = currentListing.name;
    
    // Populate listing preview
    const images = currentListing.images || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'];
    document.getElementById('listingThumbnail').src = images[0];
    document.getElementById('listingThumbnail').alt = currentListing.name;
    document.getElementById('listingName').textContent = currentListing.name;
    document.getElementById('categoryBadge').textContent = currentListing.category || 'Luxury';
    
    // Calculate nights and totals
    const nights = Math.ceil((bookingData.checkout - bookingData.checkin) / (1000 * 60 * 60 * 24));
    const subtotal = currentListing.pricePerNight * nights;
    const cautionFee = 10000;
    const grandTotal = subtotal + cautionFee;
    
    // Populate booking details
    document.getElementById('checkinDate').textContent = formatDate(bookingData.checkin);
    document.getElementById('checkoutDate').textContent = formatDate(bookingData.checkout);
    document.getElementById('durationNights').textContent = `${nights} night${nights > 1 ? 's' : ''}`;
    document.getElementById('guestCount').textContent = `${bookingData.guests} guest${bookingData.guests > 1 ? 's' : ''}`;
    
    // Populate price breakdown
    document.getElementById('priceLabel').textContent = `₦${currentListing.pricePerNight.toLocaleString('en-NG')} × ${nights} nights`;
    document.getElementById('subtotalAmount').textContent = `₦${subtotal.toLocaleString('en-NG')}`;
    document.getElementById('totalAmount').textContent = `₦${grandTotal.toLocaleString('en-NG')}`;
    
    // Set edit dates link
    const listingNumber = bookingData.id.replace('apt-', '');
    document.getElementById('editDatesLink').href = `../listings/listing-${listingNumber}.html`;
    
    // Populate house rules if available
    if (currentListing.rules && currentListing.rules.length > 0) {
        const rulesList = document.getElementById('houseRulesList');
        rulesList.innerHTML = '';
        currentListing.rules.forEach(rule => {
            const li = document.createElement('li');
            li.textContent = rule;
            rulesList.appendChild(li);
        });
    }
}

// === PAYMENT OPTIONS ===
function initializeInteractions() {
    // Payment option selection
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectPaymentMethod(option.dataset.method);
        });
    });
    
    // Form validation
    initializeFormValidation();
    
    // Accordion functionality
    initializeAccordion();
    
    // Submit handler
    document.getElementById('confirmBtn').addEventListener('click', handleSubmit);
    
    // Mobile menu
    initializeMobileMenu();
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        const isSelected = option.dataset.method === method;
        option.classList.toggle('selected', isSelected);
        
        const radioDot = option.querySelector('.radio-dot');
        radioDot.classList.toggle('active', isSelected);
    });
}

// === FORM VALIDATION ===
function initializeFormValidation() {
    const form = document.getElementById('guestForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateField(input);
            }
            updateSubmitButton();
        });
    });
    
    // Initial validation check
    updateSubmitButton();
}

function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous error state
    field.classList.remove('error');
    const errorElement = document.getElementById(`${fieldName}Error`);
    if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }
    
    // Validation rules
    switch (fieldName) {
        case 'fullName':
            if (!value) {
                isValid = false;
                errorMessage = 'Full name is required';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'Full name must be at least 2 characters';
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                isValid = false;
                errorMessage = 'Email address is required';
            } else if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
            
        case 'phone':
            const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
            if (!value) {
                isValid = false;
                errorMessage = 'Phone number is required';
            } else if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid Nigerian phone number';
            }
            break;
            
        case 'hearAbout':
            if (!value) {
                isValid = false;
                errorMessage = 'Please select how you heard about us';
            }
            break;
    }
    
    // Show error if invalid
    if (!isValid && errorElement) {
        field.classList.add('error');
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
    }
    
    return isValid;
}

function updateSubmitButton() {
    const form = document.getElementById('guestForm');
    const requiredInputs = form.querySelectorAll('input[required], select[required]');
    let allValid = true;
    
    requiredInputs.forEach(input => {
        if (!input.value.trim() || input.classList.contains('error')) {
            allValid = false;
        }
    });
    
    formValid = allValid;
    const submitBtn = document.getElementById('confirmBtn');
    submitBtn.disabled = !formValid;
}

// === ACCORDION ===
function initializeAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.dataset.target;
            const accordionItem = header.parentElement;
            const isActive = accordionItem.classList.contains('active');
            
            // Close all accordion items
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                accordionItem.classList.add('active');
            }
            
            // Re-initialize Lucide icons for the accordion
            lucide.createIcons();
        });
    });
}

// === SUBMIT HANDLER ===
async function handleSubmit() {
    if (!formValid) {
        alert('Please fill in all required fields correctly.');
        return;
    }
    
    const formData = getFormData();
    
    // Show loading state
    const submitBtn = document.getElementById('confirmBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    try {
        // Create booking via API
        const bookingPayload = {
            apartmentId: currentListing.id,
            guestName: formData.fullName,
            guestPhone: window.lekkirStaysAPI.formatNigerianPhone(formData.phone),
            guestEmail: formData.email,
            checkIn: window.lekkirStaysAPI.formatDate(bookingData.checkin),
            checkOut: window.lekkirStaysAPI.formatDate(bookingData.checkout),
            numGuests: formData.guests,
            totalPrice: calculateTotalPrice()
        };
        
        const response = await window.lekkirStaysAPI.createBooking(bookingPayload);
        
        if (response.success) {
            // Booking created successfully
            const booking = response.booking;
            
            switch (selectedPaymentMethod) {
                case 'arrival':
                    showSuccessState(formData, booking);
                    break;
                    
                case 'whatsapp':
                    // Use the WhatsApp link from the API response
                    if (response.whatsappLink) {
                        window.open(response.whatsappLink, '_blank');
                    }
                    showSuccessState(formData, booking);
                    break;
            }
        } else {
            throw new Error(response.error || 'Failed to create booking');
        }
        
    } catch (error) {
        console.error('Booking failed:', error);
        alert(`Booking failed: ${error.message}. Please try again or contact us directly.`);
        
        // Fallback to WhatsApp
        openWhatsApp(formData);
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function calculateTotalPrice() {
    const nights = Math.ceil((bookingData.checkout - bookingData.checkin) / (1000 * 60 * 60 * 24));
    const subtotal = currentListing.pricePerNight * nights;
    const cautionFee = 10000;
    return subtotal + cautionFee;
}

function getFormData() {
    const form = document.getElementById('guestForm');
    const formData = new FormData(form);
    
    return {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        guests: bookingData.guests, // Use the guest count from URL params
        specialRequests: formData.get('specialRequests') || 'None',
        hearAbout: formData.get('hearAbout')
    };
}

function showSuccessState(formData, booking = null) {
    const nights = Math.ceil((bookingData.checkout - bookingData.checkin) / (1000 * 60 * 60 * 24));
    
    let successMessage;
    if (booking) {
        successMessage = `Thank you, ${formData.fullName}. Your reservation has been confirmed with booking ID #${booking.id}. We will contact you on ${formData.phone} with further details. Check-in: ${formatDate(bookingData.checkin)} | Check-out: ${formatDate(bookingData.checkout)}`;
    } else {
        successMessage = `Thank you, ${formData.fullName}. Your reservation for ${currentListing.name} has been noted. We will contact you on ${formData.phone} to confirm. Check-in: ${formatDate(bookingData.checkin)} | Check-out: ${formatDate(bookingData.checkout)}`;
    }
    
    document.getElementById('successMessage').textContent = successMessage;
    
    // Hide booking content and show success state
    document.getElementById('bookingContent').style.display = 'none';
    document.getElementById('successState').style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openWhatsApp(formData) {
    const nights = Math.ceil((bookingData.checkout - bookingData.checkin) / (1000 * 60 * 60 * 24));
    const subtotal = currentListing.pricePerNight * nights;
    const grandTotal = subtotal + 10000;
    
    const message = `Hello Haven! I'd like to make a reservation.

Apartment: ${currentListing.name}
Check-in: ${formatDate(bookingData.checkin)}
Check-out: ${formatDate(bookingData.checkout)}
Nights: ${nights} nights
Guests: ${formData.guests} guests
Total: ₦${grandTotal.toLocaleString('en-NG')}

My Details:
Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Special Requests: ${formData.specialRequests}

Please confirm my booking. Thank you!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/2349039269846?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
}

// === UTILITY FUNCTIONS ===
function formatDate(date) {
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

function initializeMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.contains('active');
            
            if (!isOpen) {
                navMenu.classList.add('active');
                
                // Animate toggle bars
                const spans = mobileToggle.querySelectorAll('span');
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                navMenu.classList.remove('active');
                
                // Reset toggle bars
                const spans = mobileToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
}

// === LISTINGS DATA (inline for booking page) ===
const havenListings = [
    {
        id: 1,
        name: "Haven Lekki - Studio",
        category: "cozy homes",
        guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        price: 45000,
        pricePerNight: 45000,
        description: "A sleek modern studio in the heart of Lekki Phase 1. Perfect for business travelers and couples seeking luxury accommodation with easy access to Victoria Island and Ikoyi.",
        address: "15 Admiralty Way, Lekki Phase 1, Lagos",
        amenities: ["Swimming pool", "Kitchen", "Air conditioning", "WiFi", "Smart TV", "Hot water", "Security"],
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80"],
        reviews: [
            { name: "Amara O.", rating: 5, comment: "Absolutely stunning! The apartment exceeded all expectations. Perfect location and amazing amenities.", date: "March 2026" },
            { name: "Tolu B.", rating: 4, comment: "Great location, very clean and well-maintained. Would definitely stay again.", date: "February 2026" }
        ]
    },
    {
        id: 2,
        name: "The Metropolis Lekki - Studio",
        category: "luxury suites",
        guests: 4,
        bedrooms: 2,
        bathrooms: 2,
        price: 75000,
        pricePerNight: 75000,
        description: "Luxurious two-bedroom suite in the prestigious Metropolis development. Features modern amenities and stunning city views, perfect for families and business groups.",
        address: "Plot 1415, Adetokunbo Ademola Street, Victoria Island, Lagos",
        amenities: ["Swimming pool", "Gym", "Kitchen", "WiFi", "Smart TV", "Balcony", "Concierge", "Parking"],
        images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80", 
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80", 
                "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
        reviews: [
            { name: "Kemi A.", rating: 5, comment: "Exceptional service and beautiful apartment. The gym facilities are top-notch!", date: "March 2026" },
            { name: "David L.", rating: 4, comment: "Very comfortable stay with great amenities. Highly recommended for business trips.", date: "February 2026" },
            { name: "Sarah M.", rating: 5, comment: "Perfect for our family vacation. Kids loved the pool!", date: "January 2026" }
        ]
    },
    {
        id: 3,
        name: "Victoria Island Penthouse",
        category: "premium stays",
        guests: 6,
        bedrooms: 3,
        bathrooms: 3,
        price: 120000,
        pricePerNight: 120000,
        description: "Stunning three-bedroom penthouse with panoramic views of Lagos lagoon. Features premium finishes, spacious living areas, and exclusive access to rooftop terrace.",
        address: "1161 Memorial Drive, Victoria Island, Lagos",
        amenities: ["Swimming pool", "Kitchen", "Air conditioning", "Balcony", "Rooftop terrace", "WiFi", "Smart TV", "Gym", "Concierge"],
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80", 
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80", 
                "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
        reviews: [
            { name: "Chidi N.", rating: 5, comment: "Breathtaking views and luxurious amenities. Perfect for special occasions!", date: "March 2026" },
            { name: "Funmi K.", rating: 5, comment: "The rooftop terrace is absolutely amazing. Best stay in Lagos!", date: "February 2026" }
        ]
    },
    {
        id: 4,
        name: "Ikoyi Executive Suite",
        category: "executive homes",
        guests: 3,
        bedrooms: 2,
        bathrooms: 2,
        price: 85000,
        pricePerNight: 85000,
        description: "Executive two-bedroom suite in the prestigious Ikoyi district. Ideal for business executives and discerning travelers seeking sophistication and convenience.",
        address: "23 Kingsway Road, Ikoyi, Lagos",
        amenities: ["Gym", "Kitchen", "WiFi", "Parking", "Air conditioning", "Smart TV", "Security", "Workspace"],
        images: ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80", 
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
        reviews: [
            { name: "Adebayo S.", rating: 4, comment: "Great for business stays. The workspace area is very well designed.", date: "March 2026" },
            { name: "Jennifer O.", rating: 5, comment: "Excellent location and professional service. Perfect for corporate visits.", date: "January 2026" }
        ]
    },
    {
        id: 5,
        name: "Surulere Modern Apartment",
        category: "modern living",
        guests: 4,
        bedrooms: 2,
        bathrooms: 1,
        price: 35000,
        pricePerNight: 35000,
        description: "Contemporary two-bedroom apartment in vibrant Surulere. Great value accommodation with modern amenities and easy access to Lagos mainland attractions.",
        address: "45 Adeniran Ogunsanya Street, Surulere, Lagos",
        amenities: ["Kitchen", "WiFi", "Air conditioning", "Smart TV", "Hot water", "Security"],
        images: ["https://images.unsplash.com/photo-1556020685-ae41abfc9365?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80", 
                "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80"],
        reviews: [
            { name: "Bola T.", rating: 4, comment: "Great value for money. Clean and comfortable with friendly hosts.", date: "February 2026" },
            { name: "Michael A.", rating: 4, comment: "Perfect location for exploring Lagos mainland. Highly recommended!", date: "January 2026" }
        ]
    },
    {
        id: 6,
        name: "Abuja City Center Loft",
        category: "urban lofts",
        guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        price: 55000,
        pricePerNight: 55000,
        description: "Stylish urban loft in the heart of Abuja's central business district. Modern design meets comfort with premium amenities and easy access to government offices.",
        address: "Plot 123, Central Business District, Abuja",
        amenities: ["Swimming pool", "Gym", "Kitchen", "WiFi", "Air conditioning", "Smart TV", "Parking"],
        images: ["https://images.unsplash.com/photo-1560185127-6ed189bf02f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80", 
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
        reviews: [
            { name: "Fatima H.", rating: 5, comment: "Perfect location for business in Abuja. Modern and well-equipped.", date: "March 2026" },
            { name: "James I.", rating: 4, comment: "Great loft with excellent amenities. Very convenient location.", date: "February 2026" }
        ]
    },
    {
        id: 7,
        name: "Yaba Creative Space",
        category: "creative hubs",
        guests: 5,
        bedrooms: 3,
        bathrooms: 2,
        price: 65000,
        pricePerNight: 65000,
        description: "Inspiring three-bedroom creative space in the tech hub of Yaba. Perfect for digital nomads, startups, and creative professionals seeking a collaborative environment.",
        address: "12 Herbert Macaulay Way, Yaba, Lagos",
        amenities: ["WiFi", "Kitchen", "Air conditioning", "Workspace", "Smart TV", "Hot water", "Security", "Co-working area"],
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80", 
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80", 
                "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
        reviews: [
            { name: "Emeka C.", rating: 5, comment: "Amazing space for our startup team. The co-working area is fantastic!", date: "March 2026" },
            { name: "Aisha B.", rating: 4, comment: "Great for creative work. Love the vibe and location in Yaba.", date: "February 2026" },
            { name: "Peter D.", rating: 5, comment: "Perfect for digital nomads. Fast WiFi and inspiring environment.", date: "January 2026" }
        ]
    },
    {
        id: 8,
        name: "Ajah Beachfront Villa",
        category: "beachfront homes",
        guests: 8,
        bedrooms: 4,
        bathrooms: 3,
        price: 150000,
        pricePerNight: 150000,
        description: "Luxurious four-bedroom beachfront villa with direct beach access. Perfect for large families and groups seeking a premium coastal experience with world-class amenities.",
        address: "Km 35, Lekki-Epe Expressway, Ajah, Lagos",
        amenities: ["Swimming pool", "Kitchen", "Beach access", "Balcony", "WiFi", "Air conditioning", "Smart TV", "BBQ area", "Security"],
        images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80", 
                "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=2084&q=80", 
                "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
        reviews: [
            { name: "Olumide F.", rating: 5, comment: "Incredible beachfront experience! The villa is absolutely stunning with amazing ocean views.", date: "March 2026" },
            { name: "Grace N.", rating: 5, comment: "Perfect for our family reunion. Beach access and pool were highlights!", date: "February 2026" },
            { name: "Robert K.", rating: 4, comment: "Beautiful location and great amenities. Highly recommend for special occasions.", date: "January 2026" }
        ]
    }
];

// === PENDING BOOKINGS MANAGEMENT ===
// NOTE: This section is for ADMIN/HOST use only, not for guests
// Guests should not see pending bookings on the booking page
// This functionality should be moved to a separate admin dashboard

async function loadPendingBookings() {
    // This function is disabled for guest booking page
    // Pending bookings should only be visible to admin/host
    // Host receives booking notifications via WhatsApp with confirm/decline links
    
    console.log('Pending bookings section disabled - Host manages bookings via WhatsApp');
    return;
    
    /* ORIGINAL CODE - COMMENTED OUT
    const bookingManager = new BookingManager();
    const allBookings = bookingManager.getAllBookings();
    
    if (!allBookings.success || allBookings.bookings.length === 0) {
        showEmptyBookingsState();
        return;
    }
    
    // Filter pending bookings
    const pendingBookings = allBookings.bookings.filter(b => b.status === 'pending');
    
    if (pendingBookings.length === 0) {
        showEmptyBookingsState();
        return;
    }
    
    // Show pending bookings section
    const section = document.getElementById('pendingBookingsSection');
    section.style.display = 'block';
    
    // Populate bookings list
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = '';
    
    pendingBookings.forEach(booking => {
        const bookingCard = createBookingCard(booking);
        bookingsList.appendChild(bookingCard);
    });
    */
}

function createBookingCard(booking) {
    // This function is disabled - bookings are managed via WhatsApp by host
    console.log('Booking card creation disabled - use WhatsApp for booking management');
    return document.createElement('div');
    
    /* ORIGINAL CODE - COMMENTED OUT
    const card = document.createElement('div');
    card.className = 'booking-card-item';
    card.id = `booking-${booking.id}`;
    
    const checkInDate = new Date(booking.checkin);
    const checkOutDate = new Date(booking.checkout);
    
    card.innerHTML = `
        <div class="booking-card-header">
            <div>
                <div class="booking-ref">Booking #${booking.id}</div>
                <div style="font-size: 0.9rem; color: #999; margin-top: 4px;">
                    Submitted: ${new Date(booking.createdAt).toLocaleDateString('en-NG')}
                </div>
            </div>
            <span class="booking-status status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
        </div>
        
        <div class="booking-details-grid">
            <div class="detail-item">
                <div class="detail-item-label">Apartment</div>
                <div class="detail-item-value">${booking.propertyName || 'Property ' + booking.propertyId}</div>
            </div>
            <div class="detail-item">
                <div class="detail-item-label">Check-in</div>
                <div class="detail-item-value">${formatDate(checkInDate)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-item-label">Check-out</div>
                <div class="detail-item-value">${formatDate(checkOutDate)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-item-label">Guests</div>
                <div class="detail-item-value">${booking.numGuests || booking.guests} guest${booking.numGuests > 1 ? 's' : ''}</div>
            </div>
            <div class="detail-item">
                <div class="detail-item-label">Total Price</div>
                <div class="detail-item-value">₦${(booking.totalPrice || 0).toLocaleString('en-NG')}</div>
            </div>
        </div>
        
        <div class="guest-info">
            <div class="guest-info-row">
                <span class="guest-info-label">Guest Name:</span>
                <span class="guest-info-value">${booking.guestName}</span>
            </div>
            <div class="guest-info-row">
                <span class="guest-info-label">Email:</span>
                <span class="guest-info-value">${booking.guestEmail}</span>
            </div>
            <div class="guest-info-row">
                <span class="guest-info-label">Phone:</span>
                <span class="guest-info-value">${booking.guestPhone}</span>
            </div>
            ${booking.specialRequests ? `
            <div class="guest-info-row">
                <span class="guest-info-label">Special Requests:</span>
                <span class="guest-info-value">${booking.specialRequests}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="booking-actions">
            <button class="btn-decline" onclick="declineBooking('${booking.id}')">
                <i data-lucide="x"></i> Decline
            </button>
            <button class="btn-confirm" onclick="confirmBooking('${booking.id}')">
                <i data-lucide="check"></i> Confirm
            </button>
        </div>
    `;
    
    return card;
    */
}

function confirmBooking(bookingId) {
    // This function is disabled - bookings are confirmed via WhatsApp links by host
    console.log('Direct booking confirmation disabled - use WhatsApp confirmation links');
    alert('Bookings are confirmed by the host via WhatsApp. Please check your WhatsApp for confirmation.');
    
    /* ORIGINAL CODE - COMMENTED OUT
    if (!confirm('Are you sure you want to confirm this booking?')) {
        return;
    }
    
    const bookingManager = new BookingManager();
    const result = bookingManager.updateBookingStatus(bookingId, 'confirmed');
    
    if (result.success) {
        // Update UI
        const card = document.getElementById(`booking-${bookingId}`);
        if (card) {
            card.style.opacity = '0.6';
            const statusBadge = card.querySelector('.booking-status');
            statusBadge.textContent = 'Confirmed';
            statusBadge.className = 'booking-status status-confirmed';
            
            const actionButtons = card.querySelector('.booking-actions');
            actionButtons.innerHTML = '<span style="color: #4caf50; font-weight: 600;">✓ Confirmed</span>';
        }
        
        // Show success message
        alert('Booking confirmed successfully!');
        
        // Send confirmation via WhatsApp
        sendConfirmationMessage(result.booking, 'confirmed');
    } else {
        alert('Failed to confirm booking: ' + result.message);
    }
    */
}

function declineBooking(bookingId) {
    // This function is disabled - bookings are declined via WhatsApp links by host
    console.log('Direct booking decline disabled - use WhatsApp decline links');
    alert('Bookings are managed by the host via WhatsApp. Please contact us if you need to cancel.');
    
    /* ORIGINAL CODE - COMMENTED OUT
    if (!confirm('Are you sure you want to decline this booking?')) {
        return;
    }
    
    const bookingManager = new BookingManager();
    const result = bookingManager.updateBookingStatus(bookingId, 'declined');
    
    if (result.success) {
        // Update UI
        const card = document.getElementById(`booking-${bookingId}`);
        if (card) {
            card.style.opacity = '0.6';
            const statusBadge = card.querySelector('.booking-status');
            statusBadge.textContent = 'Declined';
            statusBadge.className = 'booking-status status-declined';
            
            const actionButtons = card.querySelector('.booking-actions');
            actionButtons.innerHTML = '<span style="color: #f44336; font-weight: 600;">✗ Declined</span>';
        }
        
        // Show success message
        alert('Booking declined successfully!');
        
        // Send decline message via WhatsApp
        sendConfirmationMessage(result.booking, 'declined');
    } else {
        alert('Failed to decline booking: ' + result.message);
    }
    */
}

function sendConfirmationMessage(booking, status) {
    const checkInDate = new Date(booking.checkin);
    const checkOutDate = new Date(booking.checkout);
    
    let message;
    if (status === 'confirmed') {
        message = `Hello ${booking.guestName}! Your booking has been confirmed. 

Booking ID: ${booking.id}
Apartment: ${booking.propertyName || 'Property ' + booking.propertyId}
Check-in: ${formatDate(checkInDate)}
Check-out: ${formatDate(checkOutDate)}
Guests: ${booking.numGuests}
Total: ₦${(booking.totalPrice || 0).toLocaleString('en-NG')}

We look forward to hosting you! Check-in instructions will be sent shortly.`;
    } else {
        message = `Hello ${booking.guestName}, Thank you for your interest in booking with us. Unfortunately, we are unable to confirm your booking for ${formatDate(checkInDate)} - ${formatDate(checkOutDate)}. 

Please feel free to contact us to explore alternative dates or properties. We appreciate your understanding!`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${booking.guestPhone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    // Open WhatsApp (optional - can be removed if you want silent sending)
    console.log('Sending confirmation message to:', booking.guestPhone);
}

function showEmptyBookingsState() {
    const section = document.getElementById('pendingBookingsSection');
    const bookingsList = document.getElementById('bookingsList');
    
    section.style.display = 'block';
    bookingsList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i data-lucide="clipboard" style="width: 48px; height: 48px;"></i>
            </div>
            <div class="empty-state-text">No pending bookings at the moment</div>
        </div>
    `;
    
    // Initialize Lucide icons for the empty state
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Navbar Book Now button functionality
document.addEventListener('DOMContentLoaded', function() {
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', () => {
            // Navigate to index.html apartments section
            window.location.href = 'index.html#apartments';
        });
    }
    
    // Load pending bookings if on booking page
    if (document.getElementById('pendingBookingsSection')) {
        loadPendingBookings();
    }
});