// Search Results Page JavaScript

class SearchResults {
    constructor() {
        this.apartments = [];
        this.searchParams = this.getSearchParams();
        this.init();
    }

    init() {
        this.displaySearchParams();
        this.loadResults();
        this.bindEvents();
    }

    getSearchParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            location: urlParams.get('location') || '',
            checkin: urlParams.get('checkin') || '',
            checkout: urlParams.get('checkout') || '',
            guests: parseInt(urlParams.get('guests')) || 1
        };
    }

    displaySearchParams() {
        const { location, checkin, checkout, guests } = this.searchParams;

        // Display location
        document.getElementById('displayLocation').textContent = location || 'All Locations';

        // Display dates
        if (checkin && checkout) {
            const checkinDate = new Date(checkin);
            const checkoutDate = new Date(checkout);
            const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
            document.getElementById('displayDates').textContent = 
                `${this.formatDate(checkinDate)} - ${this.formatDate(checkoutDate)} (${nights} night${nights > 1 ? 's' : ''})`;
        } else {
            document.getElementById('displayDates').textContent = 'Any dates';
        }

        // Display guests
        document.getElementById('displayGuests').textContent = 
            `${guests} guest${guests > 1 ? 's' : ''}`;
    }

    formatDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    async loadResults() {
        const loadingState = document.getElementById('loadingState');
        const noResults = document.getElementById('noResults');
        const resultsCarousel = document.getElementById('resultsCarousel');
        const resultsCount = document.getElementById('resultsCount');

        try {
            loadingState.style.display = 'block';
            noResults.style.display = 'none';
            if (resultsCarousel) {
                resultsCarousel.parentElement.style.display = 'none';
            }

            const { checkin, checkout, guests } = this.searchParams;

            let response;
            
            // If dates are provided, search for available apartments
            if (checkin && checkout) {
                response = await window.lekkirStaysAPI.checkAvailability(checkin, checkout, guests);
                console.log('Availability response:', response);
                
                if (response.success && response.available) {
                    this.apartments = response.available;
                    
                    // Filter by location if provided
                    if (this.searchParams.location && this.searchParams.location !== 'Any location') {
                        this.apartments = this.apartments.filter(apt => 
                            apt.location.toLowerCase().includes(this.searchParams.location.toLowerCase())
                        );
                    }
                } else {
                    this.apartments = [];
                }
            } else {
                // No dates provided, show all apartments
                response = await window.lekkirStaysAPI.getApartments();
                console.log('All apartments response:', response);
                
                if (response.success && response.apartments) {
                    this.apartments = response.apartments;
                    
                    // Filter by location if provided
                    if (this.searchParams.location && this.searchParams.location !== 'Any location') {
                        this.apartments = this.apartments.filter(apt => 
                            apt.location.toLowerCase().includes(this.searchParams.location.toLowerCase())
                        );
                    }
                    
                    // Filter by guest count if provided
                    if (guests > 1) {
                        this.apartments = this.apartments.filter(apt => apt.maxGuests >= guests);
                    }
                } else {
                    this.apartments = [];
                }
            }

            loadingState.style.display = 'none';

            if (this.apartments.length === 0) {
                noResults.style.display = 'block';
                resultsCount.textContent = 'No apartments found';
            } else {
                if (resultsCarousel) {
                    resultsCarousel.parentElement.style.display = 'block';
                }
                resultsCount.textContent = `${this.apartments.length} apartment${this.apartments.length > 1 ? 's' : ''} found`;
                this.renderResults();
            }

        } catch (error) {
            console.error('Error loading results:', error);
            loadingState.style.display = 'none';
            noResults.style.display = 'block';
            resultsCount.textContent = 'Error loading results';
            
            // Show error message
            document.querySelector('.no-results h3').textContent = 'Error loading apartments';
            document.querySelector('.no-results p').textContent = error.message || 'Please try again later';
        }
    }

    renderResults() {
        const resultsCarousel = document.getElementById('resultsCarousel');
        resultsCarousel.innerHTML = '';

        console.log('Rendering apartments:', this.apartments.length);

        this.apartments.forEach((apartment, index) => {
            const card = this.createResultCard(apartment);
            resultsCarousel.appendChild(card);
            console.log('Added card:', apartment.name);

            // Animate card entrance with force3D to prevent blur
            gsap.from(card, {
                opacity: 0,
                x: 50,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'power2.out',
                force3D: true,
                clearProps: 'all'
            });
        });

        console.log('Total cards in carousel:', resultsCarousel.children.length);

        // Initialize Lucide icons - wait for DOM to update
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
                console.log('Icons initialized after render');
            }
        }, 200);

        // Initialize carousel navigation
        setTimeout(() => {
            this.initializeCarousel();
        }, 100);
    }

    initializeCarousel() {
        const carousel = document.getElementById('resultsCarousel');
        const prevBtn = document.getElementById('prevResultsBtn');
        const nextBtn = document.getElementById('nextResultsBtn');
        const cardWidth = 370; // 350px card + 20px gap

        // Update button states
        const updateButtons = () => {
            const scrollLeft = carousel.scrollLeft;
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;

            prevBtn.disabled = scrollLeft <= 0;
            nextBtn.disabled = scrollLeft >= maxScroll - 10;
        };

        // Initial button state
        updateButtons();

        // Previous button
        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({
                left: -cardWidth,
                behavior: 'smooth'
            });
            setTimeout(updateButtons, 300);
        });

        // Next button
        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({
                left: cardWidth,
                behavior: 'smooth'
            });
            setTimeout(updateButtons, 300);
        });

        // Update buttons on scroll
        carousel.addEventListener('scroll', updateButtons);

        // Touch/mouse drag scrolling
        let isDown = false;
        let startX;
        let scrollLeftStart;

        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            carousel.style.cursor = 'grabbing';
            startX = e.pageX - carousel.offsetLeft;
            scrollLeftStart = carousel.scrollLeft;
        });

        carousel.addEventListener('mouseleave', () => {
            isDown = false;
            carousel.style.cursor = 'grab';
        });

        carousel.addEventListener('mouseup', () => {
            isDown = false;
            carousel.style.cursor = 'grab';
        });

        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2;
            carousel.scrollLeft = scrollLeftStart - walk;
        });

        // Set cursor style
        carousel.style.cursor = 'grab';
    }

    createResultCard(apartment) {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        // Get first image or use placeholder
        const imageUrl = apartment.images?.[0] || apartment.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';
        
        // Convert apartment ID to listing number (apt-1 -> 1, apt-2 -> 2, etc.)
        const listingNumber = apartment.id.replace('apt-', '');
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${apartment.name}" class="result-image">
            <div class="result-content">
                <span class="result-category">${apartment.type || apartment.category || 'Luxury'}</span>
                <h3 class="result-title">${apartment.name}</h3>
                <div class="result-location">
                    <i data-lucide="map-pin"></i>
                    <span>${apartment.location}</span>
                </div>
                <div class="result-specs">
                    <div class="spec-item">
                        <i data-lucide="users"></i>
                        <span>${apartment.maxGuests} guests</span>
                    </div>
                    <div class="spec-item">
                        <i data-lucide="bed"></i>
                        <span>${apartment.bedrooms} bed${apartment.bedrooms > 1 ? 's' : ''}</span>
                    </div>
                    <div class="spec-item">
                        <i data-lucide="bath"></i>
                        <span>${apartment.bathrooms} bath${apartment.bathrooms > 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="result-footer">
                    <div class="result-price">
                        <span class="price-amount">₦${apartment.pricePerNight.toLocaleString()}</span>
                        <span class="price-period">per night</span>
                    </div>
                    <button class="view-details-btn" onclick="window.location.href='../listings/listing-${listingNumber}.html'">
                        View Details
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    bindEvents() {
        // Modify search button - with smooth animation
        document.getElementById('modifySearchBtn').addEventListener('click', () => {
            // Add animation before redirect
            gsap.to('#modifySearchBtn', {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut',
                onComplete: () => {
                    // Redirect to homepage search section
                    window.location.href = '../index.html#apartments';
                }
            });
        });

        // Sort functionality
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortResults(e.target.value);
        });

        // Book now button
        document.getElementById('bookNowBtn').addEventListener('click', () => {
            window.location.href = 'index.html#apartments';
        });
    }

    sortResults(sortBy) {
        switch (sortBy) {
            case 'price-low':
                this.apartments.sort((a, b) => a.pricePerNight - b.pricePerNight);
                break;
            case 'price-high':
                this.apartments.sort((a, b) => b.pricePerNight - a.pricePerNight);
                break;
            case 'guests':
                this.apartments.sort((a, b) => b.maxGuests - a.maxGuests);
                break;
            case 'recommended':
            default:
                // Keep original order
                break;
        }

        this.renderResults();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchResults();
});


// Navbar scroll effect (same as homepage)
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const scrolled = window.pageYOffset;
    
    if (scrolled > 100) {
        navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        navbar.style.backdropFilter = 'blur(15px)';
    } else {
        navbar.style.backgroundColor = 'transparent';
        navbar.style.backdropFilter = 'blur(5px)';
    }
});

// Mobile menu toggle (same as homepage)
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');

if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.contains('active');
        
        if (!isOpen) {
            navMenu.classList.add('active');
        } else {
            navMenu.classList.remove('active');
        }
    });
}
