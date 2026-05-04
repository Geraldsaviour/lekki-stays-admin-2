// ===== LISTING DETAIL PAGE JAVASCRIPT =====

// Import listings data (will be inlined in each HTML file)
let currentListing = null;
let selectedCheckin = null;
let selectedCheckout = null;
let guestCount = 1;
let currentDate = new Date();
let isSelectingCheckin = true;
let bookedDates = []; // Store booked date ranges

// Calendar configuration
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ===== URL PARAMETER HANDLING =====
function loadBookingDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load check-in date
    const checkinParam = urlParams.get('checkin');
    if (checkinParam) {
        selectedCheckin = new Date(checkinParam);
    }
    
    // Load check-out date
    const checkoutParam = urlParams.get('checkout');
    if (checkoutParam) {
        selectedCheckout = new Date(checkoutParam);
    }
    
    // Load guest counts
    const adultsParam = urlParams.get('adults');
    if (adultsParam) {
        const adults = parseInt(adultsParam);
        const children = parseInt(urlParams.get('children') || '0');
        const infants = parseInt(urlParams.get('infants') || '0');
        guestCount = adults + children; // Total guests for display
    }
    
    // Update date fields if dates were loaded
    if (selectedCheckin || selectedCheckout) {
        updateDateFields();
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeDetailPage();
});

async function initializeDetailPage() {
    // Get listing number from URL (e.g., listing-6.html -> 6)
    const urlPath = window.location.pathname;
    const listingNumber = urlPath.match(/listing-(\d+)\.html/)?.[1];
    
    if (!listingNumber) {
        console.error('Could not determine listing number from URL');
        return;
    }
    
    // Convert listing number to apartment ID (6 -> apt-6)
    const apartmentId = `apt-${listingNumber}`;
    
    try {
        // Fetch apartment data from API
        const response = await window.lekkirStaysAPI.getApartment(apartmentId);
        
        if (!response.success || !response.apartment) {
            console.error('Failed to load apartment data:', response);
            showErrorState();
            return;
        }
        
        // Set current listing from API data
        currentListing = response.apartment;
        
        // Load booking data from URL parameters
        loadBookingDataFromURL();
        
        // Fetch booked dates for this apartment
        fetchBookedDates(apartmentId);
        
        // Populate all sections
        populatePropertyInfo();
        populateImageGallery();
        populateAmenities();
        populateBookingPanel();
        populateLocationSection();
        populateReviewsSection();
        
        // Initialize interactions
        initializeImageGallery();
        initializeBookingPanel();
        initializeMobileMenu();
        
    } catch (error) {
        console.error('Error loading apartment:', error);
        showErrorState();
    }
}

