const { operations } = require('../db-simple');

class AvailabilityChecker {
  
  // In-memory lock for race condition protection
  static activeLocks = new Map();
  
  /**
   * Check if a property is available for the given date range with race condition protection
   * @param {number} apartmentId - The apartment ID
   * @param {string} checkIn - Check-in date (YYYY-MM-DD)
   * @param {string} checkOut - Check-out date (YYYY-MM-DD)
   * @param {boolean} acquireLock - Whether to acquire a lock for booking creation
   * @returns {Object} Availability result
   */
  static checkAvailability(apartmentId, checkIn, checkOut, acquireLock = false) {
    try {
      // Validate inputs
      const validation = this.validateDateRange(checkIn, checkOut);
      if (!validation.isValid) {
        return {
          available: false,
          error: validation.error,
          conflicts: []
        };
      }
      
      // Create lock key for this apartment and date range
      const lockKey = `${apartmentId}-${checkIn}-${checkOut}`;
      
      // Check if there's an active lock for this date range
      if (this.activeLocks.has(lockKey)) {
        return {
          available: false,
          error: 'Another booking is being processed for these dates',
          conflicts: [],
          locked: true
        };
      }
      
      // Acquire lock if requested (for booking creation)
      if (acquireLock) {
        this.activeLocks.set(lockKey, {
          timestamp: Date.now(),
          apartmentId: apartmentId,
          checkIn: checkIn,
          checkOut: checkOut
        });
        
        // Auto-release lock after 30 seconds to prevent deadlocks
        setTimeout(() => {
          this.releaseLock(lockKey);
        }, 30000);
      }
      
      // Check for overlapping bookings with atomic operation
      const isAvailable = operations.checkAvailability(apartmentId, checkIn, checkOut);
      
      if (!isAvailable) {
        // Release lock if we acquired it but booking is not available
        if (acquireLock) {
          this.releaseLock(lockKey);
        }
        
        // Get conflicting bookings for details
        const conflicts = this.getConflictingBookings(apartmentId, checkIn, checkOut);
        
        return {
          available: false,
          error: 'Property not available for selected dates',
          conflicts: conflicts,
          message: `Found ${conflicts.length} conflicting booking(s)`
        };
      }
      
      return {
        available: true,
        message: 'Property is available for the selected dates',
        lockKey: acquireLock ? lockKey : null
      };
      
    } catch (error) {
      console.error('Availability check error:', error);
      return {
        available: false,
        error: 'Failed to check availability',
        message: error.message
      };
    }
  }
  
  /**
   * Release a booking lock
   * @param {string} lockKey - The lock key to release
   */
  static releaseLock(lockKey) {
    if (this.activeLocks.has(lockKey)) {
      this.activeLocks.delete(lockKey);
      console.log(`🔓 Released booking lock: ${lockKey}`);
    }
  }
  
