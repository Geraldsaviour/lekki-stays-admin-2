const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Helper function to transform apartment data from snake_case to camelCase
const transformApartment = (apt) => {
  return {
    id: apt.id,
    name: apt.name,
    slug: apt.slug,
    location: apt.location,
    pricePerNight: apt.price_per_night,
    maxGuests: apt.max_guests,
    bedrooms: apt.bedrooms,
    bathrooms: apt.bathrooms,
    description: apt.description,
    amenities: apt.amenities,
    images: apt.images,
    active: apt.active,
    createdAt: apt.created_at,
    // Add totalPrice if it exists
    ...(apt.totalPrice && { totalPrice: apt.totalPrice })
  };
};

// Helper function to calculate nights between dates
const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// Helper function to validate date range
const validateDateRange = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (start < today) {
    return { isValid: false, error: 'Check-in date cannot be in the past' };
  }
  
  if (end <= start) {
    return { isValid: false, error: 'Check-out date must be after check-in date' };
  }
  
  return { isValid: true };
};

// POST /api/apartments/availability - Check availability for multiple properties
router.post('/availability', async (req, res) => {
  try {
    const { checkin, checkout, guests, apartmentIds } = req.body;
    
    if (!checkin || !checkout) {
      return res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates are required'
      });
    }
    
    // Validate date range
    const validation = validateDateRange(checkin, checkout);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    const nights = calculateNights(checkin, checkout);
    
    if (apartmentIds && Array.isArray(apartmentIds)) {
      // Check specific apartments
      const results = await Promise.all(
        apartmentIds.map(async (aptId) => {
          const { data: isAvailable } = await supabase
            .rpc('check_apartment_availability', {
              p_apartment_id: aptId,
              p_check_in: checkin,
              p_check_out: checkout
            });
          
          return {
            apartmentId: aptId,
            available: isAvailable
          };
        })
      );
      
      return res.json({
        success: true,
        results,
        checkin,
        checkout,
        nights
      });
    } else {
      // Get all available properties
      const { data: apartments, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('active', true);
      
      if (error) throw error;
      
      // Check availability for each apartment
      const availableApartments = [];
      for (const apt of apartments) {
        const { data: isAvailable } = await supabase
          .rpc('check_apartment_availability', {
            p_apartment_id: apt.id,
            p_check_in: checkin,
            p_check_out: checkout
          });
        
        if (isAvailable && (!guests || apt.max_guests >= guests)) {
          availableApartments.push(transformApartment({
            ...apt,
            totalPrice: apt.price_per_night * nights
          }));
        }
      }
      
      res.json({
        success: true,
        available: availableApartments,
        count: availableApartments.length,
        checkin,
        checkout,
        nights
      });
    }
    
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability',
      message: error.message
    });
  }
});

// GET /api/apartments - List all available properties
router.get('/', async (req, res) => {
  try {
    const { limit, checkin, checkout, guests } = req.query;
    
    let query = supabase
      .from('apartments')
      .select('*')
      .eq('active', true);
    
    // Apply guest filter
    if (guests) {
      query = query.gte('max_guests', parseInt(guests));
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const { data: apartments, error } = await query;
    
    if (error) throw error;
    
    // If date range provided, filter by availability
    if (checkin && checkout) {
      const availableApartments = [];
      for (const apt of apartments) {
        const { data: isAvailable } = await supabase
          .rpc('check_apartment_availability', {
            p_apartment_id: apt.id,
            p_check_in: checkin,
            p_check_out: checkout
          });
        
        if (isAvailable) {
          const nights = calculateNights(checkin, checkout);
          availableApartments.push({
            ...apt,
            totalPrice: apt.price_per_night * nights
          });
        }
      }
      
      return res.json({
        success: true,
        count: availableApartments.length,
        apartments: availableApartments.map(transformApartment)
      });
    }
    
    res.json({
      success: true,
      count: apartments.length,
      apartments: apartments.map(transformApartment)
    });
    
  } catch (error) {
    console.error('Error fetching apartments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartments',
      message: error.message
    });
  }
});

// GET /api/apartments/:id - Get specific property details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get apartment details
    const { data: apartment, error } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Apartment not found'
        });
      }
      throw error;
    }
    
    // Get reviews for this apartment
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('apartment_id', id)
      .order('created_at', { ascending: false });
    
    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      // Continue without reviews rather than failing
    }
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }
    
    // Transform apartment data and add reviews
    const apartmentWithReviews = {
      ...transformApartment(apartment),
      reviews: reviews || [],
      averageRating: parseFloat(averageRating),
      reviewCount: reviews ? reviews.length : 0
    };
    
    res.json({
      success: true,
      apartment: apartmentWithReviews
    });
    
  } catch (error) {
    console.error('Error fetching apartment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartment',
      message: error.message
    });
  }
});

// GET /api/apartments/:id/availability - Check availability for specific dates
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { checkin, checkout } = req.query;
    
    if (!checkin || !checkout) {
      return res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates are required'
      });
    }
    
    // Get apartment details
    const { data: apartment, error: aptError } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (aptError) {
      if (aptError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Apartment not found'
        });
      }
      throw aptError;
    }
    
    // Check availability
    const { data: isAvailable, error: availError } = await supabase
      .rpc('check_apartment_availability', {
        p_apartment_id: id,
        p_check_in: checkin,
        p_check_out: checkout
      });
    
    if (availError) throw availError;
    
    let pricing = null;
    if (isAvailable) {
      const nights = calculateNights(checkin, checkout);
      pricing = {
        pricePerNight: apartment.price_per_night,
        nights,
        total: apartment.price_per_night * nights
      };
    }
    
    res.json({
      success: true,
      available: isAvailable,
      apartmentId: id,
      checkin,
      checkout,
      pricing
    });
    
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability',
      message: error.message
    });
  }
});

// GET /api/apartments/:id/booked-dates - Get booked dates for calendar
router.get('/:id/booked-dates', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify apartment exists
    const { data: apartment, error: aptError } = await supabase
      .from('apartments')
      .select('id')
      .eq('id', id)
      .single();
    
    if (aptError) {
      if (aptError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Apartment not found'
        });
      }
      throw aptError;
    }
    
    // Get booked dates
    const { data: bookedDates, error } = await supabase
      .rpc('get_booked_dates', {
        p_apartment_id: id
      });
    
    if (error) throw error;
    
    res.json({
      success: true,
      apartmentId: id,
      bookedDates
    });
    
  } catch (error) {
    console.error('Error fetching booked dates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booked dates',
      message: error.message
    });
  }
});

module.exports = router;
