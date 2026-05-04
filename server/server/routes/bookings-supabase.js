const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const WhatsAppNotifier = require('../utils/whatsapp');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const xss = require('xss');
const crypto = require('crypto');

// Admin authentication middleware
function requireAdmin(req, res, next) {
  const adminKey = req.query.admin;
  const expectedKey = process.env.ADMIN_KEY;
  
  if (!adminKey || adminKey !== expectedKey) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Access Denied</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #0a0a0a; color: #F5F0E8;
            font-family: 'DM Sans', sans-serif;
            min-height: 100vh; display: flex;
            align-items: center; justify-content: center;
            padding: 20px;
          }
          .card {
            background: #111;
            border: 1px solid #E53935;
            border-radius: 16px;
            padding: 48px 40px;
            max-width: 420px;
            width: 100%;
            text-align: center;
          }
          .icon { font-size: 52px; margin-bottom: 16px; }
          h1 { color: #E53935; font-size: 28px; margin-bottom: 12px; }
          p { color: #888; font-size: 15px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔒</div>
          <h1>Access Denied</h1>
          <p>You do not have permission to perform this action.</p>
          <p style="margin-top: 12px; font-size: 13px;">
            This link is only accessible by the property administrator.
          </p>
        </div>
      </body>
      </html>
    `);
  }
  
  next();
}

// Rate limiting for booking creation
const bookingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: 'Too many booking attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization middleware
const sanitizeBookingInput = (req, res, next) => {
  if (req.body) {
    if (req.body.guestName) {
      req.body.guestName = xss(req.body.guestName.trim());
    }
    if (req.body.guestEmail) {
      req.body.guestEmail = validator.normalizeEmail(req.body.guestEmail) || req.body.guestEmail;
    }
    if (req.body.guestPhone) {
      req.body.guestPhone = req.body.guestPhone.replace(/[^\d+\-\s()]/g, '');
    }
    if (req.body.numGuests) {
      req.body.numGuests = parseInt(req.body.numGuests, 10);
    }
    if (req.body.totalPrice) {
      req.body.totalPrice = parseFloat(req.body.totalPrice);
    }
  }
  next();
};

// Validation function
const validateBookingData = (bookingData) => {
  const errors = [];
  
  if (!bookingData.guestName || bookingData.guestName.trim().length < 2) {
    errors.push('Guest name must be at least 2 characters long');
  } else if (bookingData.guestName.length > 100) {
    errors.push('Guest name must be less than 100 characters');
  } else if (!/^[a-zA-Z\s\-'\.]+$/.test(bookingData.guestName)) {
    errors.push('Guest name contains invalid characters');
  }
  
  if (!bookingData.guestEmail) {
    errors.push('Email address is required');
  } else if (!validator.isEmail(bookingData.guestEmail)) {
    errors.push('Valid email address is required');
  }
  
  if (!bookingData.guestPhone) {
    errors.push('Phone number is required');
  } else {
    const cleanPhone = bookingData.guestPhone.replace(/\s+/g, '');
    if (!/^(\+234|0)[789]\d{9}$/.test(cleanPhone)) {
      errors.push('Valid Nigerian phone number is required');
    }
  }
  
  if (!bookingData.checkIn || !validator.isISO8601(bookingData.checkIn)) {
    errors.push('Valid check-in date is required');
  }
  
  if (!bookingData.checkOut || !validator.isISO8601(bookingData.checkOut)) {
    errors.push('Valid check-out date is required');
  }
  
  if (bookingData.checkIn && bookingData.checkOut) {
    const checkInDate = new Date(bookingData.checkIn);
    const checkOutDate = new Date(bookingData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      errors.push('Check-in date cannot be in the past');
    }
    
    if (checkOutDate <= checkInDate) {
      errors.push('Check-out date must be after check-in date');
    }
    
    const stayDuration = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
    if (stayDuration > 30) {
      errors.push('Maximum stay duration is 30 days');
    }
    
    if (stayDuration < 1) {
      errors.push('Minimum stay is 1 night');
    }
  }
  
  if (!Number.isInteger(bookingData.numGuests) || bookingData.numGuests < 1) {
    errors.push('Number of guests must be at least 1');
  } else if (bookingData.numGuests > 20) {
    errors.push('Maximum 20 guests allowed');
  }
  
  if (!Number.isFinite(bookingData.totalPrice) || bookingData.totalPrice <= 0) {
    errors.push('Total price must be a positive number');
  } else if (bookingData.totalPrice > 10000000) {
    errors.push('Total price exceeds maximum allowed amount');
  }
  
  if (!bookingData.apartmentId) {
    errors.push('Valid apartment ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate unique booking reference
const generateBookingRef = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BK-${timestamp}-${random}`;
};

// Calculate nights
const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// POST /api/bookings - Create new booking
router.post('/', bookingRateLimit, sanitizeBookingInput, async (req, res) => {
  try {
    const bookingData = req.body;
    
    console.log('📝 Booking request received:', bookingData);
    
    // Validate input
    const validation = validateBookingData(bookingData);
    if (!validation.isValid) {
      console.warn('❌ Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      });
    }
    
    // Get apartment details
    const { data: apartment, error: aptError } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', bookingData.apartmentId)
      .eq('active', true)
      .single();
    
    if (aptError || !apartment) {
      console.warn(`❌ Apartment not found: ${bookingData.apartmentId}`);
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    console.log(`✅ Apartment found: ${apartment.name}`);
    
    // Check guest capacity
    if (bookingData.numGuests > apartment.max_guests) {
      console.warn(`❌ Guest capacity exceeded: ${bookingData.numGuests} > ${apartment.max_guests}`);
      return res.status(400).json({
        success: false,
        error: `Maximum ${apartment.max_guests} guests allowed for this property`
      });
    }
    
    // Check availability
    const { data: isAvailable, error: availError } = await supabase
      .rpc('check_apartment_availability', {
        p_apartment_id: bookingData.apartmentId,
        p_check_in: bookingData.checkIn,
        p_check_out: bookingData.checkOut
      });
    
    if (availError) throw availError;
    
    if (!isAvailable) {
      console.warn('❌ Apartment not available for selected dates');
      return res.status(409).json({
        success: false,
        error: 'Apartment is not available for the selected dates'
      });
    }
    
    // Calculate and validate pricing
    const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
    const expectedPrice = apartment.price_per_night * nights;
    const priceTolerance = 1;
    
    if (Math.abs(bookingData.totalPrice - expectedPrice) > priceTolerance) {
      console.warn(`❌ Price mismatch: Expected ${expectedPrice}, Got ${bookingData.totalPrice}`);
      return res.status(400).json({
        success: false,
        error: `Price mismatch. Expected: ₦${expectedPrice.toLocaleString()}`
      });
    }
    
    // Generate booking reference and guest token
    const bookingRef = generateBookingRef();
    const guestToken = crypto.randomUUID();
    
    console.log(`🔄 Creating booking with ref: ${bookingRef}`);
    
    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_ref: bookingRef,
        apartment_id: bookingData.apartmentId,
        guest_name: bookingData.guestName,
        guest_phone: bookingData.guestPhone,
        guest_email: bookingData.guestEmail,
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        guests: bookingData.numGuests,
        total_price: expectedPrice,
        status: 'pending',
        guest_token: guestToken
      })
      .select()
      .single();
    
    if (bookingError) throw bookingError;
    
    console.log(`✅ Booking created successfully: ${booking.booking_ref}`);
    
    // Generate WhatsApp notification link
    const whatsappLink = WhatsAppNotifier.generateHostNotification(
      {
        id: booking.booking_ref,
        guestName: booking.guest_name,
        guestPhone: booking.guest_phone,
        guestEmail: booking.guest_email,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        numGuests: booking.guests,
        totalPrice: booking.total_price,
        token: booking.guest_token
      },
      apartment
    );
    
    res.status(201).json({
      success: true,
      booking: {
        id: booking.booking_ref,
        apartmentId: booking.apartment_id,
        guestName: booking.guest_name,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        guests: booking.guests,
        totalPrice: booking.total_price,
        status: booking.status,
        createdAt: booking.created_at
      },
      whatsappLink,
      message: 'Booking created successfully. Host will be notified via WhatsApp.'
    });
    
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: isDevelopment ? error.message : 'An internal error occurred. Please try again.'
    });
  }
});

// GET /api/bookings/:id - Get booking details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        apartments (*)
      `)
      .eq('booking_ref', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      booking: {
        id: booking.booking_ref,
        apartmentId: booking.apartment_id,
        guestName: booking.guest_name,
        guestPhone: booking.guest_phone,
        guestEmail: booking.guest_email,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        guests: booking.guests,
        totalPrice: booking.total_price,
        status: booking.status,
        createdAt: booking.created_at
      },
      apartment: booking.apartments
    });
    
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

module.exports = router;
