/**
 * Apartment Model (Supabase)
 * 
 * Handles all apartment-related database operations using Supabase
 */

const { supabasePublic, supabaseAdmin } = require('../supabase-client');

class Apartment {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.location = data.location;
    this.pricePerNight = data.price_per_night;
    this.maxGuests = data.max_guests;
    this.active = data.active;
    this.createdAt = data.created_at;
  }

  // ============================================================================
  // STATIC METHODS (Database Operations)
  // ============================================================================

  /**
   * Get all active apartments
   */
  static async getAll() {
    const { data, error } = await supabasePublic
      .from('apartments')
      .select('*')
      .eq('active', true)
      .order('id');

    if (error) {
      console.error('Error fetching apartments:', error);
      throw new Error(`Failed to fetch apartments: ${error.message}`);
    }

    return data.map(apt => new Apartment(apt));
  }

  /**
   * Get apartment by ID
   */
  static async getById(id) {
    const { data, error } = await supabasePublic
      .from('apartments')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching apartment:', error);
      throw new Error(`Failed to fetch apartment: ${error.message}`);
    }

    return data ? new Apartment(data) : null;
  }

  /**
   * Get apartment by slug
   */
  static async getBySlug(slug) {
    const { data, error } = await supabasePublic
      .from('apartments')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching apartment by slug:', error);
      throw new Error(`Failed to fetch apartment: ${error.message}`);
    }

    return data ? new Apartment(data) : null;
  }

  /**
   * Get available apartments for date range and guest count
   */
  static async getAvailable(checkIn, checkOut, guests = null) {
    // First get all apartments
    const apartments = await Apartment.getAll();

    // Filter by guest capacity if specified
    let filtered = apartments;
    if (guests) {
      filtered = apartments.filter(apt => apt.maxGuests >= guests);
    }

    // If no dates specified, return all (filtered by guests)
    if (!checkIn || !checkOut) {
      return filtered;
    }

    // Check availability for each apartment
    const available = [];
    for (const apartment of filtered) {
      const isAvailable = await apartment.checkAvailability(checkIn, checkOut);
      if (isAvailable) {
        available.push(apartment);
      }
    }

    return available;
  }

  // ============================================================================
  // INSTANCE METHODS
  // ============================================================================

  /**
   * Check if apartment is available for date range
   */
  async checkAvailability(checkIn, checkOut) {
    const { data, error } = await supabasePublic
      .rpc('check_apartment_availability', {
        p_apartment_id: this.id,
        p_check_in: checkIn,
        p_check_out: checkOut
      });

    if (error) {
      console.error('Error checking availability:', error);
      throw new Error(`Failed to check availability: ${error.message}`);
    }

    return data === true;
  }

  /**
   * Get booked dates for this apartment
   */
  async getBookedDates() {
    const { data, error } = await supabasePublic
      .rpc('get_booked_dates', {
        p_apartment_id: this.id
      });

    if (error) {
      console.error('Error fetching booked dates:', error);
      throw new Error(`Failed to fetch booked dates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Calculate pricing for date range
   */
  calculatePricing(checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new Error('Invalid date range: check-out must be after check-in');
    }

    const subtotal = this.pricePerNight * nights;
    const serviceFee = 10000; // Fixed ₦10,000 service fee
    const total = subtotal + serviceFee;

    return {
      pricePerNight: this.pricePerNight,
      nights,
      subtotal,
      serviceFee,
      total
    };
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      location: this.location,
      pricePerNight: this.pricePerNight,
      maxGuests: this.maxGuests,
      active: this.active,
      createdAt: this.createdAt
    };
  }
}

module.exports = Apartment;
