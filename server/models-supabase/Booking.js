/**
 * Booking Model (Supabase)
 * 
 * Handles all booking-related database operations using Supabase
 */

const { supabasePublic, supabaseAdmin } = require('../supabase-client');
const crypto = require('crypto');

class Booking {
  constructor(data) {
    this.id = data.id;
    this.bookingRef = data.booking_ref;
    this.apartmentId = data.apartment_id;
    this.guestName = data.guest_name;
    this.guestPhone = data.guest_phone;
    this.guestEmail = data.guest_email;
    this.checkIn = data.check_in;
    this.checkOut = data.check_out;
    this.guests = data.guests;
    this.totalPrice = data.total_price;
    this.status = data.status;
    this.guestToken = data.guest_token;
    this.paymentDeadline = data.payment_deadline;
    this.confirmedAt = data.confirmed_at;
    this.paidAt = data.paid_at;
    this.declinedAt = data.declined_at;
    this.cancelledAt = data.cancelled_at;
    this.createdAt = data.created_at;
  }

  // ============================================================================
  // STATIC METHODS (Database Operations)
  // ============================================================================

  /**
   * Create a new booking
   */
  static async create(bookingData) {
    // Validate input
    const validation = Booking.validate(bookingData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate booking reference and token
    const bookingRef = Booking.generateBookingRef();
    const guestToken = Booking.generateToken();

    // Prepare data for insertion
    const insertData = {
      booking_ref: bookingRef,
      apartment_id: bookingData.apartmentId,
      guest_name: Booking.sanitizeName(bookingData.guestName),
      guest_phone: Booking.formatPhone(bookingData.guestPhone),
      guest_email: bookingData.guestEmail.toLowerCase().trim(),
      check_in: bookingData.checkIn,
      check_out: bookingData.checkOut,
      guests: bookingData.guests,
      total_price: bookingData.totalPrice,
      status: 'pending',
      guest_token: guestToken
    };

    // Insert using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    console.log('✅ Booking created:', data.booking_ref);
    return new Booking(data);
  }

  /**
   * Get booking by ID
   */
  static async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching booking:', error);
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }

