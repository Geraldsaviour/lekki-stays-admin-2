// Dashboard Logic
import { 
    supabase,
    getCurrentUser,
    signOut,
    getAllBookings,
    getBookingsByStatus,
    getBookingById,
    confirmBooking,
    declineBooking,
    markAsPaid,
    cancelBooking,
    getAllApartments,
    getBookingStats,
    sendPaymentDetails,
    formatDate,
    formatDateShort,
    formatCurrency,
    calculateNights,
    getStatusLabel
} from './api.js';

// Global state
let currentBookings = [];
let currentApartments = [];
let currentStats = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    initializeNavigation();
    initializeEventListeners();
    initializeMobileMenu();
    initializeReceiptModal();
    await loadDashboardData();
    initializeLucideIcons();
});

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');
    const navItems = document.querySelectorAll('.nav-item');

    // Open sidebar
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            mobileMenuToggle.classList.add('hidden'); // Hide hamburger button
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }

    // Close sidebar
    const closeSidebar = () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        if (mobileMenuToggle) {
            mobileMenuToggle.classList.remove('hidden'); // Show hamburger button
        }
        document.body.style.overflow = ''; // Restore scrolling
    };

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when nav item is clicked (mobile only)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

// Check authentication
async function checkAuth() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Update user info
        document.getElementById('userEmail').textContent = user.email;
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = 'index.html';
    }
}

// Initialize navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${sectionId}-section`).classList.add('active');

            // Update page title
            const title = item.querySelector('span').textContent;
            document.getElementById('pageTitle').textContent = title;

            // Reinitialize icons after section change
            initializeLucideIcons();
        });
    });

    // Handle view all links
    document.querySelectorAll('.view-all-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            const navItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (navItem) navItem.click();
        });
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        const confirmed = await showConfirm(
            'Are you sure you want to logout?',
            'Confirm Logout'
        );
        
        if (confirmed) {
            try {
                await signOut();
                
                // Clear any cached data
                sessionStorage.clear();
                localStorage.clear();
                
                // Force redirect to login page
                window.location.replace('index.html');
            } catch (error) {
                console.error('Logout error:', error);
                await showAlert('Failed to logout. Please try again.', 'error');
            }
        }
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadDashboardData();
    });

    // Status filter
    document.getElementById('statusFilter').addEventListener('change', async (e) => {
        const status = e.target.value;
        await filterBookings(status);
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        searchBookings(searchTerm);
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    // Reason modal close
    document.getElementById('closeReasonModal').addEventListener('click', closeReasonModal);
    document.getElementById('cancelReasonBtn').addEventListener('click', closeReasonModal);
    
    // Close reason modal when clicking overlay
    document.querySelectorAll('#reasonModal .modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeReasonModal();
            }
        });
    });
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Show loading states
        showLoadingState('recentBookingsList');
        showLoadingState('allBookingsList');
        showLoadingState('apartmentsList');

        // Load data in parallel
        const [bookings, apartments, stats] = await Promise.all([
            getAllBookings(),
            getAllApartments(),
            getBookingStats()
        ]);

        currentBookings = bookings;
        currentApartments = apartments;
        currentStats = stats;

        // Update UI
        updateStats(stats);
        displayRecentBookings(bookings.slice(0, 5));
        displayAllBookings(bookings);
        displayApartments(apartments);

        initializeLucideIcons();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
    }
}

// Update statistics
function updateStats(stats) {
    document.getElementById('totalBookings').textContent = stats.total;
    document.getElementById('pendingBookings').textContent = stats.pending;
    document.getElementById('confirmedBookings').textContent = stats.confirmed;
    document.getElementById('paidBookings').textContent = stats.paid;
}

// Display recent bookings
function displayRecentBookings(bookings) {
    const container = document.getElementById('recentBookingsList');

    if (bookings.length === 0) {
        container.innerHTML = '<p class="loading-state">No bookings yet</p>';
        return;
    }

    container.innerHTML = bookings.map(booking => createBookingCard(booking, true)).join('');
    attachBookingCardListeners();
}

