// Supabase API Client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY, WHATSAPP_NUMBER, BANK_DETAILS } from './config.js';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== AUTHENTICATION =====

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// ===== BOOKINGS =====

export async function getAllBookings() {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            apartments (
                name,
                location,
                images
            )
        `)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

export async function getBookingsByStatus(status) {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            apartments (
                name,
                location,
                images
            )
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

export async function getBookingById(id) {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            apartments (
                name,
                location,
                price_per_night,
                images,
                bedrooms,
                bathrooms,
                max_guests
            )
        `)
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data;
}

export async function updateBookingStatus(id, status, additionalData = {}) {
    const updateData = {
        status,
        ...additionalData
    };

    // Add timestamp fields based on status
    if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
    } else if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
    } else if (status === 'declined') {
        updateData.declined_at = new Date().toISOString();
    } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function confirmBooking(id) {
    return updateBookingStatus(id, 'confirmed');
}

export async function declineBooking(id, reason = '') {
    return updateBookingStatus(id, 'declined', { decline_reason: reason });
}

export async function markAsPaid(id) {
    return updateBookingStatus(id, 'paid');
}

export async function cancelBooking(id, reason = '') {
    return updateBookingStatus(id, 'cancelled', { cancellation_reason: reason });
}

// ===== APARTMENTS =====

export async function getAllApartments() {
    const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('active', true)
        .order('name');
    
    if (error) throw error;
    return data;
}

// ===== STATISTICS =====

export async function getBookingStats() {
    const { data: allBookings, error } = await supabase
        .from('bookings')
        .select('status');
    
    if (error) throw error;

    const stats = {
        total: allBookings.length,
        pending: allBookings.filter(b => b.status === 'pending').length,
        confirmed: allBookings.filter(b => b.status === 'confirmed').length,
        payment_pending: allBookings.filter(b => b.status === 'payment_pending').length,
        paid: allBookings.filter(b => b.status === 'paid').length,
        completed: allBookings.filter(b => b.status === 'completed').length,
        declined: allBookings.filter(b => b.status === 'declined').length,
        cancelled: allBookings.filter(b => b.status === 'cancelled').length
    };

    return stats;
}

export async function getRevenueStats(period = 'this_month') {
    // Calculate date range
    const now = new Date();
    let startDate, endDate = now.toISOString();

    if (period === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (period === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    } else if (period === 'last_3_months') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
    } else {
        // All time
        startDate = '2020-01-01T00:00:00.000Z';
    }

    // Get bookings in period
    const { data: periodBookings, error: periodError } = await supabase
        .from('bookings')
        .select('status, total_price, check_in, check_out, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (periodError) throw periodError;

    // Get all-time paid bookings for total revenue
    const { data: allPaid, error: allPaidError } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('status', 'paid');

    if (allPaidError) throw allPaidError;

    // Get all apartments for occupancy calculation
    const { data: apartments, error: aptError } = await supabase
        .from('apartments')
        .select('id')
        .eq('active', true);

    if (aptError) throw aptError;

    const totalApartments = apartments?.length || 1;

    // Calculate period stats
    const periodPaid = periodBookings.filter(b => b.status === 'paid');
    const periodRevenue = periodPaid.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const periodBookingsCount = periodBookings.length;
    const periodPending = periodBookings.filter(b => b.status === 'pending').length;

    // Calculate occupancy rate for current month
    const daysInPeriod = period === 'this_month'
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        : period === 'last_month'
        ? new Date(now.getFullYear(), now.getMonth(), 0).getDate()
        : 90;

    const totalAvailableNights = totalApartments * daysInPeriod;
    const bookedNights = periodBookings
        .filter(b => ['confirmed', 'paid', 'payment_pending'].includes(b.status))
        .reduce((sum, b) => {
            const nights = Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / 86400000);
            return sum + (nights > 0 ? nights : 0);
        }, 0);

    const occupancyRate = totalAvailableNights > 0
        ? Math.min(100, Math.round((bookedNights / totalAvailableNights) * 100))
        : 0;

    const allTimeRevenue = (allPaid || []).reduce((sum, b) => sum + (b.total_price || 0), 0);

    return {
        periodRevenue,
        periodBookingsCount,
        periodPending,
        occupancyRate,
        bookedNights,
        totalAvailableNights,
        allTimeRevenue,
        period
    };
}

// ===== WHATSAPP =====

export function generatePaymentMessage(booking) {
    const apartmentName = booking.apartments?.name || 'Your apartment';
    const checkIn = formatDate(booking.check_in);
    const checkOut = formatDate(booking.check_out);
    const total = formatCurrency(booking.total_price);
    const ref = booking.booking_ref || booking.id;

    return `🎉 Booking Confirmed — LuxStay

Hi ${booking.guest_name}! Your booking has been confirmed.

📋 Booking Details:
Booking Ref: ${ref}
Apartment: ${apartmentName}
Check-in: ${checkIn}
Check-out: ${checkOut}
Guests: ${booking.guests}

💰 Payment Required: ${total}

Bank: ${BANK_DETAILS.bankName}
Account: ${BANK_DETAILS.accountNumber}
Name: ${BANK_DETAILS.accountName}
Reference: LUXSTAY-${ref}

📸 Send payment receipt to this number.
⏰ Payment due within 24 hours.

We look forward to hosting you! 🏠
LuxStay Team`;
}

export function sendWhatsAppMessage(phoneNumber, message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

export function sendPaymentDetails(booking) {
    const message = generatePaymentMessage(booking);
    sendWhatsAppMessage(booking.guest_phone, message);
}

// ===== UTILITY FUNCTIONS =====

export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function formatCurrency(amount) {
    if (!amount) return '₦0';
    return '₦' + Number(amount).toLocaleString('en-NG');
}

export function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return nights;
}

export function getStatusColor(status) {
    const colors = {
        pending: 'warning',
        confirmed: 'success',
        payment_pending: 'info',
        paid: 'success',
        completed: 'secondary',
        declined: 'danger',
        cancelled: 'muted'
    };
    return colors[status] || 'secondary';
}

export function getStatusLabel(status) {
    const labels = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        payment_pending: 'Payment Pending',
        paid: 'Paid',
        completed: 'Completed',
        declined: 'Declined',
        cancelled: 'Cancelled'
    };
    return labels[status] || status;
}
