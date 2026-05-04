const express = require('express');
const router = express.Router();
const WhatsAppNotifier = require('../utils/whatsapp');
const Booking = require('../models-supabase/Booking');
const Apartment = require('../models-supabase/Apartment');

/**
 * POST /api/notifications/booking-created
 * Send notifications when a new booking is created
 */
router.post('/booking-created', async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking ID is required' 
      });
    }

    // Get booking and apartment details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    const apartment = await Apartment.findById(booking.apartmentId);
    if (!apartment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Apartment not found' 
      });
    }

    // Generate host notification WhatsApp URL
    const hostNotificationUrl = WhatsAppNotifier.generateHostNotification(booking, apartment);

    res.json({
      success: true,
      message: 'Booking notification generated',
      data: {
        bookingId: booking.id,
        hostNotificationUrl,
        guestName: booking.guestName,
        apartmentName: apartment.name
      }
    });

  } catch (error) {
    console.error('Error generating booking notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate booking notification' 
    });
  }
});

/**
 * POST /api/notifications/booking-confirmed
 * Send payment instructions to guest when booking is confirmed
 */
router.post('/booking-confirmed', async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking ID is required' 
      });
    }

    // Get booking and apartment details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking must be confirmed to send payment instructions' 
      });
    }

    const apartment = await Apartment.findById(booking.apartmentId);
    if (!apartment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Apartment not found' 
      });
    }

    // Generate guest payment instructions WhatsApp URL
    const guestPaymentUrl = WhatsAppNotifier.generateGuestPaymentLink(booking, apartment);

    res.json({
      success: true,
      message: 'Payment instructions generated',
      data: {
        bookingId: booking.id,
        guestPaymentUrl,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        totalAmount: booking.totalPrice
      }
    });

  } catch (error) {
    console.error('Error generating payment instructions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate payment instructions' 
    });
  }
});

/**
 * POST /api/notifications/booking-declined
 * Send decline notification to guest when booking is declined
 */
router.post('/booking-declined', async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking ID is required' 
      });
    }

    // Get booking and apartment details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    if (booking.status !== 'declined') {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking must be declined to send decline notification' 
      });
    }

    const apartment = await Apartment.findById(booking.apartmentId);
    if (!apartment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Apartment not found' 
      });
    }

    // Generate guest decline notification WhatsApp URL
    const guestDeclineUrl = WhatsAppNotifier.generateGuestDeclineLink(booking, apartment);

    res.json({
      success: true,
      message: 'Decline notification generated',
      data: {
        bookingId: booking.id,
        guestDeclineUrl,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        apartmentName: apartment.name
      }
    });

  } catch (error) {
    console.error('Error generating decline notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate decline notification' 
    });
  }
});

/**
 * POST /api/notifications/booking-cancelled
 * Send cancellation notifications when booking is cancelled
 */
router.post('/booking-cancelled', async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking ID is required' 
      });
    }

    // Get booking and apartment details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    if (booking.status !== 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking must be cancelled to send cancellation notifications' 
      });
    }

    const apartment = await Apartment.findById(booking.apartmentId);
    if (!apartment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Apartment not found' 
      });
    }

    // Check refund eligibility (48 hours before check-in)
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
    const refundEligible = hoursUntilCheckIn > 48;
    const refundAmount = refundEligible ? booking.totalPrice : 0;

    // Generate host cancellation alert WhatsApp URL
    const hostCancellationAlert = WhatsAppNotifier.generateHostCancellationAlert(
      booking, 
      apartment, 
      refundEligible
    );

    // Generate guest contact link for follow-up
    const guestContactLink = WhatsAppNotifier.generateGuestCancelConfirmLink(booking);

    res.json({
      success: true,
      message: 'Cancellation notifications generated',
      data: {
        bookingId: booking.id,
        hostCancellationAlert,
        guestContactLink,
        refundEligible,
        refundAmount,
        guestName: booking.guestName,
        apartmentName: apartment.name
      }
    });

  } catch (error) {
    console.error('Error generating cancellation notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate cancellation notifications' 
    });
  }
});

/**
 * POST /api/notifications/payment-confirmed
 * Send payment confirmation notifications
 */
router.post('/payment-confirmed', async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking ID is required' 
      });
    }

    // Get booking and apartment details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    if (booking.status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking must be paid to send payment confirmation' 
      });
    }

    const apartment = await Apartment.findById(booking.apartmentId);
    if (!apartment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Apartment not found' 
      });
    }

    // Generate payment confirmation message for guest
    const guestMessage = `🎉 Payment Confirmed — Lekki Stays

Hi ${booking.guestName}! Your payment has been received and confirmed.

📋 Booking Details:
Apartment: ${apartment.name}
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Booking ID: #${booking.id}
Amount Paid: ${WhatsAppNotifier.formatNaira(booking.totalPrice)}

✅ Your reservation is now fully secured!

We'll send check-in details 24 hours before your arrival.

Looking forward to hosting you! 🏠
Lekki Stays Team`;

    const guestPaymentConfirmUrl = WhatsAppNotifier.generateWhatsAppURL(booking.guestPhone, guestMessage);

    // Generate host payment notification
    const hostMessage = `💰 PAYMENT RECEIVED — Lekki Stays

Booking #${booking.id} payment confirmed!

Guest: ${booking.guestName}
Apartment: ${apartment.name}
Amount: ${WhatsAppNotifier.formatNaira(booking.totalPrice)}
Check-in: ${booking.checkIn}

✅ Reservation is now fully secured.`;

    const hostPaymentNotifyUrl = WhatsAppNotifier.generateWhatsAppURL(process.env.HOST_WHATSAPP_NUMBER, hostMessage);

    res.json({
      success: true,
      message: 'Payment confirmation notifications generated',
      data: {
        bookingId: booking.id,
        guestPaymentConfirmUrl,
        hostPaymentNotifyUrl,
        guestName: booking.guestName,
        totalAmount: booking.totalPrice
      }
    });

  } catch (error) {
    console.error('Error generating payment confirmation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate payment confirmation' 
    });
  }
});

/**
 * POST /api/notifications
 * Test endpoint for notifications
 */
router.post('/', (req, res) => {
  const { type, phone, message } = req.body;
  
  if (!type || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'Type, phone, and message are required'
    });
  }
  
  // Simulate notification sending
  res.json({
    success: true,
    message: 'Test notification processed',
    data: {
      type,
      phone,
      message,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET /api/notifications/test
 * Test endpoint to verify notification system is working
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Notification system is operational',
    endpoints: [
      'POST /api/notifications/booking-created',
      'POST /api/notifications/booking-confirmed', 
      'POST /api/notifications/booking-declined',
      'POST /api/notifications/booking-cancelled',
      'POST /api/notifications/payment-confirmed'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;