// Display all bookings
function displayAllBookings(bookings) {
    const container = document.getElementById('allBookingsList');

    if (bookings.length === 0) {
        container.innerHTML = '<p class="loading-state">No bookings found</p>';
        return;
    }

    container.innerHTML = bookings.map(booking => createBookingCard(booking, false)).join('');
    attachBookingCardListeners();
}

// Create booking card HTML
function createBookingCard(booking, isCompact = false) {
    const apartmentName = booking.apartments?.name || 'Unknown Apartment';
    const nights = calculateNights(booking.check_in, booking.check_out);
    const statusClass = `status-${booking.status}`;
    const statusLabel = getStatusLabel(booking.status);

    return `
        <div class="booking-card" data-booking-id="${booking.id}">
            <div class="booking-header">
                <div class="booking-guest-info">
                    <h3>${booking.guest_name}</h3>
                    <p class="booking-contact">${booking.guest_email} • ${booking.guest_phone}</p>
                </div>
                <span class="booking-status ${statusClass}">${statusLabel}</span>
            </div>

            <div class="booking-details">
                <div class="booking-detail">
                    <span class="booking-detail-label">Booking Ref</span>
                    <span class="booking-detail-value">${booking.booking_ref || booking.id.slice(0, 8)}</span>
                </div>
                <div class="booking-detail">
                    <span class="booking-detail-label">Apartment</span>
                    <span class="booking-detail-value">${apartmentName}</span>
                </div>
                <div class="booking-detail">
                    <span class="booking-detail-label">Check-in</span>
                    <span class="booking-detail-value">${formatDateShort(booking.check_in)}</span>
                </div>
                <div class="booking-detail">
                    <span class="booking-detail-label">Check-out</span>
                    <span class="booking-detail-value">${formatDateShort(booking.check_out)}</span>
                </div>
                <div class="booking-detail">
                    <span class="booking-detail-label">Nights</span>
                    <span class="booking-detail-value">${nights}</span>
                </div>
                <div class="booking-detail">
                    <span class="booking-detail-label">Guests</span>
                    <span class="booking-detail-value">${booking.guests}</span>
                </div>
                <div class="booking-detail">
                    <span class="booking-detail-label">Total</span>
                    <span class="booking-detail-value">${formatCurrency(booking.total_price)}</span>
                </div>
            </div>

            <div class="booking-actions">
                <button class="btn-action btn-view" data-action="view" data-booking-id="${booking.id}">
                    <i data-lucide="eye"></i>
                    <span>View Details</span>
                </button>
                ${getBookingActionButtons(booking)}
            </div>
        </div>
    `;
}

// Get action buttons based on booking status
function getBookingActionButtons(booking) {
    const buttons = [];

    if (booking.status === 'pending') {
        buttons.push(`
            <button class="btn-action btn-confirm" data-action="confirm" data-booking-id="${booking.id}">
                <i data-lucide="check-circle"></i>
                <span>Confirm</span>
            </button>
            <button class="btn-action btn-decline" data-action="decline" data-booking-id="${booking.id}">
                <i data-lucide="x-circle"></i>
                <span>Decline</span>
            </button>
        `);
    }

    if (booking.status === 'confirmed' || booking.status === 'payment_pending') {
        buttons.push(`
            <button class="btn-action btn-whatsapp" data-action="payment" data-booking-id="${booking.id}">
                <i data-lucide="message-circle"></i>
                <span>Send Payment</span>
            </button>
            <button class="btn-action btn-paid" data-action="paid" data-booking-id="${booking.id}">
                <i data-lucide="dollar-sign"></i>
                <span>Mark as Paid</span>
            </button>
        `);
    }

    if (booking.status === 'paid' || booking.status === 'confirmed') {
        buttons.push(`
            <button class="btn-action btn-decline" data-action="cancel" data-booking-id="${booking.id}">
                <i data-lucide="ban"></i>
                <span>Cancel</span>
            </button>
        `);
    }

    return buttons.join('');
}