  /**
   * Clean up expired locks (older than 5 minutes)
   */
  static cleanupExpiredLocks() {
    const now = Date.now();
    const expiredThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [lockKey, lockData] of this.activeLocks.entries()) {
      if (now - lockData.timestamp > expiredThreshold) {
        this.activeLocks.delete(lockKey);
        console.log(`🧹 Cleaned up expired lock: ${lockKey}`);
      }
    }
  }
  
  /**
   * Check availability with atomic booking creation
   * @param {number} apartmentId - The apartment ID
   * @param {string} checkIn - Check-in date
   * @param {string} checkOut - Check-out date
   * @param {Function} bookingCallback - Callback to create booking if available
   * @returns {Object} Result with booking or availability info
   */
  static async checkAndBook(apartmentId, checkIn, checkOut, bookingCallback) {
    // Check availability with lock acquisition
    const availability = this.checkAvailability(apartmentId, checkIn, checkOut, true);
    
    if (!availability.available) {
      return {
        success: false,
        error: availability.error,
        conflicts: availability.conflicts
      };
    }
    
    try {
      // Execute booking creation callback
      const booking = await bookingCallback();
      
      // Release lock after successful booking
      if (availability.lockKey) {
        this.releaseLock(availability.lockKey);
      }
      
      return {
        success: true,
        booking: booking
      };
      
    } catch (error) {
      // Release lock on error
      if (availability.lockKey) {
        this.releaseLock(availability.lockKey);
      }
      
      throw error;
    }
  }
  
  /**
   * Get conflicting bookings for a date range
   * @param {number} apartmentId - The apartment ID
   * @param {string} checkIn - Check-in date
   * @param {string} checkOut - Check-out date
   * @returns {Array} Array of conflicting bookings
   */
  static getConflictingBookings(apartmentId, checkIn, checkOut) {
    const { operations } = require('../db-simple');
    
    return operations.db.bookings.filter(booking => 
      booking.apartmentId === parseInt(apartmentId) &&
      ['pending', 'confirmed'].includes(booking.status) &&
      booking.checkIn < checkOut &&
      booking.checkOut > checkIn
    ).map(booking => ({
      id: booking.id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.status,
      guestName: booking.guestName
    }));
  }
  
  /**
   * Validate date range for booking
   * @param {string} checkIn - Check-in date
   * @param {string} checkOut - Check-out date
   * @returns {Object} Validation result
   */
  static validateDateRange(checkIn, checkOut) {
    // Check if dates are provided
    if (!checkIn || !checkOut) {
      return {
        isValid: false,
        error: 'Check-in and check-out dates are required'
      };
    }
    
    // Parse dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if dates are valid
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return {
        isValid: false,
        error: 'Invalid date format. Use YYYY-MM-DD format'
      };
    }
    
    // Check if check-in is not in the past
    if (checkInDate < today) {
      return {
        isValid: false,
        error: 'Check-in date cannot be in the past'
      };
    }
    
    // Check if check-out is after check-in
    if (checkOutDate <= checkInDate) {
      return {
        isValid: false,
        error: 'Check-out date must be after check-in date'
      };
    }
    
    // Check maximum advance booking (365 days)
    const maxAdvanceDate = new Date(today);
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 365);
    
    if (checkInDate > maxAdvanceDate) {
      return {
        isValid: false,
        error: 'Bookings can only be made up to 365 days in advance'
      };
    }
    
    return {
      isValid: true
    };
  }
  
  /**
   * Check availability for multiple properties
   * @param {Array} apartmentIds - Array of apartment IDs
   * @param {string} checkIn - Check-in date
   * @param {string} checkOut - Check-out date
   * @returns {Object} Availability results for all properties
   */
  static checkMultipleAvailability(apartmentIds, checkIn, checkOut) {
    const results = {};
    
    for (const apartmentId of apartmentIds) {
      results[apartmentId] = this.checkAvailability(apartmentId, checkIn, checkOut);
    }
    
    return results;
  }
  
  /**
   * Get available properties for date range
   * @param {string} checkIn - Check-in date
   * @param {string} checkOut - Check-out date
   * @param {number} guests - Number of guests (optional)
   * @returns {Array} Array of available apartments
   */
  static getAvailableProperties(checkIn, checkOut, guests = null) {
    const allApartments = operations.getAllApartments();
    
    return allApartments.filter(apartment => {
      // Check guest capacity
      if (guests && apartment.maxGuests < guests) {
        return false;
      }
      
      // Check availability
      const availability = this.checkAvailability(apartment.id, checkIn, checkOut);
      return availability.available;
    });
  }
  
  /**
   * Calculate nights between two dates
   * @param {string} checkIn - Check-in date
   * @param {string} checkOut - Check-out date
   * @returns {number} Number of nights
   */
  static calculateNights(checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  /**
   * Get booking calendar data for frontend
   * @param {number} apartmentId - The apartment ID
   * @param {number} months - Number of months to include (default: 12)
   * @returns {Object} Calendar data with booked dates
   */
  static getCalendarData(apartmentId, months = 12) {
    const bookedDates = operations.getBookedDates(apartmentId);
    const today = new Date();
    
    // Generate date ranges for the next X months
    const calendarData = {
      apartmentId: apartmentId,
      generatedAt: today.toISOString(),
      months: months,
      bookedRanges: bookedDates,
      unavailableDates: []
    };
    
    // Convert booked ranges to individual unavailable dates
    bookedDates.forEach(booking => {
      const startDate = new Date(booking.checkIn);
      const endDate = new Date(booking.checkOut);
      
      // Add each date in the range to unavailable dates
      for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
        calendarData.unavailableDates.push(date.toISOString().split('T')[0]);
      }
    });
    
    return calendarData;
  }
}

// Clean up expired locks every 2 minutes
setInterval(() => {
  AvailabilityChecker.cleanupExpiredLocks();
}, 2 * 60 * 1000);

module.exports = AvailabilityChecker;