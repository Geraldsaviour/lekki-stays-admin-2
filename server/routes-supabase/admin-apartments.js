/**
 * Admin Apartment Management Routes
 * Full CRUD operations for apartments
 */

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ============================================================================
// APARTMENT CRUD OPERATIONS
// ============================================================================

/**
 * GET /api/admin/apartments
 * Get all apartments (including inactive and on hold)
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('apartments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      apartments: data
    });
  } catch (error) {
    console.error('Error fetching apartments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartments'
    });
  }
});

/**
 * GET /api/admin/apartments/:id
 * Get single apartment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
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

    res.json({
      success: true,
      apartment: data
    });
  } catch (error) {
    console.error('Error fetching apartment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartment'
    });
  }
});

/**
 * POST /api/admin/apartments
 * Create new apartment
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      location,
      price_per_night,
      max_guests,
      bedrooms,
      bathrooms,
      description,
      amenities,
      latitude,
      longitude,
      featured,
      images
    } = req.body;

    // Validation
    if (!name || !location || !price_per_night || !max_guests) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, location, price_per_night, max_guests'
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Generate unique ID
    const id = `apt-${Date.now()}`;

    const apartmentData = {
      id,
      name,
      slug,
      location,
      price_per_night: parseInt(price_per_night),
      max_guests: parseInt(max_guests),
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseInt(bathrooms) || 1,
      description: description || '',
      amenities: amenities || [],
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      featured: featured || false,
      images: images || [],
      active: true,
      on_hold: false
    };

    const { data, error } = await supabaseAdmin
      .from('apartments')
      .insert([apartmentData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Apartment created successfully',
      apartment: data
    });
  } catch (error) {
    console.error('Error creating apartment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create apartment'
    });
  }
});

/**
 * PUT /api/admin/apartments/:id
 * Update apartment
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      price_per_night,
      max_guests,
      bedrooms,
      bathrooms,
      description,
      amenities,
      latitude,
      longitude,
      featured,
      images,
      active
    } = req.body;

    // Build update object (only include provided fields)
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name;
      // Update slug if name changed
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (location !== undefined) updateData.location = location;
    if (price_per_night !== undefined) updateData.price_per_night = parseInt(price_per_night);
    if (max_guests !== undefined) updateData.max_guests = parseInt(max_guests);
    if (bedrooms !== undefined) updateData.bedrooms = parseInt(bedrooms);
    if (bathrooms !== undefined) updateData.bathrooms = parseInt(bathrooms);
    if (description !== undefined) updateData.description = description;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (featured !== undefined) updateData.featured = featured;
    if (images !== undefined) updateData.images = images;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabaseAdmin
      .from('apartments')
      .update(updateData)
      .eq('id', id)
      .select()
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

    res.json({
      success: true,
      message: 'Apartment updated successfully',
      apartment: data
    });
  } catch (error) {
    console.error('Error updating apartment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update apartment'
    });
  }
});

/**
 * DELETE /api/admin/apartments/:id
 * Soft delete apartment (set active = false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check for active bookings
    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('apartment_id', id)
      .in('status', ['pending', 'confirmed', 'payment_pending', 'paid'])
      .limit(1);

    if (bookingError) throw bookingError;

    if (bookings && bookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete apartment with active bookings. Put it on hold instead.'
      });
    }

    // Soft delete
    const { data, error } = await supabaseAdmin
      .from('apartments')
      .update({ active: false })
      .eq('id', id)
      .select()
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

    res.json({
      success: true,
      message: 'Apartment deleted successfully',
      apartment: data
    });
  } catch (error) {
    console.error('Error deleting apartment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete apartment'
    });
  }
});

/**
 * PATCH /api/admin/apartments/:id/hold
 * Toggle hold status
 */
router.patch('/:id/hold', async (req, res) => {
  try {
    const { id } = req.params;
    const { on_hold, hold_reason } = req.body;

    const updateData = {
      on_hold: on_hold === true,
      hold_reason: on_hold ? hold_reason : null
    };

    const { data, error } = await supabaseAdmin
      .from('apartments')
      .update(updateData)
      .eq('id', id)
      .select()
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

    res.json({
      success: true,
      message: on_hold ? 'Apartment put on hold' : 'Apartment reactivated',
      apartment: data
    });
  } catch (error) {
    console.error('Error toggling hold status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update hold status'
    });
  }
});

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

/**
 * POST /api/admin/apartments/:id/images
 * Upload images for apartment
 */
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided'
      });
    }

    // Get current apartment
    const { data: apartment, error: fetchError } = await supabaseAdmin
      .from('apartments')
      .select('images')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const uploadedUrls = [];

    // Upload each file to Supabase Storage
    for (const file of files) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${id}/${uuidv4()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('apartment-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('apartment-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    // Update apartment with new images
    const currentImages = apartment.images || [];
    const updatedImages = [...currentImages, ...uploadedUrls];

    const { data, error } = await supabaseAdmin
      .from('apartments')
      .update({ images: updatedImages })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `${uploadedUrls.length} image(s) uploaded successfully`,
      images: uploadedUrls,
      apartment: data
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images'
    });
  }
});

/**
 * DELETE /api/admin/apartments/:id/images
 * Delete specific image from apartment
 */
router.delete('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
    }

    // Get current apartment
    const { data: apartment, error: fetchError } = await supabaseAdmin
      .from('apartments')
      .select('images')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Remove image from array
    const updatedImages = (apartment.images || []).filter(img => img !== imageUrl);

    // Update apartment
    const { data, error } = await supabaseAdmin
      .from('apartments')
      .update({ images: updatedImages })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Try to delete from storage (optional, may fail if external URL)
    try {
      const fileName = imageUrl.split('/apartment-images/')[1];
      if (fileName) {
        await supabaseAdmin
          .storage
          .from('apartment-images')
          .remove([fileName]);
      }
    } catch (storageError) {
      console.log('Could not delete from storage:', storageError.message);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      apartment: data
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

module.exports = router;
