/**
 * Lekki Stays API Client
 * Handles all communication with the backend API
 */
class LekkirStaysAPI {
    constructor() {
        // Always use localhost:3000 for API in development
        // In production, this would be the same origin
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'file:';
        
        if (isDevelopment) {
            this.baseURL = 'http://127.0.0.1:3000';
        } else {
            this.baseURL = window.location.origin;
        }
        
        this.apiURL = `${this.baseURL}/api`;
        console.log('🔌 API Client initialized - Base URL:', this.baseURL);
        console.log('🔌 API URL:', this.apiURL);
    }

    /**
     * Generic API request handler
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log('API Request:', url, config);
            const response = await fetch(url, config);
            
            // Check if response is ok before parsing
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            // Check if response has content
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response');
            }
            
            const data = await response.json();
            console.log('API Response:', data);

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // ===== APARTMENTS API =====

    /**
     * Get all apartments
     */
    async getApartments() {
        return this.request('/apartments');
    }

    /**
     * Get specific apartment by ID
     */
    async getApartment(id) {
        return this.request(`/apartments/${id}`);
    }

    /**
     * Check availability for multiple apartments
     */
    async checkAvailability(checkIn, checkOut, guests = null) {
        return this.request('/apartments/availability', {
            method: 'POST',
            body: JSON.stringify({
                checkin: checkIn,
                checkout: checkOut,
                guests
            })
        });
    }

    /**
     * Check availability for specific apartment
     */
    async checkApartmentAvailability(apartmentId, checkIn, checkOut) {
        const params = new URLSearchParams({
            checkin: checkIn,
            checkout: checkOut
        });
        
        return this.request(`/apartments/${apartmentId}/availability?${params}`);
    }

    /**
     * Get booked dates for apartment calendar
     */
    async getBookedDates(apartmentId) {
        return this.request(`/apartments/${apartmentId}/booked-dates`);
    }

    // ===== BOOKINGS API =====

    /**
     * Create a new booking
     */
    async createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    /**
     * Get booking details
     */
    async getBooking(bookingId) {
        return this.request(`/bookings/${bookingId}`);
    }

    /**
     * Update booking status
     */
    async updateBookingStatus(bookingId, status, token = null) {
        return this.request(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, token })
        });
    }

    // ===== PAYMENTS API =====

    /**
     * Get payment instructions for a booking
     */
    async getPaymentInstructions(bookingId) {
        return this.request(`/payments/${bookingId}/instructions`);
    }

    /**
     * Confirm payment for a booking
     */
    async confirmPayment(bookingId, paymentData) {
        return this.request(`/payments/${bookingId}/confirm`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    /**
     * Get payment status for a booking
     */
    async getPaymentStatus(bookingId) {
        return this.request(`/payments/${bookingId}/status`);
    }

    // ===== NOTIFICATIONS API =====

    /**
     * Send booking created notification
     */
    async sendBookingNotification(bookingId) {
        return this.request('/notifications/booking-created', {
            method: 'POST',
            body: JSON.stringify({ bookingId })
        });
    }

    /**
     * Send booking confirmed notification
     */
    async sendConfirmationNotification(bookingId) {
        return this.request('/notifications/booking-confirmed', {
            method: 'POST',
            body: JSON.stringify({ bookingId })
        });
    }

    /**
     * Send booking declined notification
     */
    async sendDeclineNotification(bookingId) {
        return this.request('/notifications/booking-declined', {
            method: 'POST',
            body: JSON.stringify({ bookingId })
        });
    }

    /**
     * Send booking cancelled notification
     */
    async sendCancellationNotification(bookingId) {
        return this.request('/notifications/booking-cancelled', {
            method: 'POST',
            body: JSON.stringify({ bookingId })
        });
    }

    /**
     * Send payment confirmed notification
     */
    async sendPaymentNotification(bookingId) {
        return this.request('/notifications/payment-confirmed', {
            method: 'POST',
            body: JSON.stringify({ bookingId })
        });
    }

    // ===== UTILITY METHODS =====

    /**
     * Format date for API (YYYY-MM-DD)
     */
    formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toISOString().split('T')[0];
    }

    /**
     * Format Nigerian Naira currency
     */
    formatNaira(amount) {
        return '₦' + Number(amount).toLocaleString('en-NG');
    }

    /**
     * Validate Nigerian phone number
     */
    isValidNigerianPhone(phone) {
        const phoneRegex = /^(\+?234|0)[789][01]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    }

    /**
     * Format Nigerian phone number for API
     */
    formatNigerianPhone(phone) {
        const clean = phone.replace(/\D/g, '');
        if (clean.startsWith('0')) {
            return '+234' + clean.slice(1);
        }
        if (clean.startsWith('234')) {
            return '+' + clean;
        }
        return '+234' + clean;
    }

    /**
     * Calculate nights between dates
     */
    calculateNights(checkIn, checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    /**
     * Health check
     */
    async healthCheck() {
        return this.request('/health');
    }
}

// Create global API instance
window.lekkirStaysAPI = new LekkirStaysAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LekkirStaysAPI;
}