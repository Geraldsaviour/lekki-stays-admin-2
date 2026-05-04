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
