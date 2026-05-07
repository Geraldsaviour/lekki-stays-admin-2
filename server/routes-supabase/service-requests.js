/**
 * Service Requests Route (Admin)
 * Read and manage service requests submitted by guests
 */

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/admin/services - Get all service requests
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, serviceRequests: data, count: data.length });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service requests' });
  }
});

// PATCH /api/admin/services/:id - Update status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const { data, error } = await supabaseAdmin
      .from('service_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, serviceRequest: data });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ success: false, error: 'Failed to update service request' });
  }
});

module.exports = router;
