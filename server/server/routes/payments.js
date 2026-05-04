const express = require('express');
const router = express.Router();
const Booking = require('../models-supabase/Booking');
const Apartment = require('../models-supabase/Apartment');
const WhatsAppNotifier = require('../utils/whatsapp');

/**
 * GET /api/payments/:bookingId/instructions
 * Get payment instructions for a booking
 */
router.get('/:bookingId/instructions', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
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
        error: 'Booking must be confirmed to get payment instructions'
      });
    }

    const apartment = await Apartment.findById(booking.apartmentId);
    if (!apartment) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }

    // Generate payment reference
    const paymentReference = `LEKKI-#${booking.id}`;
    
    // Payment instructions
    const paymentInstructions = {
      bookingId: booking.id,
      amount: booking.totalPrice,
      formattedAmount: WhatsAppNotifier.formatNaira(booking.totalPrice),
      reference: paymentReference,
      bankDetails: {
        bankName: process.env.BANK_NAME || 'First Bank Nigeria',
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || '3085678901',
        accountName: process.env.BANK_ACCOUNT_NAME || 'Lekki Stays Limited'
      },
      paymentMethods: [
        {
          type: 'bank_transfer',
          name: 'Bank Transfer',
          description: 'Transfer to our bank account using the details above',
          preferred: true
        },
        {
          type: 'cash_on_arrival',
          name: 'Cash on Arrival',
          description: 'Pay cash when you check in (subject to availability)',
          preferred: false
        }
      ],
      deadline: booking.paymentDeadline,
      instructions: [
        'Make a bank transfer using the account details above',
        `Use reference: ${paymentReference}`,
        'Take a screenshot of your payment receipt',
        'Send the receipt via WhatsApp to confirm payment',
        'Payment must be received within 24 hours'
      ]
    };

    res.json({
      success: true,
      data: paymentInstructions
    });

  } catch (error) {
    console.error('Error getting payment instructions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment instructions'
    });
  }
});

/**
 * POST /api/payments/:bookingId/confirm
 * Confirm payment for a booking
 */
router.post('/:bookingId/confirm', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, transactionReference, notes } = req.body;
    
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
        error: 'Booking must be confirmed to process payment'
      });
    }

    if (booking.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Payment already confirmed for this booking'
      });
    }

    // Update booking status to paid
    const success = booking.updateStatus('paid');
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking status'
      });
    }

    // Log payment confirmation (in a real app, this would be stored in a payments table)
    console.log(`💰 Payment confirmed for booking ${bookingId}:`, {
      paymentMethod,
      transactionReference,
      amount: booking.totalPrice,
      timestamp: new Date().toISOString(),
      notes
    });

    // Trigger payment confirmation notification
    setTimeout(() => {
      console.log('📱 Notification triggered: payment-confirmed', { bookingId: booking.id });
    }, 100);

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      booking: booking.toJSON()
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment'
    });
  }
});

/**
 * GET /api/payments/:bookingId/status
 * Get payment status for a booking
 */
router.get('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const paymentStatus = {
      bookingId: booking.id,
      status: booking.status,
      isPaid: booking.status === 'paid',
      amount: booking.totalPrice,
      formattedAmount: WhatsAppNotifier.formatNaira(booking.totalPrice),
      deadline: booking.paymentDeadline,
      isOverdue: booking.paymentDeadline ? new Date() > new Date(booking.paymentDeadline) : false
    };

    res.json({
      success: true,
      data: paymentStatus
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status'
    });
  }
});

/**
 * POST /api/payments/webhook
 * Webhook endpoint for automatic payment notifications (future use)
 */
router.post('/webhook', async (req, res) => {
  try {
    // This endpoint would be used for automatic payment notifications
    // from payment processors like Paystack, Flutterwave, etc.
    
    console.log('Payment webhook received:', req.body);
    
    // For now, just acknowledge receipt
    res.json({
      success: true,
      message: 'Webhook received'
    });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

/**
 * GET /api/payments/test
 * Test endpoint to verify payment system is working
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Payment system is operational',
    endpoints: [
      'GET /api/payments/:bookingId/instructions',
      'POST /api/payments/:bookingId/confirm',
      'GET /api/payments/:bookingId/status',
      'POST /api/payments/webhook'
    ],
    supportedMethods: [
      'Bank Transfer (Primary)',
      'Cash on Arrival (Secondary)'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;