function showErrorState() {
    document.body.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center;">
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">Apartment Not Found</h1>
            <p style="margin-bottom: 2rem;">Sorry, we couldn't load this apartment's details.</p>
            <a href="../index.html" style="padding: 1rem 2rem; background: #D4AF37; color: white; text-decoration: none; border-radius: 8px;">Back to Home</a>
        </div>
    `;
}

// ===== PROPERTY INFO SECTION =====
function populatePropertyInfo() {
    document.getElementById('propertyTitle').textContent = currentListing.name;
    
    // Handle both API format (maxGuests) and old format (guests)
    const guests = currentListing.maxGuests || currentListing.guests || 1;
    const bedrooms = currentListing.bedrooms || 1;
    const bathrooms = currentListing.bathrooms || 1;
    
    document.getElementById('propertySpecs').innerHTML = `
        <span>${guests} guest${guests > 1 ? 's' : ''}</span>
        <div class="spec-divider"></div>
        <span>${bedrooms} bedroom${bedrooms > 1 ? 's' : ''}</span>
        <div class="spec-divider"></div>
        <span>${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}</span>
    `;
    document.getElementById('categoryBadge').textContent = currentListing.category || 'Luxury';
    document.getElementById('propertyDescription').textContent = currentListing.description || '';
}

// ===== IMAGE GALLERY SECTION =====
function populateImageGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnailRow = document.getElementById('thumbnailRow');
    
    // Set main image
    mainImage.src = currentListing.images[0];
    mainImage.alt = currentListing.name;
    
    // Create thumbnails
    thumbnailRow.innerHTML = '';
    currentListing.images.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.innerHTML = `<img src="${image}" alt="${currentListing.name} - Image ${index + 1}">`;
        thumbnail.addEventListener('click', () => switchMainImage(index));
        thumbnailRow.appendChild(thumbnail);
    });
}

function initializeImageGallery() {
    // Already handled in populateImageGallery
}

function switchMainImage(index) {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    // Update main image with fade effect
    mainImage.style.opacity = '0';
    setTimeout(() => {
        mainImage.src = currentListing.images[index];
        mainImage.style.opacity = '1';
    }, 150);
    
    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// ===== AMENITIES SECTION =====
function populateAmenities() {
    const amenitiesGrid = document.getElementById('amenitiesGrid');
    
    // Amenity icons mapping
    const amenityIcons = {
        'Swimming pool': '<i data-lucide="waves"></i>',
        'Kitchen': '<i data-lucide="utensils"></i>',
        'Air conditioning': '<i data-lucide="wind"></i>',
        'WiFi': '<i data-lucide="wifi"></i>',
        'Smart TV': '<i data-lucide="tv"></i>',
        'Hot water': '<i data-lucide="droplets"></i>',
        'Security': '<i data-lucide="shield-check"></i>',
        'Gym': '<i data-lucide="dumbbell"></i>',
        'Balcony': '<i data-lucide="building"></i>',
        'Rooftop terrace': '<i data-lucide="building-2"></i>',
        'Concierge': '<i data-lucide="bell"></i>',
        'Parking': '<i data-lucide="car"></i>',
        'Workspace': '<i data-lucide="laptop"></i>',
        'Beach access': '<i data-lucide="waves"></i>',
        'BBQ area': '<i data-lucide="flame"></i>',
        'Co-working area': '<i data-lucide="users"></i>'
    };
    
    amenitiesGrid.innerHTML = '';
    currentListing.amenities.forEach(amenity => {
        const amenityItem = document.createElement('div');
        amenityItem.className = 'amenity-item';
        amenityItem.innerHTML = `
            <div class="amenity-icon">${amenityIcons[amenity] || '<i data-lucide="star"></i>'}</div>
            <div class="amenity-label">${amenity}</div>
        `;
        amenitiesGrid.appendChild(amenityItem);
    });
    
    // Initialize Lucide icons after adding amenities
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ===== BOOKING PANEL SECTION =====
function populateBookingPanel() {
    document.getElementById('priceAmount').textContent = formatPrice(currentListing.pricePerNight);
    document.getElementById('guestCount').textContent = guestCount;
    updateDateFields(); // Update date fields with any pre-loaded dates
    updateTotalDisplay();
}

function initializeBookingPanel() {
    // Guest controls
    document.getElementById('decreaseGuests').addEventListener('click', () => {
        if (guestCount > 1) {
            guestCount--;
            document.getElementById('guestCount').textContent = guestCount;
            updateTotalDisplay();
        }
    });
    
    document.getElementById('increaseGuests').addEventListener('click', () => {
        const maxGuests = currentListing.maxGuests || currentListing.guests || 10;
        if (guestCount < maxGuests) {
            guestCount++;
            document.getElementById('guestCount').textContent = guestCount;
            updateTotalDisplay();
        }
    });
    
    // Initialize calendar functionality
    initializeCalendar();
    
    // Date fields - use calendar dropdown
    document.getElementById('checkinField').addEventListener('click', () => {
        openCalendar('checkin');
    });
    
    document.getElementById('checkoutField').addEventListener('click', () => {
        openCalendar('checkout');
    });
    
    // Reserve button
    document.getElementById('reserveBtn').addEventListener('click', () => {
        if (!selectedCheckin || !selectedCheckout) {
            alert('Please select check-in and check-out dates');
            return;
        }
        
        // Build booking URL with parameters
        const checkinParam = selectedCheckin.toISOString().split('T')[0];
        const checkoutParam = selectedCheckout.toISOString().split('T')[0];
        const bookingUrl = `../booking/booking.html?id=${currentListing.id}&checkin=${checkinParam}&checkout=${checkoutParam}&guests=${guestCount}`;
        
        // Navigate to booking page
        window.location.href = bookingUrl;
    });
}

function updateTotalDisplay() {
    const totalDisplay = document.getElementById('totalDisplay');
    
    if (selectedCheckin && selectedCheckout) {
        const nights = Math.ceil((selectedCheckout - selectedCheckin) / (1000 * 60 * 60 * 24));
        const total = nights * currentListing.pricePerNight;
        
        totalDisplay.innerHTML = `
            <div class="total-label">${nights} night${nights > 1 ? 's' : ''}</div>
            <div class="total-amount">${formatPrice(total)}</div>
        `;
        totalDisplay.style.display = 'block';
    } else {
        totalDisplay.style.display = 'none';
    }
    
    // Update guest button states
    document.getElementById('decreaseGuests').disabled = guestCount <= 1;
    document.getElementById('increaseGuests').disabled = guestCount >= currentListing.guests;
}

// ===== LOCATION SECTION =====
function populateLocationSection() {
    const mapIframe = document.getElementById('mapIframe');
    const addressDisplay = document.getElementById('addressDisplay');
    
    // Create Google Maps embed URL
    const encodedAddress = encodeURIComponent(currentListing.address);
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedAddress}`;
    
    // For demo purposes, use a generic Lagos map
    mapIframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7708539399!2d3.4195394!3d6.4281395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b2ae68280c1%3A0xdc692ba70413d8e5!2sLagos%2C%20Nigeria!5e0!3m2!1sen!2sus!4v1635959542000!5m2!1sen!2sus`;
    
    addressDisplay.textContent = currentListing.address;
}

// ===== REVIEWS SECTION =====
function populateReviewsSection() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    const averageRating = document.getElementById('averageRating');
    
    if (currentListing.reviews && currentListing.reviews.length > 0) {
        // Use average rating from API or calculate it
        const avgRating = currentListing.averageRating || 
                         (currentListing.reviews.reduce((sum, review) => sum + review.rating, 0) / currentListing.reviews.length).toFixed(1);
        
        averageRating.innerHTML = `<span class="star-rating">★</span> ${avgRating}`;
        
        // Render reviews
        reviewsGrid.innerHTML = '';
        currentListing.reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            
            // Format date - handle both API format (review_date) and old format (date)
            const reviewDate = review.review_date || review.date;
            const formattedDate = reviewDate ? new Date(reviewDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
            }) : '';
            
            // Handle both API format (guest_name) and old format (name)
            const reviewerName = review.guest_name || review.name || 'Anonymous';
            
            reviewCard.innerHTML = `
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-name">${reviewerName}</div>
                        <div class="review-date">${formattedDate}</div>
                    </div>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                </div>
                <div class="review-comment">${review.comment}</div>
            `;
            reviewsGrid.appendChild(reviewCard);
        });
    } else {
        averageRating.innerHTML = '';
        reviewsGrid.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to stay!</div>';
    }
}

// ===== MOBILE MENU =====
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

// ===== CALENDAR FUNCTIONALITY =====
// Fetch booked dates from API
async function fetchBookedDates() {
    if (!currentListing) return;
    
    try {
        const response = await window.lekkirStaysAPI.getBookedDates(currentListing.id);
        if (response.success && response.bookedDates) {
            bookedDates = response.bookedDates;
            // Re-render calendar with booked dates
            renderCalendar();
        }
    } catch (error) {
        console.error('Failed to fetch booked dates:', error);
        // Continue without booked dates
    }
}

// Check if a date is booked
function isDateBooked(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    for (const booking of bookedDates) {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        
        // Check if date falls within any booked range (inclusive of check-in, exclusive of check-out)
        if (date >= checkIn && date < checkOut) {
            return booking;
        }
    }
    
    return null;
}

function initializeCalendar() {
    renderCalendar();
    
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        navigateMonth(-1);
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        navigateMonth(1);
    });
    
    // Clear dates
    document.getElementById('clearDatesBtn').addEventListener('click', () => {
        clearDates();
    });
    
    // Close calendar when clicking outside
    document.addEventListener('click', (e) => {
        const calendarDropdown = document.getElementById('calendarDropdown');
        const checkinField = document.getElementById('checkinField');
        const checkoutField = document.getElementById('checkoutField');
        
        if (!calendarDropdown.contains(e.target) && 
            !checkinField.contains(e.target) && 
            !checkoutField.contains(e.target)) {
            closeCalendar();
        }
    });
}

function openCalendar(mode) {
    isSelectingCheckin = mode === 'checkin';
    
    // Show calendar dropdown
    const calendarDropdown = document.getElementById('calendarDropdown');
    calendarDropdown.classList.add('active');
    
    // Update field states
    document.getElementById('checkinField').classList.remove('active');
    document.getElementById('checkoutField').classList.remove('active');
    
    const activeField = mode === 'checkin' ? 'checkinField' : 'checkoutField';
    document.getElementById(activeField).classList.add('active');
}

function closeCalendar() {
    document.getElementById('calendarDropdown').classList.remove('active');
    document.getElementById('checkinField').classList.remove('active');
    document.getElementById('checkoutField').classList.remove('active');
}

function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const currentMonth = new Date(currentDate);
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Update month headers
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    document.getElementById('nextMonth').textContent = 
        `${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;
    
    // Render both month grids
    renderMonthGrid('currentMonthGrid', currentMonth);
    renderMonthGrid('nextMonthGrid', nextMonth);
    
    updateSelectedDatesDisplay();
}

function renderMonthGrid(containerId, date) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Add weekdays header
    const weekdaysDiv = document.createElement('div');
    weekdaysDiv.className = 'calendar-weekdays';
    weekdays.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-weekday';
        dayDiv.textContent = day;
        weekdaysDiv.appendChild(dayDiv);
    });
    container.appendChild(weekdaysDiv);
    
    // Add days grid
    const daysDiv = document.createElement('div');
    daysDiv.className = 'calendar-days';
    
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = currentDay.getDate();
        
        // Check if day is in current month
        if (currentDay.getMonth() !== date.getMonth()) {
            dayDiv.style.opacity = '0.3';
            dayDiv.style.pointerEvents = 'none';
            daysDiv.appendChild(dayDiv);
            continue;
        }
        
        // Check if day is in the past or today (can't check in same day)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (currentDay < tomorrow) {
            dayDiv.classList.add('disabled');
            daysDiv.appendChild(dayDiv);
            continue;
        }
        
        // Check if day is booked
        const booking = isDateBooked(currentDay);
        if (booking) {
            dayDiv.classList.add('booked');
            dayDiv.title = 'This date is not available';
            
            // Add click event to show popup
            dayDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                showBookedDatePopup(currentDay, booking);
            });
            
            daysDiv.appendChild(dayDiv);
            continue;
        }
        
        // Check if day is selected
        if (selectedCheckin && isSameDay(currentDay, selectedCheckin)) {
            dayDiv.classList.add('selected', 'range-start');
        } else if (selectedCheckout && isSameDay(currentDay, selectedCheckout)) {
            dayDiv.classList.add('selected', 'range-end');
        } else if (isInRange(currentDay)) {
            dayDiv.classList.add('in-range');
        }
        
        // Add click event
        dayDiv.addEventListener('click', () => {
            selectDate(currentDay);
        });
        
        daysDiv.appendChild(dayDiv);
    }
    
    container.appendChild(daysDiv);
}