// Attach event listeners to booking cards
function attachBookingCardListeners() {
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const action = button.dataset.action;
            const bookingId = button.dataset.bookingId;
            await handleBookingAction(action, bookingId);
        });
    });
}

// Handle booking actions
async function handleBookingAction(action, bookingId) {
    try {
        const booking = currentBookings.find(b => b.id === bookingId);
        if (!booking) return;

        switch (action) {
            case 'view':
                await showBookingDetails(bookingId);
                break;

            case 'confirm':
                const confirmResult = await showConfirm(
                    `Confirm booking for ${booking.guest_name}?`,
                    'Confirm Booking'
                );
                if (confirmResult) {
                    await confirmBooking(bookingId);
                    await showAlert('Booking confirmed! You can now send payment details.');
                    await loadDashboardData();
                }
                break;

            case 'decline':
                await showReasonModal(
                    'Decline Booking',
                    `Provide a reason for declining ${booking.guest_name}'s booking (optional):`,
                    async (reason) => {
                        await declineBooking(bookingId, reason);
                        await showAlert('Booking declined.');
                        await loadDashboardData();
                    }
                );
                break;

            case 'payment':
                sendPaymentDetails(booking);
                await showAlert('Payment details sent via WhatsApp!');
                break;

            case 'paid':
                // Open receipt upload modal instead of directly marking as paid
                await showReceiptModal(booking);
                break;

            case 'cancel':
                await showReasonModal(
                    'Cancel Booking',
                    `Provide a reason for cancelling ${booking.guest_name}'s booking (optional):`,
                    async (reason) => {
                        await cancelBooking(bookingId, reason);
                        await showAlert('Booking cancelled.');
                        await loadDashboardData();
                    }
                );
                break;
        }
    } catch (error) {
        console.error('Action error:', error);
        await showAlert('Failed to perform action. Please try again.', 'error');
    }
}

