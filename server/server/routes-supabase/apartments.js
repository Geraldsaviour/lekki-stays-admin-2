/**
 * Apartments Routes (Supabase)
 * 
 * Handles all apartment-related API endpoints
 */

const express = require('express');
const router = express.Router();
const Apartment = require('../models-supabase/Apartment');

// ============================================================================
// GET /api/apartments
// Get all active apartments
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const apartments = await Apartment.getAll();
    
    res.json({
      success: true,
      apartments: apartments.map(apt => apt.toJSON()),
      count: apartments.length
    });
  } catch (error) {
    console.error('Error fetching apartments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartments',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/apartments/:id
// Get apartment details by ID
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const apartment = await Apartment.getById(id);
    
    if (!apartment) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    res.json({
      success: true,
      apartment: apartment.toJSON()
    });
  } catch (error) {
    console.error('Error fetching apartment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartment',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/apartments/:id/availability
// Check if apartment is available for date range
// Query params: checkIn, checkOut
// ============================================================================
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;
    
    // Validate required parameters
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both checkIn and checkOut dates are required'
      });
    }
    
    // Validate date format (YYYY-MM-DD)
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
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'Check-out date must be after check-in date'
      });
    }
    
    // Get apartment
    const apartment = await Apartment.getById(id);
    
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
      apartmentId: id,
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
// GET /api/apartments/:id/booked-dates
// Get all booked date ranges for an apartment
// ============================================================================
router.get('/:id/booked-dates', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get apartment
    const apartment = await Apartment.getById(id);
    
    if (!apartment) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    // Get booked dates
    const bookedDates = await apartment.getBookedDates();
    
    res.json({
      success: true,
      apartmentId: id,
      bookedDates,
      count: bookedDates.length
    });
  } catch (error) {
    console.error('Error fetching booked dates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booked dates',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/apartments/:id/pricing
// Calculate pricing for date range
// Query params: checkIn, checkOut
// ============================================================================
router.get('/:id/pricing', async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;
    
    // Validate required parameters
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both checkIn and checkOut dates are required'
      });
    }
    
    // Get apartment
    const apartment = await Apartment.getById(id);
    
    if (!apartment) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    // Calculate pricing
    const pricing = apartment.calculatePricing(checkIn, checkOut);
    
    res.json({
      success: true,
      apartmentId: id,
      checkIn,
      checkOut,
      pricing
    });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    
    // Handle specific error cases
    if (error.message.includes('Invalid date range')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate pricing',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