function selectDate(date) {
    if (isSelectingCheckin) {
        selectedCheckin = new Date(date);
        selectedCheckout = null;
        isSelectingCheckin = false;
        
        // Switch to checkout selection
        document.getElementById('checkinField').classList.remove('active');
        document.getElementById('checkoutField').classList.add('active');
    } else {
        if (date <= selectedCheckin) {
            // If checkout is before checkin, reset and select as checkin
            selectedCheckin = new Date(date);
            selectedCheckout = null;
            isSelectingCheckin = false;
        } else {
            selectedCheckout = new Date(date);
            // Close calendar after selecting checkout
            setTimeout(() => closeCalendar(), 300);
        }
    }
    
    renderCalendar();
    updateDateFields();
    updateTotalDisplay();
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function isInRange(date) {
    if (!selectedCheckin || !selectedCheckout) return false;
    return date > selectedCheckin && date < selectedCheckout;
}

function updateSelectedDatesDisplay() {
    const checkinDisplay = document.getElementById('checkinDisplay');
    const checkoutDisplay = document.getElementById('checkoutDisplay');
    
    if (checkinDisplay && checkoutDisplay) {
        if (selectedCheckin) {
            checkinDisplay.textContent = `Check-in: ${formatDate(selectedCheckin)}`;
        } else {
            checkinDisplay.textContent = '';
        }
        
        if (selectedCheckout) {
            checkoutDisplay.textContent = `Check-out: ${formatDate(selectedCheckout)}`;
        } else {
            checkoutDisplay.textContent = '';
        }
    }
}

function clearDates() {
    selectedCheckin = null;
    selectedCheckout = null;
    isSelectingCheckin = true;
    renderCalendar();
    updateDateFields();
    updateTotalDisplay();
}

function updateDateFields() {
    const checkinValue = document.getElementById('checkinValue');
    const checkoutValue = document.getElementById('checkoutValue');
    
    if (checkinValue && checkoutValue) {
        if (selectedCheckin) {
            checkinValue.textContent = formatDate(selectedCheckin);
        } else {
            checkinValue.textContent = 'Add date';
        }
        
        if (selectedCheckout) {
            checkoutValue.textContent = formatDate(selectedCheckout);
        } else {
            checkoutValue.textContent = 'Add date';
        }
    }
}
function formatPrice(price) {
    return '₦' + price.toLocaleString('en-NG');
}

function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Show popup for booked dates
function showBookedDatePopup(date, booking) {
    // Remove any existing popup
    const existingPopup = document.getElementById('bookedDatePopup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'bookedDatePopup';
    popup.className = 'booked-date-popup';
    
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <i data-lucide="calendar-x"></i>
                <h3>Date Not Available</h3>
            </div>
            <div class="popup-body">
                <p>This date is already booked.</p>
                <div class="booking-info">
                    <div class="info-row">
                        <span class="info-label">Booked from:</span>
                        <span class="info-value">${formatDateFull(checkInDate)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Until:</span>
                        <span class="info-value">${formatDateFull(checkOutDate)}</span>
                    </div>
                </div>
                <p class="popup-message">Please select different dates for your stay.</p>
            </div>
            <div class="popup-footer">
                <button class="popup-close-btn" onclick="closeBookedDatePopup()">OK</button>
            </div>
        </div>
        <div class="popup-overlay" onclick="closeBookedDatePopup()"></div>
    `;
    
    document.body.appendChild(popup);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Animate in
    setTimeout(() => {
        popup.classList.add('active');
    }, 10);
}

function closeBookedDatePopup() {
    const popup = document.getElementById('bookedDatePopup');
    if (popup) {
        popup.classList.remove('active');
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}

function formatDateFull(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// ===== SMOOTH SCROLLING =====
// Only apply smooth scrolling to same-page anchors (not cross-page navigation)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Only prevent default for same-page anchors (not index.html#section)
        if (!href.includes('index.html') && !href.includes('.html')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
        // For cross-page navigation (index.html#section), let browser handle it naturally
    });
});

// ===== SCROLL ANIMATIONS =====
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const scrolled = window.pageYOffset;
    
    if (scrolled > 100) {
        navbar.style.background = 'rgba(0, 0, 0, 0.9)';
        navbar.style.backdropFilter = 'blur(15px)';
    } else {
        navbar.style.background = 'transparent';
        navbar.style.backdropFilter = 'blur(5px)';
    }
});
// Navbar Book Now button functionality
document.addEventListener('DOMContentLoaded', function() {
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', () => {
            // Navigate to index.html apartments section (use relative path for subdirectories)
            window.location.href = '../index.html#apartments';
        });
    }
});