    return data ? new Booking(data) : null;
  }

  /**
   * Get booking by reference
   */
  static async getByRef(bookingRef) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('booking_ref', bookingRef)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching booking by ref:', error);
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }

    return data ? new Booking(data) : null;
  }

  /**
   * Get booking by guest token
   */
  static async getByToken(guestToken) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('guest_token', guestToken)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching booking by token:', error);
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }

    return data ? new Booking(data) : null;
  }

  /**
   * Get all bookings for an apartment
   */
  static async getByApartment(apartmentId, status = null) {
    let query = supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('check_in', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    return data.map(b => new Booking(b));
  }

  // ============================================================================
  // INSTANCE METHODS
  // ============================================================================

  /**
   * Update booking status
   */
  async updateStatus(newStatus) {
    const validStatuses = ['pending', 'confirmed', 'payment_pending', 'paid', 'declined', 'auto_declined', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const updateData = { status: newStatus };

    // Set timestamps based on status
    switch (newStatus) {
      case 'confirmed':
        updateData.confirmed_at = new Date().toISOString();
        // Set payment deadline to 24 hours from now
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 24);
        updateData.payment_deadline = deadline.toISOString();
        updateData.status = 'payment_pending'; // Auto-transition to payment_pending
        break;
      case 'paid':
        updateData.paid_at = new Date().toISOString();
        break;
      case 'declined':
      case 'auto_declined':
        updateData.declined_at = new Date().toISOString();
        break;
      case 'cancelled':
        updateData.cancelled_at = new Date().toISOString();
        break;
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', this.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      throw new Error(`Failed to update booking status: ${error.message}`);
    }

    // Update instance properties
    Object.assign(this, data);
    console.log(`✅ Booking ${this.bookingRef} status updated to: ${this.status}`);
    return true;
  }

  /**
   * Calculate number of nights
   */
  getNights() {
    const checkInDate = new Date(this.checkIn);
    const checkOutDate = new Date(this.checkOut);
    return Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if booking is refundable (48+ hours before check-in)
   */
  isRefundable() {
    const checkInDate = new Date(this.checkIn);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
    return hoursUntilCheckIn >= 48;
  }

  /**
   * Calculate refund amount
   */
  getRefundAmount() {
    if (!this.isRefundable()) {
      return 0;
    }
    const serviceFee = 10000;
    return Math.max(0, this.totalPrice - serviceFee);
  }

  // ============================================================================
  // VALIDATION & SANITIZATION
  // ============================================================================

  static validate(data) {
    const errors = [];

    // Apartment ID
    if (!data.apartmentId || typeof data.apartmentId !== 'string') {
      errors.push('Valid apartment ID is required');
    }

    // Guest name
    if (!data.guestName || typeof data.guestName !== 'string') {
      errors.push('Guest name is required');
    } else {
      const trimmed = data.guestName.trim();
      if (trimmed.length < 2) errors.push('Guest name must be at least 2 characters');
      if (trimmed.length > 100) errors.push('Guest name must be less than 100 characters');
      if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) errors.push('Guest name contains invalid characters');
    }

    // Phone
    if (!data.guestPhone || !Booking.isValidPhone(data.guestPhone)) {
      errors.push('Valid Nigerian phone number is required');
    }

    // Email
    if (!data.guestEmail || !Booking.isValidEmail(data.guestEmail)) {
      errors.push('Valid email address is required');
    }

    // Dates
    if (!data.checkIn) errors.push('Check-in date is required');
    if (!data.checkOut) errors.push('Check-out date is required');

    if (data.checkIn && data.checkOut) {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) errors.push('Check-in date cannot be in the past');
      if (checkOut <= checkIn) errors.push('Check-out must be after check-in');

      const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
      if (nights < 1) errors.push('Minimum stay is 1 night');
      if (nights > 365) errors.push('Maximum stay is 365 days');
    }

    // Guests
    if (!Number.isInteger(data.guests) || data.guests < 1) {
      errors.push('Number of guests must be at least 1');
    } else if (data.guests > 50) {
      errors.push('Maximum 50 guests allowed');
    }

    // Price
    if (!Number.isFinite(data.totalPrice) || data.totalPrice <= 0) {
      errors.push('Total price must be a positive number');
    } else if (data.totalPrice > 100000000) {
      errors.push('Total price exceeds maximum allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const phoneRegex = /^(\+?234|0)[789][01]\d{8}$/;
    const clean = phone.replace(/[\s\-()]/g, '');
    return phoneRegex.test(clean);
  }

  static sanitizeName(name) {
    return name.trim().replace(/[<>'"&]/g, '').replace(/\s+/g, ' ').substring(0, 100);
  }

  static formatPhone(phone) {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+234' + cleaned.substring(1);
    } else if (cleaned.startsWith('234')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+234') && cleaned.length === 10) {
      cleaned = '+234' + cleaned;
    }
    return cleaned;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  static generateBookingRef() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `LUX${timestamp}${random}`;
  }

  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toJSON() {
    return {
      id: this.id,
      bookingRef: this.bookingRef,
      apartmentId: this.apartmentId,
      guestName: this.guestName,
      guestPhone: this.guestPhone,
      guestEmail: this.guestEmail,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      guests: this.guests,
      totalPrice: this.totalPrice,
      status: this.status,
      guestToken: this.guestToken,
      paymentDeadline: this.paymentDeadline,
      confirmedAt: this.confirmedAt,
      paidAt: this.paidAt,
      declinedAt: this.declinedAt,
      cancelledAt: this.cancelledAt,
      createdAt: this.createdAt,
      nights: this.getNights(),
      isRefundable: this.isRefundable(),
      refundAmount: this.getRefundAmount()
    };
  }

  toPublicJSON() {
    return {
      id: this.id,
      bookingRef: this.bookingRef,
      apartmentId: this.apartmentId,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      guests: this.guests,
      totalPrice: this.totalPrice,
      status: this.status,
      nights: this.getNights(),
      createdAt: this.createdAt
    };
  }
}

module.exports = Booking;