// Show booking details modal
async function showBookingDetails(bookingId) {
    try {
        const booking = await getBookingById(bookingId);
        const modal = document.getElementById('bookingModal');
        const modalBody = document.getElementById('modalBody');

        const apartmentName = booking.apartments?.name || 'Unknown Apartment';
        const nights = calculateNights(booking.check_in, booking.check_out);

        modalBody.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <div>
                    <h3 style="margin-bottom: 1rem; color: var(--primary);">Guest Information</h3>
                    <div style="display: grid; gap: 0.75rem;">
                        <div><strong>Name:</strong> ${booking.guest_name}</div>
                        <div><strong>Email:</strong> ${booking.guest_email}</div>
                        <div><strong>Phone:</strong> ${booking.guest_phone}</div>
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem; color: var(--primary);">Booking Details</h3>
                    <div style="display: grid; gap: 0.75rem;">
                        <div><strong>Booking Ref:</strong> ${booking.booking_ref || booking.id.slice(0, 8)}</div>
                        <div><strong>Apartment:</strong> ${apartmentName}</div>
                        <div><strong>Check-in:</strong> ${formatDate(booking.check_in)}</div>
                        <div><strong>Check-out:</strong> ${formatDate(booking.check_out)}</div>
                        <div><strong>Nights:</strong> ${nights}</div>
                        <div><strong>Guests:</strong> ${booking.guests}</div>
                        <div><strong>Status:</strong> <span class="booking-status status-${booking.status}">${getStatusLabel(booking.status)}</span></div>
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem; color: var(--primary);">Pricing</h3>
                    <div style="display: grid; gap: 0.75rem;">
                        <div><strong>Total Price:</strong> ${formatCurrency(booking.total_price)}</div>
                        <div><strong>Payment Method:</strong> ${booking.payment_method || 'Bank Transfer'}</div>
                    </div>
                </div>

                ${booking.special_requests ? `
                    <div>
                        <h3 style="margin-bottom: 1rem; color: var(--primary);">Special Requests</h3>
                        <p style="color: var(--text-secondary);">${booking.special_requests}</p>
                    </div>
                ` : ''}

                <div>
                    <h3 style="margin-bottom: 1rem; color: var(--primary);">Timestamps</h3>
                    <div style="display: grid; gap: 0.75rem; font-size: 0.875rem; color: var(--text-secondary);">
                        <div><strong>Created:</strong> ${formatDate(booking.created_at)}</div>
                        ${booking.confirmed_at ? `<div><strong>Confirmed:</strong> ${formatDate(booking.confirmed_at)}</div>` : ''}
                        ${booking.paid_at ? `<div><strong>Paid:</strong> ${formatDate(booking.paid_at)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        initializeLucideIcons();
    } catch (error) {
        console.error('Error loading booking details:', error);
        alert('Failed to load booking details.');
    }
}

// Close modal
function closeModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

// Show reason modal
function showReasonModal(title, description, onSubmit) {
    return new Promise((resolve) => {
        const modal = document.getElementById('reasonModal');
        const titleEl = document.getElementById('reasonModalTitle');
        const descEl = document.getElementById('reasonModalDescription');
        const textarea = document.getElementById('reasonInput');
        const submitBtn = document.getElementById('submitReasonBtn');

        // Set content
        titleEl.textContent = title;
        descEl.textContent = description;
        textarea.value = '';

        // Show modal
        modal.classList.add('active');
        textarea.focus();

        // Handle submit
        const handleSubmit = async () => {
            const reason = textarea.value.trim();
            modal.classList.remove('active');
            cleanup();
            
            try {
                await onSubmit(reason);
                resolve(reason);
            } catch (error) {
                console.error('Submit error:', error);
                throw error;
            }
        };

        // Handle cancel
        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(null);
        };

        // Cleanup listeners
        const cleanup = () => {
            submitBtn.removeEventListener('click', handleSubmit);
            textarea.removeEventListener('keydown', handleKeydown);
        };

        // Handle keyboard shortcuts
        const handleKeydown = (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };

        // Attach listeners
        submitBtn.addEventListener('click', handleSubmit);
        textarea.addEventListener('keydown', handleKeydown);
    });
}

// Close reason modal
function closeReasonModal() {
    document.getElementById('reasonModal').classList.remove('active');
    document.getElementById('reasonInput').value = '';
}

// Display apartments
function displayApartments(apartments) {
    const container = document.getElementById('apartmentsList');

    if (apartments.length === 0) {
        container.innerHTML = '<p class="loading-state">No apartments found</p>';
        return;
    }

    container.innerHTML = apartments.map(apartment => `
        <div class="apartment-card">
            <img 
                src="${apartment.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'}" 
                alt="${apartment.name}"
                class="apartment-image"
            >
            <div class="apartment-content">
                <h3 class="apartment-name">${apartment.name}</h3>
                <div class="apartment-location">
                    <i data-lucide="map-pin"></i>
                    <span>${apartment.location}</span>
                </div>
                <div class="apartment-specs">
                    <span><i data-lucide="bed"></i> ${apartment.bedrooms} bed</span>
                    <span><i data-lucide="bath"></i> ${apartment.bathrooms} bath</span>
                    <span><i data-lucide="users"></i> ${apartment.max_guests} guests</span>
                </div>
                <div class="apartment-price">${formatCurrency(apartment.price_per_night)}/night</div>
            </div>
        </div>
    `).join('');

    initializeLucideIcons();
}

// Filter bookings by status
async function filterBookings(status) {
    try {
        showLoadingState('allBookingsList');
        
        const bookings = status === 'all' 
            ? await getAllBookings()
            : await getBookingsByStatus(status);
        
        currentBookings = bookings;
        displayAllBookings(bookings);
        initializeLucideIcons();
    } catch (error) {
        console.error('Filter error:', error);
        showError('Failed to filter bookings.');
    }
}

// Search bookings
function searchBookings(searchTerm) {
    if (!searchTerm) {
        displayAllBookings(currentBookings);
        return;
    }

    const filtered = currentBookings.filter(booking => {
        const searchableText = `
            ${booking.guest_name}
            ${booking.guest_email}
            ${booking.guest_phone}
            ${booking.booking_ref}
            ${booking.apartments?.name}
        `.toLowerCase();

        return searchableText.includes(searchTerm);
    });

    displayAllBookings(filtered);
    initializeLucideIcons();
}

// Show loading state
function showLoadingState(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
}

// Show error
function showError(message) {
    showAlert(message, 'error');
}

// Custom Confirm Modal
function showConfirm(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const submitBtn = document.getElementById('submitConfirmBtn');
        const cancelBtn = document.getElementById('cancelConfirmBtn');
        const closeBtn = document.getElementById('closeConfirmModal');

        // Set content
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Show modal
        modal.classList.add('active');

        // Handle confirm
        const handleConfirm = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(true);
        };

        // Handle cancel
        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(false);
        };

        // Cleanup listeners
        const cleanup = () => {
            submitBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            closeBtn.removeEventListener('click', handleCancel);
        };

        // Attach listeners
        submitBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);

        // Initialize icons
        initializeLucideIcons();
    });
}

// Custom Alert Modal
function showAlert(message, type = 'success', title = null) {
    return new Promise((resolve) => {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertModalTitle');
        const messageEl = document.getElementById('alertModalMessage');
        const iconEl = document.getElementById('alertIcon');
        const iconContainer = document.querySelector('.alert-icon');
        const closeBtn = document.getElementById('closeAlertBtn');
        const closeModalBtn = document.getElementById('closeAlertModal');

        // Set title based on type
        if (!title) {
            title = type === 'success' ? 'Success' : 
                    type === 'error' ? 'Error' : 
                    type === 'warning' ? 'Warning' : 'Notification';
        }
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Set icon based on type
        iconContainer.className = 'alert-icon';
        if (type === 'error') {
            iconContainer.classList.add('error');
            iconEl.setAttribute('data-lucide', 'x-circle');
        } else if (type === 'warning') {
            iconContainer.classList.add('warning');
            iconEl.setAttribute('data-lucide', 'alert-triangle');
        } else {
            iconEl.setAttribute('data-lucide', 'check-circle');
        }

        // Show modal
        modal.classList.add('active');

        // Handle close
        const handleClose = () => {
            modal.classList.remove('active');
            cleanup();
            resolve();
        };

        // Cleanup listeners
        const cleanup = () => {
            closeBtn.removeEventListener('click', handleClose);
            closeModalBtn.removeEventListener('click', handleClose);
        };

        // Attach listeners
        closeBtn.addEventListener('click', handleClose);
        closeModalBtn.addEventListener('click', handleClose);

        // Initialize icons
        initializeLucideIcons();
    });
}

// Initialize Lucide icons
function initializeLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


// ===== PAYMENT RECEIPT MODAL =====
let currentReceiptBooking = null;
let uploadedReceiptFile = null;

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    modal.classList.remove('active');
    resetReceiptForm();
}

function initializeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    const closeBtn = document.getElementById('closeReceiptModal');
    const cancelBtn = document.getElementById('cancelReceiptBtn');
    const submitBtn = document.getElementById('submitReceiptBtn');
    const fileInput = document.getElementById('receiptUpload');
    const amountInput = document.getElementById('receiptAmount');
    const checkboxes = document.querySelectorAll('.checkbox-label input[type="checkbox"]');

    // Close modal handlers
    closeBtn?.addEventListener('click', closeReceiptModal);
    cancelBtn?.addEventListener('click', closeReceiptModal);
    modal?.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeReceiptModal();
        }
    });

    // File upload preview
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadedReceiptFile = file;
            
            // Show preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById('receiptPreview');
                    const img = document.getElementById('receiptImage');
                    img.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
            
            validateReceiptForm();
        }
    });

    // Input validation
    amountInput?.addEventListener('input', validateReceiptForm);
    checkboxes.forEach(cb => cb.addEventListener('change', validateReceiptForm));

    // Submit receipt
    submitBtn?.addEventListener('click', async () => {
        if (!currentReceiptBooking || !uploadedReceiptFile) return;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i data-lucide="loader"></i> Uploading...';
            initializeLucideIcons();

            const amount = parseInt(amountInput.value);

            // Verify amount matches
            if (amount !== currentReceiptBooking.total_price) {
                await showAlert(
                    `Amount mismatch! Expected ₦${currentReceiptBooking.total_price.toLocaleString()}, but receipt shows ₦${amount.toLocaleString()}.`,
                    'error'
                );
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="check"></i> Verify & Mark as Paid';
                initializeLucideIcons();
                return;
            }

            // Upload receipt to Supabase Storage
            const fileName = `receipt-${currentReceiptBooking.booking_ref}-${Date.now()}.${uploadedReceiptFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment-receipts')
                .upload(fileName, uploadedReceiptFile);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                await showAlert('Failed to upload receipt. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="check"></i> Verify & Mark as Paid';
                initializeLucideIcons();
                return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('payment-receipts')
                .getPublicUrl(fileName);

            const receiptUrl = urlData.publicUrl;

            // Update booking with receipt info and mark as paid
            const user = await getCurrentUser();
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    payment_receipt_url: receiptUrl,
                    payment_receipt_uploaded_at: new Date().toISOString(),
                    payment_amount: amount,
                    payment_verified_by: user.email,
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('id', currentReceiptBooking.id);

            if (updateError) {
                console.error('Update error:', updateError);
                await showAlert('Failed to update booking. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="check"></i> Verify & Mark as Paid';
                initializeLucideIcons();
                return;
            }

            await showAlert('Payment verified and booking marked as paid!', 'success');
            closeReceiptModal();
            await loadDashboardData();

        } catch (error) {
            console.error('Receipt upload error:', error);
            await showAlert('An error occurred. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="check"></i> Verify & Mark as Paid';
            initializeLucideIcons();
        }
    });
}

function validateReceiptForm() {
    const fileInput = document.getElementById('receiptUpload');
    const amountInput = document.getElementById('receiptAmount');
    const checkboxes = document.querySelectorAll('.checkbox-label input[type="checkbox"]');
    const submitBtn = document.getElementById('submitReceiptBtn');

    const hasFile = fileInput?.files.length > 0;
    const hasAmount = amountInput?.value && parseInt(amountInput.value) > 0;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    const isValid = hasFile && hasAmount && allChecked;
    
    if (submitBtn) {
        submitBtn.disabled = !isValid;
    }
}

function resetReceiptForm() {
    document.getElementById('receiptUpload').value = '';
    document.getElementById('receiptAmount').value = '';
    document.getElementById('receiptPreview').style.display = 'none';
    document.querySelectorAll('.checkbox-label input[type="checkbox"]').forEach(cb => cb.checked = false);
    currentReceiptBooking = null;
    uploadedReceiptFile = null;
}

async function showReceiptModal(booking) {
    currentReceiptBooking = booking;
    
    document.getElementById('receiptBookingRef').textContent = booking.booking_ref;
    document.getElementById('receiptGuestName').textContent = booking.guest_name;
    document.getElementById('receiptExpectedAmount').textContent = formatCurrency(booking.total_price);
    
    const modal = document.getElementById('receiptModal');
    modal.classList.add('active');
    
    initializeLucideIcons();
}
