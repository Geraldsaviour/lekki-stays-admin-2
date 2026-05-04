/**
 * Availability Routes (Supabase)
 * 
 * Handles availability checking and search operations
 */

const express = require('express');
const router = express.Router();
const Apartment = require('../models-supabase/Apartment');

// ============================================================================
// POST /api/availability/check
// Check availability for a specific apartment and date range
// Body: { apartmentId, checkIn, checkOut }
// ============================================================================
router.post('/check', async (req, res) => {
  try {
    const { apartmentId, checkIn, checkOut } = req.body;
    
    // Validate required fields
    if (!apartmentId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'apartmentId, checkIn, and checkOut are required'
      });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }
    
    // Validate date logic
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Invalid check-in date',
        message: 'Check-in date cannot be in the past'
      });
    }
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'Check-out date must be after check-in date'
      });
    }
    
    // Get apartment
    const apartment = await Apartment.getById(apartmentId);
    
    if (!apartment) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    // Check availability
    const available = await apartment.checkAvailability(checkIn, checkOut);
    
    res.json({
      success: true,
      available,
      apartment: apartment.toJSON(),
      checkIn,
      checkOut
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/availability/search
// Search for available apartments
// Body: { location?, checkIn, checkOut, guests }
// ============================================================================
router.post('/search', async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests } = req.body;
    
    // Validate required fields
    if (!checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'checkIn, checkOut, and guests are required'
      });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }
    
    // Validate date logic
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Invalid check-in date',
        message: 'Check-in date cannot be in the past'
      });
    }
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'Check-out date must be after check-in date'
      });
    }
    
    // Validate guests
    const guestCount = parseInt(guests, 10);
    if (isNaN(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid guest count',
        message: 'Guests must be a positive number'
      });
    }
    
    // Get available apartments
    let availableApartments = await Apartment.getAvailable(checkIn, checkOut, guestCount);
    
    // Filter by location if specified
    if (location && location !== 'Any location') {
      availableApartments = availableApartments.filter(apt => 
        apt.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    // Calculate pricing for each apartment
    const results = availableApartments.map(apt => {
      const pricing = apt.calculatePricing(checkIn, checkOut);
      return {
        ...apt.toJSON(),
        pricing
      };
    });
    
    res.json({
      success: true,
      available: results,
      count: results.length,
      searchParams: {
        location: location || 'Any location',
        checkIn,
        checkOut,
        guests: guestCount
      }
    });
  } catch (error) {
    console.error('Error searching availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search availability',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/availability/bulk-check
// Check availability for multiple apartments at once
// Body: { apartmentIds: [], checkIn, checkOut }
// ============================================================================
router.post('/bulk-check', async (req, res) => {
  try {
    const { apartmentIds, checkIn, checkOut } = req.body;
    
    // Validate required fields
    if (!apartmentIds || !Array.isArray(apartmentIds) || apartmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid apartmentIds',
        message: 'apartmentIds must be a non-empty array'
      });
    }
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'checkIn and checkOut are required'
      });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }
    
    // Check availability for each apartment
    const results = await Promise.all(
      apartmentIds.map(async (apartmentId) => {
        try {
          const apartment = await Apartment.getById(apartmentId);
          if (!apartment) {
            return {
              apartmentId,
              available: false,
              error: 'Apartment not found'
            };
          }
          
          const available = await apartment.checkAvailability(checkIn, checkOut);
          return {
            apartmentId,
            available,
            apartment: apartment.toJSON()
          };
        } catch (error) {
          return {
            apartmentId,
            available: false,
            error: error.message
          };
        }
      })
    );
    
    res.json({
      success: true,
      results,
      checkIn,
      checkOut
    });
  } catch (error) {
    console.error('Error bulk checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk check availability',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
