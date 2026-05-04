/**
 * Bookings Routes (Supabase)
 * 
 * Handles all booking-related API endpoints
 */

const express = require('express');
const router = express.Router();
const Booking = require('../models-supabase/Booking');
const Apartment = require('../models-supabase/Apartment');
const rateLimit = require('express-rate-limit');

// Rate limiting for booking creation
const bookingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 booking attempts per window
  message: {
    success: false,
    error: 'Too many booking attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================================
// POST /api/bookings
// Create a new booking
// Body: { apartmentId, guestName, guestPhone, guestEmail, checkIn, checkOut, guests, totalPrice }
// ============================================================================
router.post('/', bookingRateLimit, async (req, res) => {
  try {
    const bookingData = req.body;
    
    console.log('📝 Booking request received:', {
      apartmentId: bookingData.apartmentId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests
    });
    
    // Validate apartment exists
    const apartment = await Apartment.getById(bookingData.apartmentId);
    if (!apartment) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    // Check guest capacity
    if (bookingData.guests > apartment.maxGuests) {
      return res.status(400).json({
        success: false,
        error: 'Guest capacity exceeded',
        message: `Maximum ${apartment.maxGuests} guests allowed for this property`
      });
    }
    
    // Check availability
    const available = await apartment.checkAvailability(bookingData.checkIn, bookingData.checkOut);
    if (!available) {
      return res.status(409).json({
        success: false,
        error: 'Apartment not available',
        message: 'This apartment is already booked for the selected dates'
      });
    }
    
    // Verify pricing
    const pricing = apartment.calculatePricing(bookingData.checkIn, bookingData.checkOut);
    const priceTolerance = 1; // Allow 1 Naira difference for floating point
    
    if (Math.abs(bookingData.totalPrice - pricing.total) > priceTolerance) {
      return res.status(400).json({
        success: false,
        error: 'Price mismatch',
        message: `Expected total: ₦${pricing.total}, Provided: ₦${bookingData.totalPrice}`
      });
    }
    
    // Create booking
    const booking = await Booking.create(bookingData);
    
    console.log(`✅ Booking created: ${booking.bookingRef}`);
    
    // Generate WhatsApp notification for admin/host
    const adminWhatsAppMessage = `🏨 *NEW BOOKING REQUEST*

📋 *Booking Details:*
Ref: ${booking.bookingRef}
Apartment: ${apartment.name}

👤 *Guest Information:*
Name: ${booking.guestName}
Phone: ${booking.guestPhone}
Email: ${booking.guestEmail}

📅 *Stay Details:*
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.guests}

💰 *Payment:*
Total: ₦${booking.totalPrice.toLocaleString()}

⏰ *Status:* Pending Confirmation

Please review and respond to this booking request.`;

    const adminWhatsAppLink = `https://wa.me/${process.env.HOST_WHATSAPP_NUMBER}?text=${encodeURIComponent(adminWhatsAppMessage)}`;
    
    // Generate WhatsApp link for guest (for "Pay via WhatsApp" option)
    const guestWhatsAppMessage = `Hello! I'd like to confirm my booking.

Booking Reference: ${booking.bookingRef}
Apartment: ${apartment.name}
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.guests}
Total: ₦${booking.totalPrice.toLocaleString()}

Please confirm my reservation. Thank you!`;

    const guestWhatsAppLink = `https://wa.me/${process.env.HOST_WHATSAPP_NUMBER}?text=${encodeURIComponent(guestWhatsAppMessage)}`;
    
    // Log admin notification prominently
    console.log('\n' + '='.repeat(70));
    console.log('📱 NEW BOOKING - ADMIN ACTION REQUIRED');
    console.log('='.repeat(70));
    console.log(`📋 Booking Ref: ${booking.bookingRef}`);
    console.log(`👤 Guest: ${booking.guestName}`);
    console.log(`📞 Phone: ${booking.guestPhone}`);
    console.log(`🏨 Apartment: ${apartment.name}`);
    console.log(`📅 Check-in: ${booking.checkIn}`);
    console.log(`💰 Total: ₦${booking.totalPrice.toLocaleString()}`);
    console.log('='.repeat(70));
    console.log('🔗 Click this link to notify yourself via WhatsApp:');
    console.log(adminWhatsAppLink);
    console.log('='.repeat(70) + '\n');
    
    res.status(201).json({
      success: true,
      booking: booking.toPublicJSON(),
      bookingRef: booking.bookingRef,
      whatsappLink: guestWhatsAppLink,
      adminNotificationLink: adminWhatsAppLink,
      message: 'Booking created successfully. Host will be notified via WhatsApp.'
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    
    // Handle validation errors
    if (error.message.includes('Validation failed')) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
});

// ============================================================================
// GET /api/bookings/:id
// Get booking details by ID
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.getById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Get apartment details
    const apartment = await Apartment.getById(booking.apartmentId);
    
    res.json({
      success: true,
      booking: booking.toJSON(),
      apartment: apartment ? apartment.toJSON() : null
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/bookings/ref/:bookingRef
// Get booking details by booking reference
// ============================================================================
router.get('/ref/:bookingRef', async (req, res) => {
  try {
    const { bookingRef } = req.params;
    
    const booking = await Booking.getByRef(bookingRef);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Get apartment details
    const apartment = await Apartment.getById(booking.apartmentId);
    
    res.json({
      success: true,
      booking: booking.toJSON(),
      apartment: apartment ? apartment.toJSON() : null
    });
  } catch (error) {
    console.error('Error fetching booking by ref:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/bookings/:id/confirm
// Host confirms a booking
// Body: { guestToken }
// ============================================================================
router.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { guestToken } = req.body;
    
    if (!guestToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing guest token'
      });
    }
    
    const booking = await Booking.getById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Verify token
    if (booking.guestToken !== guestToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    // Check current status
    if (booking.status === 'confirmed' || booking.status === 'payment_pending') {
      return res.json({
        success: true,
        booking: booking.toJSON(),
        message: 'Booking already confirmed'
      });
    }
    
    if (booking.status === 'declined' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot confirm declined or cancelled booking'
      });
    }
    
    // Confirm booking (will auto-transition to payment_pending)
    await booking.updateStatus('confirmed');
    
    console.log(`✅ Booking ${booking.bookingRef} confirmed`);
    
    res.json({
      success: true,
      booking: booking.toJSON(),
      message: 'Booking confirmed. Payment is due within 24 hours.'
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm booking',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/bookings/:id/decline
// Host declines a booking
// Body: { guestToken }
// ============================================================================
router.post('/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const { guestToken } = req.body;
    
    if (!guestToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing guest token'
      });
    }
    
    const booking = await Booking.getById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Verify token
    if (booking.guestToken !== guestToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    // Check current status
    if (booking.status === 'declined') {
      return res.json({
        success: true,
        booking: booking.toJSON(),
        message: 'Booking already declined'
      });
    }
    
    if (booking.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Cannot decline paid booking'
      });
    }
    
    // Decline booking
    await booking.updateStatus('declined');
    
    console.log(`❌ Booking ${booking.bookingRef} declined`);
    
    res.json({
      success: true,
      booking: booking.toJSON(),
      message: 'Booking declined'
    });
  } catch (error) {
    console.error('Error declining booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline booking',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/bookings/:id/cancel
// Cancel a booking (guest or host)
// Body: { guestToken }
// ============================================================================
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { guestToken } = req.body;
    
    if (!guestToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing guest token'
      });
    }
    
    const booking = await Booking.getById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Verify token
    if (booking.guestToken !== guestToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    // Check current status
    if (booking.status === 'cancelled') {
      return res.json({
        success: true,
        booking: booking.toJSON(),
        message: 'Booking already cancelled'
      });
    }
    
    if (booking.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel paid booking',
        message: 'Please contact support for refund requests'
      });
    }
    
    // Calculate refund
    const refundEligible = booking.isRefundable();
    const refundAmount = booking.getRefundAmount();
    
    // Cancel booking
    await booking.updateStatus('cancelled');
    
    console.log(`🚫 Booking ${booking.bookingRef} cancelled`);
    
    res.json({
      success: true,
      booking: booking.toJSON(),
      refundEligible,
      refundAmount,
      message: refundEligible 
        ? `Booking cancelled. Refund of ₦${refundAmount.toLocaleString()} will be processed.`
        : 'Booking cancelled. No refund available (less than 48 hours to check-in).'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/bookings/:id/payment
// Mark booking as paid
// Body: { guestToken, paymentReference }
// ============================================================================
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { guestToken, paymentReference } = req.body;
    
    if (!guestToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing guest token'
      });
    }
    
    const booking = await Booking.getById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Verify token
    if (booking.guestToken !== guestToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    // Check current status
    if (booking.status === 'paid') {
      return res.json({
        success: true,
        booking: booking.toJSON(),
        message: 'Payment already confirmed'
      });
    }
    
    if (booking.status !== 'payment_pending') {
      return res.status(400).json({
        success: false,
        error: 'Booking must be confirmed before payment',
        currentStatus: booking.status
      });
    }
    
    // Mark as paid
    await booking.updateStatus('paid');
    
    console.log(`💰 Booking ${booking.bookingRef} marked as paid (Ref: ${paymentReference || 'N/A'})`);
    
    res.json({
      success: true,
      booking: booking.toJSON(),
      message: 'Payment confirmed. Booking is now complete!'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/bookings/apartment/:apartmentId
// Get all bookings for an apartment (admin only - requires service key)
// ============================================================================
router.get('/apartment/:apartmentId', async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { status } = req.query;
    
    // Verify apartment exists
    const apartment = await Apartment.getById(apartmentId);
    if (!apartment) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    // Get bookings
    const bookings = await Booking.getByApartment(apartmentId, status || null);
    
    res.json({
      success: true,
      apartmentId,
      bookings: bookings.map(b => b.toJSON()),
      count: bookings.length
    });
  } catch (error) {
    console.error('Error fetching apartment bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
