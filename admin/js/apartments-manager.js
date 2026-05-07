/**
 * Apartment Management Module
 * Handles CRUD operations for apartments in admin dashboard
 */

import { AMENITIES_PRESET, LOCATIONS } from './amenities-preset.js';

class ApartmentManager {
  constructor() {
    this.apartments = [];
    this.currentFilter = 'all';
    this.editingApartment = null;
  }

  /**
   * Initialize the apartment manager
   */
  async init() {
    await this.loadApartments();
    this.renderApartmentsList();
    this.attachEventListeners();
  }

  /**
   * Load all apartments from API
   */
  async loadApartments() {
    try {
      const response = await fetch(`${window.API_URL}/api/admin/apartments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        this.apartments = data.apartments;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading apartments:', error);
      this.showNotification('Failed to load apartments', 'error');
    }
  }

  /**
   * Render apartments list
   */
  renderApartmentsList() {
    const container = document.getElementById('apartmentsList');
    if (!container) return;

    // Filter apartments
    let filtered = this.apartments;
    if (this.currentFilter === 'active') {
      filtered = this.apartments.filter(apt => apt.active && !apt.on_hold);
    } else if (this.currentFilter === 'on_hold') {
      filtered = this.apartments.filter(apt => apt.on_hold);
    } else if (this.currentFilter === 'inactive') {
      filtered = this.apartments.filter(apt => !apt.active);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="home"></i>
          <h3>No apartments found</h3>
          <p>Start by adding your first apartment</p>
          <button class="btn-primary" id="addApartmentBtn">
            <i data-lucide="plus"></i>
            Add Apartment
          </button>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(apt => this.renderApartmentCard(apt)).join('');
    lucide.createIcons();
  }

  /**
   * Render single apartment card
   */
  renderApartmentCard(apartment) {
    const statusBadge = this.getStatusBadge(apartment);
    const primaryImage = apartment.images && apartment.images[0] 
      ? apartment.images[0] 
      : 'https://via.placeholder.com/400x300?text=No+Image';

    return `
      <div class="apartment-card" data-id="${apartment.id}">
        <div class="apartment-image">
          <img src="${primaryImage}" alt="${apartment.name}" loading="lazy">
          ${statusBadge}
        </div>
        <div class="apartment-info">
          <h3 class="apartment-name">${apartment.name}</h3>
          <p class="apartment-location">
            <i data-lucide="map-pin"></i>
            ${apartment.location}
          </p>
          <div class="apartment-details">
            <span><i data-lucide="bed"></i> ${apartment.bedrooms || 'Studio'}</span>
            <span><i data-lucide="bath"></i> ${apartment.bathrooms}</span>
            <span><i data-lucide="users"></i> ${apartment.max_guests}</span>
          </div>
          <p class="apartment-price">₦${apartment.price_per_night.toLocaleString()}/night</p>
        </div>
        <div class="apartment-actions">
          <button class="btn-icon" onclick="apartmentManager.editApartment('${apartment.id}')" title="Edit">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="btn-icon" onclick="apartmentManager.toggleHold('${apartment.id}')" title="${apartment.on_hold ? 'Reactivate' : 'Put on Hold'}">
            <i data-lucide="${apartment.on_hold ? 'play' : 'pause'}"></i>
          </button>
          <button class="btn-icon btn-danger" onclick="apartmentManager.deleteApartment('${apartment.id}')" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Get status badge HTML
   */
  getStatusBadge(apartment) {
    if (apartment.on_hold) {
      return '<span class="status-badge on-hold">On Hold</span>';
    } else if (!apartment.active) {
      return '<span class="status-badge inactive">Inactive</span>';
    } else if (apartment.featured) {
      return '<span class="status-badge featured">Featured</span>';
    }
    return '<span class="status-badge active">Active</span>';
  }

  /**
   * Show add/edit apartment modal
   */
  showApartmentModal(apartment = null) {
    this.editingApartment = apartment;
    const modal = document.getElementById('apartmentModal');
    const modalTitle = document.getElementById('apartmentModalTitle');
    const form = document.getElementById('apartmentForm');

    modalTitle.textContent = apartment ? 'Edit Apartment' : 'Add New Apartment';
    
    if (apartment) {
      this.populateForm(apartment);
    } else {
      form.reset();
      this.renderAmenitiesCheckboxes([]);
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
  }

  /**
   * Populate form with apartment data
   */
  populateForm(apartment) {
    document.getElementById('apartmentName').value = apartment.name || '';
    document.getElementById('apartmentLocation').value = apartment.location || '';
    document.getElementById('apartmentPrice').value = apartment.price_per_night || '';
    document.getElementById('apartmentBedrooms').value = apartment.bedrooms || 0;
    document.getElementById('apartmentBathrooms').value = apartment.bathrooms || 1;
    document.getElementById('apartmentGuests').value = apartment.max_guests || 1;
    document.getElementById('apartmentDescription').value = apartment.description || '';
    document.getElementById('apartmentLatitude').value = apartment.latitude || '';
    document.getElementById('apartmentLongitude').value = apartment.longitude || '';
    document.getElementById('apartmentFeatured').checked = apartment.featured || false;
    document.getElementById('apartmentActive').checked = apartment.active !== false;

    this.renderAmenitiesCheckboxes(apartment.amenities || []);
    this.renderImagePreviews(apartment.images || []);
  }

  /**
   * Render amenities checkboxes
   */
  renderAmenitiesCheckboxes(selectedAmenities = []) {
    const container = document.getElementById('amenitiesContainer');
    if (!container) return;

    container.innerHTML = AMENITIES_PRESET.map(amenity => `
      <label class="checkbox-label">
        <input 
          type="checkbox" 
          name="amenities" 
          value="${amenity}"
          ${selectedAmenities.includes(amenity) ? 'checked' : ''}
        >
        <span>${amenity}</span>
      </label>
    `).join('');
  }

  /**
   * Render image previews
   */
  renderImagePreviews(images = []) {
    const container = document.getElementById('imagePreviews');
    if (!container) return;

    if (images.length === 0) {
      container.innerHTML = '<p class="text-muted">No images uploaded yet</p>';
      return;
    }

    container.innerHTML = images.map((url, index) => `
      <div class="image-preview">
        <img src="${url}" alt="Apartment image ${index + 1}">
        <button type="button" class="btn-remove-image" onclick="apartmentManager.removeImage('${url}')">
          <i data-lucide="x"></i>
        </button>
        ${index === 0 ? '<span class="primary-badge">Primary</span>' : ''}
      </div>
    `).join('');

    lucide.createIcons();
  }

  /**
   * Save apartment (create or update)
   */
  async saveApartment(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const amenities = formData.getAll('amenities');

    const apartmentData = {
      name: formData.get('name'),
      location: formData.get('location'),
      price_per_night: parseInt(formData.get('price_per_night')),
      max_guests: parseInt(formData.get('max_guests')),
      bedrooms: parseInt(formData.get('bedrooms')),
      bathrooms: parseInt(formData.get('bathrooms')),
      description: formData.get('description'),
      latitude: parseFloat(formData.get('latitude')) || null,
      longitude: parseFloat(formData.get('longitude')) || null,
      featured: formData.get('featured') === 'on',
      active: formData.get('active') === 'on',
      amenities: amenities,
      images: this.editingApartment ? this.editingApartment.images : []
    };

    try {
      const url = this.editingApartment 
        ? `${window.API_URL}/api/admin/apartments/${this.editingApartment.id}`
        : `${window.API_URL}/api/admin/apartments`;

      const method = this.editingApartment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(apartmentData)
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification(
          this.editingApartment ? 'Apartment updated successfully' : 'Apartment created successfully',
          'success'
        );
        this.closeModal();
        await this.loadApartments();
        this.renderApartmentsList();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving apartment:', error);
      this.showNotification('Failed to save apartment', 'error');
    }
  }

  /**
   * Edit apartment
   */
  async editApartment(id) {
    const apartment = this.apartments.find(apt => apt.id === id);
    if (apartment) {
      this.showApartmentModal(apartment);
    }
  }

  /**
   * Toggle hold status
   */
  async toggleHold(id) {
    const apartment = this.apartments.find(apt => apt.id === id);
    if (!apartment) return;

    const onHold = !apartment.on_hold;
    let holdReason = null;

    if (onHold) {
      holdReason = prompt('Reason for putting apartment on hold:');
      if (holdReason === null) return; // User cancelled
    }

    try {
      const response = await fetch(`${window.API_URL}/api/admin/apartments/${id}/hold`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ on_hold: onHold, hold_reason: holdReason })
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification(data.message, 'success');
        await this.loadApartments();
        this.renderApartmentsList();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error toggling hold:', error);
      this.showNotification('Failed to update apartment status', 'error');
    }
  }

  /**
   * Delete apartment
   */
  async deleteApartment(id) {
    if (!confirm('Are you sure you want to delete this apartment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${window.API_URL}/api/admin/apartments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification('Apartment deleted successfully', 'success');
        await this.loadApartments();
        this.renderApartmentsList();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting apartment:', error);
      this.showNotification(error.message || 'Failed to delete apartment', 'error');
    }
  }

  /**
   * Upload images
   */
  async uploadImages(files) {
    if (!this.editingApartment) {
      this.showNotification('Please save the apartment first before uploading images', 'warning');
      return;
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }

    try {
      const response = await fetch(
        `${window.API_URL}/api/admin/apartments/${this.editingApartment.id}/images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (data.success) {
        this.showNotification(data.message, 'success');
        this.editingApartment.images = data.apartment.images;
        this.renderImagePreviews(data.apartment.images);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      this.showNotification('Failed to upload images', 'error');
    }
  }

  /**
   * Remove image
   */
  async removeImage(imageUrl) {
    if (!this.editingApartment) return;

    if (!confirm('Are you sure you want to remove this image?')) {
      return;
    }

    try {
      const response = await fetch(
        `${window.API_URL}/api/admin/apartments/${this.editingApartment.id}/images`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ imageUrl })
        }
      );

      const data = await response.json();

      if (data.success) {
        this.showNotification('Image removed successfully', 'success');
        this.editingApartment.images = data.apartment.images;
        this.renderImagePreviews(data.apartment.images);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error removing image:', error);
      this.showNotification('Failed to remove image', 'error');
    }
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('apartmentModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    this.editingApartment = null;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // You can implement a toast notification system here
    alert(message);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Add apartment button
    document.getElementById('addApartmentBtn')?.addEventListener('click', () => {
      this.showApartmentModal();
    });

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentFilter = e.target.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.renderApartmentsList();
      });
    });

    // Form submit
    document.getElementById('apartmentForm')?.addEventListener('submit', (e) => {
      this.saveApartment(e);
    });

    // Close modal
    document.getElementById('closeApartmentModal')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Cancel button
    document.getElementById('cancelApartmentBtn')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Image upload
    document.getElementById('imageUpload')?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.uploadImages(e.target.files);
      }
    });
  }
}

// Create global instance
window.apartmentManager = new ApartmentManager();

export default ApartmentManager;
