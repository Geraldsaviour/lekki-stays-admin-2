/**
 * Cron Jobs for Automated Tasks
 * Handles scheduled operations like auto-canceling expired bookings
 */

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/cron/cancel-expired-bookings
 * Auto-cancel bookings that are:
 * 1. Pending/payment_pending for more than 24 hours
 * 2. Check-in date has passed and still not confirmed/paid
 */
router.post('/cancel-expired-bookings', async (req, res) => {
  try {
    console.log('Running auto-cancel expired bookings job...');
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let cancelledCount = 0;
    const cancelledBookings = [];

    // Get all bookings that need to be checked
    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .in('status', ['pending', 'payment_pending', 'confirmed']);

    if (fetchError) throw fetchError;

    if (!bookings || bookings.length === 0) {
      return res.json({
        success: true,
        message: 'No bookings to process',
        cancelledCount: 0
      });
    }

    // Process each booking
    for (const booking of bookings) {
      let shouldCancel = false;
      let cancelReason = '';

      const createdAt = new Date(booking.created_at);
      const checkInDate = new Date(booking.check_in);

      // Rule 1: Pending/payment_pending for more than 24 hours
      if (
        (booking.status === 'pending' || booking.status === 'payment_pending') &&
        createdAt < twentyFourHoursAgo
      ) {
        shouldCancel = true;
        cancelReason = 'Booking automatically cancelled: No confirmation or payment received within 24 hours';
      }

      // Rule 2: Check-in date has passed and not confirmed/paid
      if (
        booking.status === 'pending' &&
        checkInDate < now
      ) {
        shouldCancel = true;
        cancelReason = 'Booking automatically cancelled: Check-in date has passed without confirmation';
      }

      // Rule 3: Payment pending and check-in date has passed
      if (
        booking.status === 'payment_pending' &&
        checkInDate < now
      ) {
        shouldCancel = true;
        cancelReason = 'Booking automatically cancelled: Check-in date has passed without payment';
      }

      // Cancel the booking if needed
      if (shouldCancel) {
        const { error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'cancelled',
            cancellation_reason: cancelReason,
            cancelled_at: now.toISOString()
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`Error cancelling booking ${booking.id}:`, updateError);
        } else {
          cancelledCount++;
          cancelledBookings.push({
            id: booking.id,
            booking_reference: booking.booking_reference,
            guest_name: booking.guest_name,
            reason: cancelReason
          });
          console.log(`Cancelled booking ${booking.booking_reference}: ${cancelReason}`);
        }
      }
    }

    res.json({
      success: true,
      message: `Auto-cancel job completed. Cancelled ${cancelledCount} booking(s)`,
      cancelledCount,
      cancelledBookings
    });

  } catch (error) {
    console.error('Error in auto-cancel job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run auto-cancel job',
      details: error.message
    });
  }
});

/**
 * GET /api/cron/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cron jobs service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
