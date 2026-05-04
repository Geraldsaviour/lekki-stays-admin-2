// GSAP Animations and Advanced JavaScript
gsap.registerPlugin(ScrollTrigger, TextPlugin, ScrollToPlugin);

// Preloader functionality
window.addEventListener('load', () => {
    // Ensure page starts at top
    window.scrollTo(0, 0);
    
    const preloader = document.getElementById('preloader');
    
    // Animate preloader exit
    gsap.to(preloader, {
        opacity: 0,
        duration: 1,
        delay: 1.5,
        ease: 'power2.inOut',
        onComplete: () => {
            preloader.style.display = 'none';
            document.body.style.overflow = 'visible';
        }
    });
});

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Ensure page starts at top immediately
    window.scrollTo(0, 0);
    
    // Hide body overflow during preloader
    document.body.style.overflow = 'hidden';
    
    // Initialize all animations with delay for preloader
    setTimeout(() => {
        initializeAnimations();
        initializeInteractions();
        createFloatingParticles();
        initializeScrollAnimations();
        
        // Handle hash navigation (e.g., from search results page)
        if (window.location.hash) {
            setTimeout(() => {
                const targetId = window.location.hash.substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    const navbar = document.querySelector('.navbar');
                    const navbarHeight = navbar ? navbar.offsetHeight + 20 : 100;
                    const targetPosition = target.offsetTop - navbarHeight;
                    window.scrollTo({
                        top: Math.max(0, targetPosition),
                        behavior: 'smooth'
                    });
                }
            }, 3000); // Wait for animations to complete
        }
    }, 2500);
});

// Main animation initialization
function initializeAnimations() {
    // Set initial states
    gsap.set('.navbar', { y: -100, opacity: 0 });
    gsap.set('.hero-title', { y: 100, opacity: 0 });
    gsap.set('.hero-subtitle', { y: 50, opacity: 0 });
    gsap.set('.hero-buttons button', { y: 30, opacity: 0, scale: 0.8 });
    gsap.set('.booking-search-section', { y: 50, opacity: 0 });
    gsap.set('.booking-section-title', { y: 30, opacity: 0 });
    gsap.set('.booking-section-description', { y: 20, opacity: 0 });
    gsap.set('.booking-search-bar', { y: 40, opacity: 0, scale: 0.95 });

    // Create main timeline
    const tl = gsap.timeline({ delay: 0.5 });

    // Navbar animation
    tl.to('.navbar', {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out'
    })

    // Hero title animation
    .to('.hero-title', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power4.out'
    }, '-=0.5')

    // Subtitle animation
    .to('.hero-subtitle', {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out'
    }, '-=0.8')

    // Buttons animation
    .to('.hero-buttons button', {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)'
    }, '-=0.6')

    // Booking section animation
    .to('.booking-search-section', {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out'
    }, '-=0.4')

    // Booking section title animation
    .to('.booking-section-title', {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.6')

    // Booking section description animation
    .to('.booking-section-description', {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.5')

    // Booking search bar animation - now comes after banner is complete
    .to('.booking-search-bar', {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'back.out(1.2)'
    }, '+=0.3'); // Added delay after banner completes
}

// Scroll-triggered animations
function initializeScrollAnimations() {
    // Booking section scroll animation
    gsap.fromTo('.booking-search-section', 
        {
            y: 30,
            opacity: 0.8
        },
        {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.booking-search-section',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        }
    );

    // Parallax effect for booking section
    gsap.to('.booking-search-section', {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
            trigger: '.booking-search-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
        }
    });
}

// Interactive elements and hover effects
function initializeInteractions() {
    // Navigation hover effects
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            gsap.to(link, {
                scale: 1.05,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        link.addEventListener('mouseleave', () => {
            gsap.to(link, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Button hover effects
    const buttons = document.querySelectorAll('.primary-btn, .secondary-btn');
    buttons.forEach(button => {
        const hoverEffect = button.querySelector('.btn-hover-effect');
        
        button.addEventListener('mouseenter', () => {
            gsap.to(button, {
                scale: 1.05,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            gsap.to(hoverEffect, {
                scale: 1,
                opacity: 0.1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        button.addEventListener('mouseleave', () => {
            gsap.to(button, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            gsap.to(hoverEffect, {
                scale: 0,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Logo animation on hover
    const logo = document.querySelector('.logo-text');
    logo.addEventListener('mouseenter', () => {
        gsap.to(logo, {
            rotation: 5,
            scale: 1.1,
            duration: 0.3,
            ease: 'power2.out'
        });
    });

    logo.addEventListener('mouseleave', () => {
        gsap.to(logo, {
            rotation: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
        });
    });

    // Removed parallax effect on mouse move for better performance
}

// Performance optimization - reduce animation complexity
gsap.config({
    force3D: true,
    nullTargetWarn: false,
    autoSleep: 60
});

// Reduce particle count for better performance
function createFloatingParticles() {
    const particlesContainer = document.querySelector('.floating-particles');
    const particleCount = 20; // Reduced from 50 to 20
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particlesContainer.appendChild(particle);
        
        // Random positioning
        gsap.set(particle, {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1
        });
        
        // Floating animation
        gsap.to(particle, {
            y: '-=100',
            x: `+=${Math.random() * 100 - 50}`,
            duration: Math.random() * 10 + 10,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 5
        });
        
        // Rotation animation
        gsap.to(particle, {
            rotation: 360,
            duration: Math.random() * 20 + 10,
            repeat: -1,
            ease: 'none'
        });
    }
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const scrolled = window.pageYOffset;
    
    if (scrolled > 100) {
        gsap.to(navbar, {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(15px)',
            duration: 0.3,
            ease: 'power2.out'
        });
    } else {
        gsap.to(navbar, {
            backgroundColor: 'transparent',
            backdropFilter: 'blur(5px)',
            duration: 0.3,
            ease: 'power2.out'
        });
    }
});

// Smooth scrolling for navigation links - wrapped in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Function to get navbar height dynamically
    function getNavbarHeight() {
        const navbar = document.querySelector('.navbar');
        return navbar ? navbar.offsetHeight + 20 : 80; // Add 20px extra padding
    }
    
    // Small delay to ensure everything is loaded
    setTimeout(() => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                const target = document.querySelector(href);
                
                console.log('Navigation clicked:', href, 'Target found:', !!target);
                
                if (target) {
                    // Calculate offset for fixed navbar
                    const navbarHeight = getNavbarHeight();
                    const targetPosition = target.offsetTop - navbarHeight;
                    
                    // Use smooth scrolling with offset
                    window.scrollTo({
                        top: Math.max(0, targetPosition), // Ensure we don't scroll to negative position
                        behavior: 'smooth'
                    });
                } else {
                    console.error('Target not found for:', href);
                }
            });
        });
    }, 100);
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');

mobileToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('active');
    
    if (!isOpen) {
        navMenu.classList.add('active');
        gsap.to(navMenu, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        gsap.to('.mobile-menu-toggle span', {
            rotation: (i) => i === 0 ? 45 : i === 1 ? -45 : 0,
            y: (i) => i === 0 ? 6 : i === 1 ? -6 : 0,
            opacity: (i) => i === 2 ? 0 : 1,
            duration: 0.3,
            ease: 'power2.out'
        });
    } else {
        gsap.to(navMenu, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => navMenu.classList.remove('active')
        });
        
        gsap.to('.mobile-menu-toggle span', {
            rotation: 0,
            y: 0,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        });
    }
});

// Advanced text animation for hero title
function createTextRevealAnimation() {
    const titleLines = document.querySelectorAll('.title-line');
    
    titleLines.forEach((line, index) => {
        const text = line.textContent;
        line.innerHTML = '';
        
        [...text].forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            line.appendChild(span);
            
            gsap.from(span, {
                y: 100,
                opacity: 0,
                rotation: Math.random() * 20 - 10,
                duration: 0.8,
                ease: 'back.out(1.7)',
                delay: (index * 0.3) + (i * 0.02)
            });
        });
    });
}

// Button click animations and navigation
document.getElementById('exploreBtn').addEventListener('click', () => {
    gsap.to('#exploreBtn', {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
    });
    
    // Navigate to apartments section with navbar offset
    setTimeout(() => {
        const target = document.getElementById('apartments');
        if (target) {
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight + 20 : 80;
            const targetPosition = target.offsetTop - navbarHeight;
            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth'
            });
        }
    }, 200);
});

document.getElementById('galleryBtn').addEventListener('click', () => {
    gsap.to('#galleryBtn', {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
    });
    
    // Navigate to apartments section with navbar offset
    setTimeout(() => {
        const target = document.getElementById('apartments');
        if (target) {
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight + 20 : 80;
            const targetPosition = target.offsetTop - navbarHeight;
            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth'
            });
        }
    }, 200);
});

// Navbar Book Now button
document.getElementById('bookNowBtn').addEventListener('click', () => {
    const target = document.getElementById('apartments');
    if (target) {
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight + 20 : 80;
        const targetPosition = target.offsetTop - navbarHeight;
        window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
        });
    }
});

// Performance optimization
gsap.config({
    force3D: true,
    nullTargetWarn: false,
    autoSleep: 60
});

// Preloader animation (optional)
window.addEventListener('load', () => {
    gsap.to('.hero-overlay', {
        opacity: 0.7,
        duration: 2,
        ease: 'power2.inOut'
    });
});

// === BOOKING CALENDAR ===
class BookingCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedCheckin = null;
        this.selectedCheckout = null;
        this.isSelectingCheckin = true;
        this.adults = 1;
        this.children = 0;
        this.infants = 0;
        this.selectedLocation = '';
        
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Nigerian locations data
        this.locations = [
            {
                name: 'Lekki',
                description: 'Lagos State',
                popular: true,
                category: 'popular'
            },
            {
                name: 'Ikeja',
                description: 'Lagos State',
                popular: true,
                category: 'popular'
            },
            {
                name: 'Victoria Island',
                description: 'Lagos State',
                popular: true,
                category: 'popular'
            },
            {
                name: 'Ikoyi',
                description: 'Lagos State',
                popular: true,
                category: 'popular'
            },
            {
                name: 'Abuja',
                description: 'Federal Capital Territory',
                popular: true,
                category: 'popular'
            },
            {
                name: 'Surulere',
                description: 'Lagos State',
                popular: false,
                category: 'lagos'
            },
            {
                name: 'Yaba',
                description: 'Lagos State',
                popular: false,
                category: 'lagos'
            },
            {
                name: 'Ajah',
                description: 'Lagos State',
                popular: false,
                category: 'lagos'
            },
            {
                name: 'Gbagada',
                description: 'Lagos State',
                popular: false,
                category: 'lagos'
            },
            {
                name: 'Magodo',
                description: 'Lagos State',
                popular: false,
                category: 'lagos'
            },
            {
                name: 'Maitama',
                description: 'Abuja, FCT',
                popular: false,
                category: 'abuja'
            },
            {
                name: 'Wuse',
                description: 'Abuja, FCT',
                popular: false,
                category: 'abuja'
            },
            {
                name: 'Garki',
                description: 'Abuja, FCT',
                popular: false,
                category: 'abuja'
            },
            {
                name: 'Port Harcourt',
                description: 'Rivers State',
                popular: false,
                category: 'other'
            },
            {
                name: 'Kano',
                description: 'Kano State',
                popular: false,
                category: 'other'
            },
            {
                name: 'Ibadan',
                description: 'Oyo State',
                popular: false,
                category: 'other'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.renderCalendar();
        this.updateGuestsDisplay();
        this.renderLocationList();
        
        // Location dropdown will only open when clicked, not automatically
    }
    
    bindEvents() {
        // Location field click
        document.getElementById('locationField').addEventListener('click', () => {
            this.toggleLocationDropdown();
        });
        
        // Location search input
        document.getElementById('locationSearchInput').addEventListener('input', (e) => {
            this.filterLocations(e.target.value);
        });
        
        // Calendar field clicks
        document.getElementById('checkinField').addEventListener('click', () => {
            this.openCalendar('checkin');
        });
        
        document.getElementById('checkoutField').addEventListener('click', () => {
            this.openCalendar('checkout');
        });
        
        // Guests field click
        document.getElementById('guestsField').addEventListener('click', () => {
            this.toggleGuestsDropdown();
        });
        
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.navigateMonth(-1);
        });
        
        document.getElementById('nextMonthBtn').addEventListener('click', () => {
            this.navigateMonth(1);
        });
        
        // Clear dates
        document.getElementById('clearDatesBtn').addEventListener('click', () => {
            this.clearDates();
        });
        
        // Guests controls
        this.bindGuestsControls();
        
        // Guests close button - removed automatic closing, now only closes when clicking outside or opening another dropdown
        document.getElementById('guestsCloseBtn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.closeGuestsDropdown();
        });
        
        // Prevent guests dropdown from closing when clicking inside it
        document.getElementById('guestsDropdown').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling to document
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            const bookingContainer = e.target.closest('.booking-search-container');
            const locationDropdown = e.target.closest('#locationDropdown');
            const calendarDropdown = e.target.closest('#calendarDropdown');
            const guestsDropdown = e.target.closest('#guestsDropdown');
            
            // If clicking completely outside the booking container and all dropdowns, close everything
            if (!bookingContainer && !locationDropdown && !calendarDropdown && !guestsDropdown) {
                this.closeAllDropdowns();
                return;
            }
            
            // Only close dropdowns if clicking outside the booking area entirely
            // Individual dropdowns will only close when opening another dropdown or clicking completely outside
        });
        
        // Search button
        document.getElementById('searchButton').addEventListener('click', () => {
            this.performSearch();
        });
    }
    
    toggleLocationDropdown() {
        // Close other dropdowns when opening location dropdown
        this.closeDropdownsWithAnimation(['calendar', 'guests']);
        
        // Toggle location dropdown
        const locationDropdown = document.getElementById('locationDropdown');
        const isActive = locationDropdown.classList.contains('active');
        
        if (!isActive) {
            locationDropdown.classList.add('active');
            
            // Update field states
            document.querySelectorAll('.search-field').forEach(field => {
                field.classList.remove('active');
            });
            document.getElementById('locationField').classList.add('active');
            
            // Animate field activation
            gsap.to('#locationField', {
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                duration: 0.3,
                ease: 'power2.out'
            });
            
            // Focus search input with delay and prevent scroll
            setTimeout(() => {
                const searchInput = document.getElementById('locationSearchInput');
                searchInput.focus({ preventScroll: true });
            }, 100);
        }
    }
    
    renderLocationList(filteredLocations = null) {
        const locationList = document.getElementById('locationList');
        const locations = filteredLocations || this.locations;
        
        locationList.innerHTML = '';
        
        // Group locations
        const popularLocations = locations.filter(loc => loc.popular);
        const otherLocations = locations.filter(loc => !loc.popular);
        
        // Render popular locations
        if (popularLocations.length > 0) {
            const popularSection = this.createLocationSection('Popular Destinations', popularLocations);
            locationList.appendChild(popularSection);
        }
        
        // Render other locations
        if (otherLocations.length > 0) {
            const otherSection = this.createLocationSection('All Locations', otherLocations);
            locationList.appendChild(otherSection);
        }
        
        // Show "no results" if empty
        if (locations.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'location-item';
            noResults.innerHTML = `
                <div class="location-info">
                    <div class="location-name">No locations found</div>
                    <div class="location-description">Try a different search term</div>
                </div>
            `;
            locationList.appendChild(noResults);
        }
    }
    
    createLocationSection(title, locations) {
        const section = document.createElement('div');
        section.className = 'location-section';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'location-section-title';
        titleDiv.textContent = title;
        section.appendChild(titleDiv);
        
        locations.forEach(location => {
            const item = document.createElement('div');
            item.className = 'location-item';
            item.innerHTML = `
                <div class="location-icon">
                    <i data-lucide="map-pin"></i>
                </div>
                <div class="location-info">
                    <div class="location-name">${location.name}</div>
                    <div class="location-description">${location.description}</div>
                    ${location.popular ? '<div class="location-popular">Popular</div>' : ''}
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.selectLocation(location);
            });
            
            section.appendChild(item);
        });
        
        // Initialize Lucide icons after adding location items
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        return section;
    }
    
    selectLocation(location) {
        this.selectedLocation = location.name;
        
        // Animate the field value change
        const locationValue = document.getElementById('locationValue');
        gsap.to(locationValue, {
            scale: 1.05,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
            onComplete: () => {
                locationValue.textContent = location.name;
            }
        });
        
        // Don't automatically close the dropdown - let user click outside or open another dropdown
        
        // Clear search input
        document.getElementById('locationSearchInput').value = '';
        this.renderLocationList();
        
        // Add success feedback animation
        gsap.to('#locationField', {
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                gsap.to('#locationField', {
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }
        });
    }
    
    filterLocations(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderLocationList();
            return;
        }
        
        const filtered = this.locations.filter(location => 
            location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderLocationList(filtered);
    }
    
    bindGuestsControls() {
        // Adults
        document.getElementById('adultsDecrease').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.adults > 1) {
                this.adults--;
                this.updateGuestsDisplay();
                this.animateGuestChange('adultsCount');
            }
        });
        
        document.getElementById('adultsIncrease').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.adults < 16) {
                this.adults++;
                this.updateGuestsDisplay();
                this.animateGuestChange('adultsCount');
            }
        });
        
        // Children
        document.getElementById('childrenDecrease').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.children > 0) {
                this.children--;
                this.updateGuestsDisplay();
                this.animateGuestChange('childrenCount');
            }
        });
        
        document.getElementById('childrenIncrease').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.children < 5) {
                this.children++;
                this.updateGuestsDisplay();
                this.animateGuestChange('childrenCount');
            }
        });
        
        // Infants
        document.getElementById('infantsDecrease').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.infants > 0) {
                this.infants--;
                this.updateGuestsDisplay();
                this.animateGuestChange('infantsCount');
            }
        });
        
        document.getElementById('infantsIncrease').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.infants < 5) {
                this.infants++;
                this.updateGuestsDisplay();
                this.animateGuestChange('infantsCount');
            }
        });
    }
    
    animateGuestChange(counterId) {
        const counter = document.getElementById(counterId);
        gsap.fromTo(counter, 
            {
                scale: 1.3,
                color: '#D4AF37'
            },
            {
                scale: 1,
                color: '#333',
                duration: 0.4,
                ease: 'back.out(1.7)'
            }
        );
        
        // Animate the main guests value
        const guestsValue = document.getElementById('guestsValue');
        gsap.to(guestsValue, {
            scale: 1.05,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });
    }
    
    openCalendar(mode) {
        this.isSelectingCheckin = mode === 'checkin';
        
        // Close other dropdowns when opening calendar
        this.closeDropdownsWithAnimation(['location', 'guests']);
        
        // Show calendar dropdown
        const calendarDropdown = document.getElementById('calendarDropdown');
        calendarDropdown.classList.add('active');
        
        // Update field states
        document.querySelectorAll('.search-field').forEach(field => {
            field.classList.remove('active');
        });
        
        const activeField = mode === 'checkin' ? 'checkinField' : 'checkoutField';
        document.getElementById(activeField).classList.add('active');
        
        // Animate field activation
        gsap.to(`#${activeField}`, {
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            duration: 0.3,
            ease: 'power2.out'
        });
    }
    
    showCalendarDropdown() {
        // Close other dropdowns when opening calendar
        document.getElementById('locationDropdown').classList.remove('active');
        document.getElementById('guestsDropdown').classList.remove('active');
        document.getElementById('calendarDropdown').classList.add('active');
    }
    
    toggleGuestsDropdown() {
        // Close other dropdowns when opening guests dropdown
        this.closeDropdownsWithAnimation(['location', 'calendar']);
        
        // Toggle guests dropdown
        const guestsDropdown = document.getElementById('guestsDropdown');
        const isActive = guestsDropdown.classList.contains('active');
        
        if (!isActive) {
            guestsDropdown.classList.add('active');
            
            // Update field state
            document.querySelectorAll('.search-field').forEach(field => {
                field.classList.remove('active');
            });
            document.getElementById('guestsField').classList.add('active');
            
            // Animate field activation
            gsap.to('#guestsField', {
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }
    
    closeGuestsDropdown() {
        document.getElementById('guestsDropdown').classList.remove('active');
        document.getElementById('guestsField').classList.remove('active');
    }
    
    closeDropdownsWithAnimation(dropdownTypes) {
        dropdownTypes.forEach(type => {
            const dropdownId = type === 'location' ? 'locationDropdown' : 
                              type === 'calendar' ? 'calendarDropdown' : 'guestsDropdown';
            const dropdown = document.getElementById(dropdownId);
            
            if (dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });
        
        // Reset field backgrounds
        document.querySelectorAll('.search-field').forEach(field => {
            gsap.to(field, {
                backgroundColor: 'transparent',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    }
    
    closeAllDropdowns() {
        const dropdowns = ['locationDropdown', 'calendarDropdown', 'guestsDropdown'];
        
        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });
        
        // Reset all field states
        document.querySelectorAll('.search-field').forEach(field => {
            field.classList.remove('active');
            gsap.to(field, {
                backgroundColor: 'transparent',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    }
    
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }
    
    renderCalendar() {
        const currentMonth = new Date(this.currentDate);
        const nextMonth = new Date(this.currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Update month headers
        document.getElementById('currentMonth').textContent = 
            `${this.monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
        document.getElementById('nextMonth').textContent = 
            `${this.monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;
        
        // Render both month grids
        this.renderMonthGrid('currentMonthGrid', currentMonth);
        this.renderMonthGrid('nextMonthGrid', nextMonth);
        
        this.updateSelectedDatesDisplay();
    }
    
    renderMonthGrid(containerId, date) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        // Add weekdays header
        const weekdaysDiv = document.createElement('div');
        weekdaysDiv.className = 'calendar-weekdays';
        this.weekdays.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-weekday';
            dayDiv.textContent = day;
            weekdaysDiv.appendChild(dayDiv);
        });
        container.appendChild(weekdaysDiv);
        
        // Add days grid
        const daysDiv = document.createElement('div');
        daysDiv.className = 'calendar-days';
        
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = currentDay.getDate();
            
            // Check if day is in current month
            if (currentDay.getMonth() !== date.getMonth()) {
                dayDiv.style.opacity = '0.3';
                dayDiv.style.pointerEvents = 'none';
                daysDiv.appendChild(dayDiv);
                continue;
            }
            
            // Check if day is in the past or today (can't check in same day)
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (currentDay < tomorrow) {
                dayDiv.classList.add('disabled');
                daysDiv.appendChild(dayDiv);
                continue;
            }
            
            // Check if day is selected
            if (this.selectedCheckin && this.isSameDay(currentDay, this.selectedCheckin)) {
                dayDiv.classList.add('selected', 'range-start');
            } else if (this.selectedCheckout && this.isSameDay(currentDay, this.selectedCheckout)) {
                dayDiv.classList.add('selected', 'range-end');
            } else if (this.isInRange(currentDay)) {
                dayDiv.classList.add('in-range');
            }
            
            // Add click event
            dayDiv.addEventListener('click', () => {
                this.selectDate(currentDay);
            });
            
            daysDiv.appendChild(dayDiv);
        }
        
        container.appendChild(daysDiv);
    }
    
    selectDate(date) {
        if (this.isSelectingCheckin) {
            this.selectedCheckin = new Date(date);
            this.selectedCheckout = null;
            this.isSelectingCheckin = false;
            
            // Animate field transition
            gsap.to('#checkinField', {
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                duration: 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to('#checkinField', {
                        backgroundColor: 'transparent',
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });
            
            // Switch to checkout selection with animation
            document.getElementById('checkinField').classList.remove('active');
            document.getElementById('checkoutField').classList.add('active');
            
            gsap.to('#checkoutField', {
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                duration: 0.3,
                ease: 'power2.out'
            });
        } else {
            if (date <= this.selectedCheckin) {
                // If checkout is before checkin, reset and select as checkin
                this.selectedCheckin = new Date(date);
                this.selectedCheckout = null;
                this.isSelectingCheckin = false;
            } else {
                this.selectedCheckout = new Date(date);
                
                // Animate successful selection
                gsap.to('#checkoutField', {
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: () => {
                        gsap.to('#checkoutField', {
                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                    }
                });
                
                // Don't automatically close calendar - let user click outside or open another dropdown
            }
        }
        
        this.renderCalendar();
        this.updateDateFields();
    }
    
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }
    
    isInRange(date) {
        if (!this.selectedCheckin || !this.selectedCheckout) return false;
        return date > this.selectedCheckin && date < this.selectedCheckout;
    }
    
    updateDateFields() {
        const checkinValue = document.getElementById('checkinValue');
        const checkoutValue = document.getElementById('checkoutValue');
        
        if (this.selectedCheckin) {
            checkinValue.textContent = this.formatDate(this.selectedCheckin);
        } else {
            checkinValue.textContent = 'Add dates';
        }
        
        if (this.selectedCheckout) {
            checkoutValue.textContent = this.formatDate(this.selectedCheckout);
        } else {
            checkoutValue.textContent = 'Add dates';
        }
    }
    
    updateSelectedDatesDisplay() {
        const checkinDisplay = document.getElementById('checkinDisplay');
        const checkoutDisplay = document.getElementById('checkoutDisplay');
        
        if (this.selectedCheckin) {
            checkinDisplay.textContent = `Check-in: ${this.formatDate(this.selectedCheckin)}`;
        } else {
            checkinDisplay.textContent = '';
        }
        
        if (this.selectedCheckout) {
            checkoutDisplay.textContent = `Check-out: ${this.formatDate(this.selectedCheckout)}`;
        } else {
            checkoutDisplay.textContent = '';
        }
    }
    
    formatDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }
    
    clearDates() {
        this.selectedCheckin = null;
        this.selectedCheckout = null;
        this.isSelectingCheckin = true;
        this.renderCalendar();
        this.updateDateFields();
    }
    
    updateGuestsDisplay() {
        const guestsValue = document.getElementById('guestsValue');
        const adultsCount = document.getElementById('adultsCount');
        const childrenCount = document.getElementById('childrenCount');
        const infantsCount = document.getElementById('infantsCount');
        
        // Update counters
        adultsCount.textContent = this.adults;
        childrenCount.textContent = this.children;
        infantsCount.textContent = this.infants;
        
        // Update button states
        document.getElementById('adultsDecrease').disabled = this.adults <= 1;
        document.getElementById('adultsIncrease').disabled = this.adults >= 16;
        document.getElementById('childrenDecrease').disabled = this.children <= 0;
        document.getElementById('childrenIncrease').disabled = this.children >= 5;
        document.getElementById('infantsDecrease').disabled = this.infants <= 0;
        document.getElementById('infantsIncrease').disabled = this.infants >= 5;
        
        // Update main display
        const totalGuests = this.adults + this.children;
        let guestText = '';
        
        if (totalGuests === 1) {
            guestText = '1 guest';
        } else {
            guestText = `${totalGuests} guests`;
        }
        
        if (this.infants > 0) {
            guestText += `, ${this.infants} infant${this.infants > 1 ? 's' : ''}`;
        }
        
        guestsValue.textContent = guestText;
    }
    
    async performSearch() {
        const searchData = {
            location: this.selectedLocation || 'Any location',
            checkin: this.selectedCheckin,
            checkout: this.selectedCheckout,
            adults: this.adults,
            children: this.children,
            infants: this.infants
        };
        
        console.log('Search data:', searchData);
        
        // Validate dates before searching
        if (!searchData.checkin || !searchData.checkout) {
            // Show friendly message
            gsap.to('#searchButton', {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            });
            
            alert('Please select both check-in and check-out dates to search for available apartments.');
            return;
        }
        
        // Validate check-in is before check-out
        if (searchData.checkin >= searchData.checkout) {
            gsap.to('#searchButton', {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            });
            
            alert('Check-out date must be after check-in date. Please select valid dates.');
            return;
        }
        
        // Add search animation with loading state
        const searchBtn = document.getElementById('searchButton');
        const originalText = searchBtn.innerHTML;
        
        // Animate button press
        gsap.to(searchBtn, {
            scale: 0.95,
            duration: 0.1,
            ease: 'power2.inOut',
            onComplete: async () => {
                // Show loading state
                searchBtn.innerHTML = `
                    <i data-lucide="loader-2" class="loading-spinner"></i>
                    <span>Searching...</span>
                `;
                
                // Animate loading spinner
                gsap.to('.loading-spinner', {
                    rotation: 360,
                    duration: 1,
                    repeat: -1,
                    ease: 'none'
                });
                
                // Initialize Lucide icons for the loading spinner
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
                
                try {
                    // Perform actual search if dates are selected
                    if (searchData.checkin && searchData.checkout) {
                        const checkInStr = window.lekkirStaysAPI.formatDate(searchData.checkin);
                        const checkOutStr = window.lekkirStaysAPI.formatDate(searchData.checkout);
                        const totalGuests = searchData.adults + searchData.children;
                        
                        console.log('Sending search request:', { checkInStr, checkOutStr, totalGuests });
                        
                        const availabilityResponse = await window.lekkirStaysAPI.checkAvailability(
                            checkInStr, 
                            checkOutStr, 
                            totalGuests
                        );
                        
                        console.log('Search response:', availabilityResponse);
                        
                        if (availabilityResponse.success) {
                            console.log('Available apartments:', availabilityResponse.available);
                            
                            // Redirect to search results page with parameters
                            const params = new URLSearchParams({
                                location: searchData.location,
                                checkin: checkInStr,
                                checkout: checkOutStr,
                                guests: totalGuests
                            });
                            
                            window.location.href = `search/search-results.html?${params.toString()}`;
                            return; // Exit early since we're redirecting
                        }
                    } else {
                        // Just navigate to search results page without dates
                        const params = new URLSearchParams({
                            location: searchData.location,
                            guests: searchData.adults + searchData.children
                        });
                        
                        window.location.href = `search/search-results.html?${params.toString()}`;
                        return; // Exit early since we're redirecting
                    }
                    
                } catch (error) {
                    console.error('Search failed:', error);
                    console.error('Error details:', error.message, error.stack);
                    
                    // Reset button with error state
                    searchBtn.innerHTML = originalText;
                    
                    gsap.to(searchBtn, {
                        scale: 1,
                        backgroundColor: '#ef4444',
                        duration: 0.3,
                        ease: 'power2.out',
                        onComplete: () => {
                            setTimeout(() => {
                                gsap.to(searchBtn, {
                                    backgroundColor: '',
                                    duration: 0.5,
                                    ease: 'power2.out'
                                });
                            }, 2000);
                        }
                    });
                    
                    // Show detailed error message
                    const errorMsg = error.message || 'Unknown error occurred';
                    alert(`Search failed: ${errorMsg}\n\nPlease check:\n- Server is running\n- Dates are selected\n- Network connection`);
                }
            }
        });
    }
}

// Initialize booking calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize existing functionality first
    if (typeof initializeAnimations === 'function') {
        // Existing initialization is already called
    }
    
    // Initialize booking calendar and make it globally accessible
    window.bookingCalendar = new BookingCalendar();
});

// === FALLBACK DATA (moved to top) ===
const havenListings = [
    {
        id: 1,
        name: "Haven Lekki - Studio",
        category: "cozy homes",
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        pricePerNight: 45000,
        description: "A sleek modern studio in the heart of Lekki Phase 1. Perfect for business travelers and couples seeking luxury accommodation with easy access to Victoria Island and Ikoyi.",
        location: "15 Admiralty Way, Lekki Phase 1, Lagos",
        amenities: ["Swimming pool", "Kitchen", "Air conditioning", "WiFi", "Smart TV", "Hot water", "Security"],
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80"]
    },
    {
        id: 2,
        name: "The Metropolis Lekki - Studio",
        category: "luxury suites",
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        pricePerNight: 75000,
        description: "Luxurious two-bedroom suite in the prestigious Metropolis development. Features modern amenities and stunning city views, perfect for families and business groups.",
        location: "Plot 1415, Adetokunbo Ademola Street, Victoria Island, Lagos",
        amenities: ["Swimming pool", "Gym", "Kitchen", "WiFi", "Smart TV", "Balcony", "Concierge", "Parking"],
        images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80", 
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80", 
                "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]
    },
    {
        id: 3,
        name: "Victoria Island Penthouse",
        category: "premium stays",
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 3,
        pricePerNight: 120000,
        description: "Stunning three-bedroom penthouse with panoramic views of Lagos lagoon. Features premium finishes, spacious living areas, and exclusive access to rooftop terrace.",
        location: "1161 Memorial Drive, Victoria Island, Lagos",
        amenities: ["Swimming pool", "Kitchen", "Air conditioning", "Balcony", "Rooftop terrace", "WiFi", "Smart TV", "Gym", "Concierge"],
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80", 
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80", 
                "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]
    },
    {
        id: 4,
        name: "Ikoyi Executive Suite",
        category: "executive homes",
        maxGuests: 3,
        bedrooms: 2,
        bathrooms: 2,
        pricePerNight: 85000,
        description: "Executive two-bedroom suite in the prestigious Ikoyi district. Ideal for business executives and discerning travelers seeking sophistication and convenience.",
        location: "23 Kingsway Road, Ikoyi, Lagos",
        amenities: ["Gym", "Kitchen", "WiFi", "Parking", "Air conditioning", "Smart TV", "Security", "Workspace"],
        images: ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80", 
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]
    },
    {
        id: 5,
        name: "Surulere Modern Apartment",
        category: "modern living",
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        pricePerNight: 35000,
        description: "Contemporary two-bedroom apartment in vibrant Surulere. Great value accommodation with modern amenities and easy access to Lagos mainland attractions.",
        location: "45 Adeniran Ogunsanya Street, Surulere, Lagos",
        amenities: ["Kitchen", "WiFi", "Air conditioning", "Smart TV", "Hot water", "Security"],
        images: ["https://images.unsplash.com/photo-1556020685-ae41abfc9365?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80", 
                "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80"]
    },
    {
        id: 6,
        name: "Abuja City Center Loft",
        category: "urban lofts",
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        pricePerNight: 55000,
        description: "Stylish urban loft in the heart of Abuja's central business district. Modern design meets comfort with premium amenities and easy access to government offices.",
        location: "Plot 123, Central Business District, Abuja",
        amenities: ["Swimming pool", "Gym", "Kitchen", "WiFi", "Air conditioning", "Smart TV", "Parking"],
        images: ["https://images.unsplash.com/photo-1560185127-6ed189bf02f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", 
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80", 
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]
    },
    {
        id: 7,
        name: "Yaba Creative Space",
        category: "creative hubs",
        maxGuests: 5,
        bedrooms: 3,
        bathrooms: 2,
        pricePerNight: 65000,
        description: "Inspiring three-bedroom creative space in the tech hub of Yaba. Perfect for digital nomads, startups, and creative professionals seeking a collaborative environment.",
        location: "12 Herbert Macaulay Way, Yaba, Lagos",
        amenities: ["WiFi", "Kitchen", "Air conditioning", "Workspace", "Smart TV", "Hot water", "Security", "Co-working area"],
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80", 
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80", 
                "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]
    },
    {
        id: 8,
        name: "Ajah Beachfront Villa",
        category: "beachfront homes",
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        pricePerNight: 150000,
        description: "Luxurious four-bedroom beachfront villa with direct beach access. Perfect for large families and groups seeking a premium coastal experience with world-class amenities.",
        location: "Km 35, Lekki-Epe Expressway, Ajah, Lagos",
        amenities: ["Swimming pool", "Kitchen", "Beach access", "Balcony", "WiFi", "Air conditioning", "Smart TV", "BBQ area", "Security"],
        images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80", 
                "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=2084&q=80", 
                "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]
    }
];

// === LISTINGS SECTION ===
class PropertyListings {
    constructor() {
        this.listings = [];
        this.carouselStates = {};
        this.scrollPosition = 0;
        this.cardWidth = 370; // 350px card + 20px gap
        this.isScrolling = false;
        this.loading = false;
        // Don't call init in constructor - call it externally
    }
    
    async init() {
        await this.loadListings();
        this.renderListings();
        this.initializeCarousels();
        this.initializeScrollAnimations();
        this.initializeInfiniteScroll();
    }

    async loadListings() {
        try {
            this.loading = true;
            this.showLoadingState();
            
            const response = await window.lekkirStaysAPI.getApartments();
            
            // API returns apartments array, not data array
            if (response.success && response.apartments && response.apartments.length > 0) {
                // Map API response to expected format
                this.listings = response.apartments.map(apt => ({
                    id: apt.id,
                    name: apt.name,
                    category: apt.type || 'luxury', // API uses 'type' not 'category'
                    maxGuests: apt.maxGuests,
                    bedrooms: apt.bedrooms,
                    bathrooms: apt.bathrooms,
                    pricePerNight: apt.pricePerNight,
                    description: apt.description,
                    location: apt.location,
                    amenities: apt.amenities || [],
                    images: apt.photos || apt.images || [] // API uses 'photos' not 'images'
                }));
                console.log('Loaded apartments from API:', this.listings.length);
            } else {
                console.warn('API returned no data, using fallback listings');
                this.listings = havenListings;
            }
        } catch (error) {
            console.error('Error loading apartments, using fallback:', error);
            // Fallback to static data if API fails
            this.listings = havenListings;
        } finally {
            this.loading = false;
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        const listingsGrid = document.getElementById('listingsGrid');
        if (!listingsGrid) return;
        
        listingsGrid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading luxury apartments...</p>
            </div>
        `;
    }

    hideLoadingState() {
        const loadingState = document.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    }

    showErrorState() {
        const listingsGrid = document.getElementById('listingsGrid');
        if (!listingsGrid) return;
        
        listingsGrid.innerHTML = `
            <div class="error-state">
                <p>Unable to load apartments. Please try again later.</p>
                <button onclick="window.location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
    }
    
    updateWithSearchResults(searchResults) {
        if (searchResults && searchResults.length > 0) {
            this.listings = searchResults;
            this.renderListings();
        }
    }
    
    formatPrice(price) {
        // Format Nigerian Naira with commas
        return '₦' + price.toLocaleString('en-NG');
    }
    
    getBookingParams() {
        // Get booking data from the calendar instance
        const calendar = window.bookingCalendar;
        if (!calendar) return '';
        
        const params = new URLSearchParams();
        
        if (calendar.selectedCheckin) {
            params.set('checkin', calendar.selectedCheckin.toISOString().split('T')[0]);
        }
        
        if (calendar.selectedCheckout) {
            params.set('checkout', calendar.selectedCheckout.toISOString().split('T')[0]);
        }
        
        if (calendar.adults > 1 || calendar.children > 0 || calendar.infants > 0) {
            params.set('adults', calendar.adults);
            params.set('children', calendar.children);
            params.set('infants', calendar.infants);
        }
        
        if (calendar.selectedLocation) {
            params.set('location', calendar.selectedLocation);
        }
        
        return params.toString() ? '?' + params.toString() : '';
    }
    
    renderListings() {
        const listingsGrid = document.getElementById('listingsGrid');
        if (!listingsGrid) {
            console.error('listingsGrid element not found');
            return;
        }
        
        listingsGrid.innerHTML = '';
        
        // Create multiple copies of listings for infinite scroll effect
        const copies = 3; // Create 3 copies (12 total cards for 4 apartments)
        
        for (let copy = 0; copy < copies; copy++) {
            this.listings.forEach(listing => {
                const card = this.createPropertyCard(listing, copy);
                listingsGrid.appendChild(card);
                
                // Initialize carousel state with unique ID for each copy
                const uniqueId = `${listing.id}_${copy}`;
                const images = listing.images || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'];
                this.carouselStates[uniqueId] = {
                    currentIndex: 0,
                    totalImages: images.length
                };
            });
        }
        
        // Initialize Lucide icons after creating all property cards
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Set initial scroll position to middle copy
        setTimeout(() => {
            const initialPosition = this.cardWidth * this.listings.length;
            listingsGrid.scrollLeft = initialPosition;
            this.scrollPosition = initialPosition;
        }, 100);
    }
    
    createPropertyCard(listing, copyIndex = 0) {
        const card = document.createElement('div');
        card.className = 'property-card';
        const uniqueId = `${listing.id}_${copyIndex}`;
        card.setAttribute('data-property-id', uniqueId);
        
        // Handle both backend and frontend data formats
        const guests = listing.maxGuests || listing.guests || 1;
        const price = listing.pricePerNight || listing.price || 0;
        const amenities = listing.amenities || [];
        const images = listing.images || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'];
        
        // Convert apartment ID to listing number (apt-1 -> 1, apt-2 -> 2, etc.)
        const listingNumber = listing.id.replace('apt-', '');
        
        // Limit amenities to max 3
        const displayAmenities = amenities.slice(0, 3);
        
        card.innerHTML = `
            <div class="property-image-container">
                <img class="property-image" src="${images[0]}" alt="${listing.name}" loading="lazy">
                <div class="category-badge">${listing.category || 'Luxury'}</div>
                
                <div class="carousel-controls">
                    <button class="carousel-arrow carousel-prev" data-property-id="${uniqueId}">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <button class="carousel-arrow carousel-next" data-property-id="${uniqueId}">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>
                
                <div class="carousel-dots">
                    ${images.map((_, index) => 
                        `<div class="carousel-dot ${index === 0 ? 'active' : ''}" data-property-id="${uniqueId}" data-index="${index}"></div>`
                    ).join('')}
                </div>
            </div>
            
            <div class="property-body">
                <div class="property-content">
                    <h3 class="property-name">${listing.name}</h3>
                    
                    <div class="property-specs">
                        <span>${guests} guest${guests > 1 ? 's' : ''}</span>
                        <div class="spec-divider"></div>
                        <span>${listing.bedrooms || 1} bedroom${(listing.bedrooms || 1) > 1 ? 's' : ''}</span>
                        <div class="spec-divider"></div>
                        <span>${listing.bathrooms || 1} bathroom${(listing.bathrooms || 1) > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div class="property-amenities">
                        ${displayAmenities.map(amenity => 
                            `<span class="amenity-tag">${amenity}</span>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="property-price-row">
                    <div class="property-price">
                        <span class="price-amount">${this.formatPrice(price)}</span>
                        <span class="price-period">per night</span>
                    </div>
                    <a href="listings/listing-${listingNumber}.html${this.getBookingParams()}" class="view-details-btn">View Details</a>
                </div>
            </div>
        `;
        
        return card;
    }
    
    initializeCarousels() {
        // Bind carousel navigation events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.carousel-prev')) {
                const propertyId = e.target.closest('.carousel-prev').dataset.propertyId;
                this.navigateCarousel(propertyId, -1);
            } else if (e.target.closest('.carousel-next')) {
                const propertyId = e.target.closest('.carousel-next').dataset.propertyId;
                this.navigateCarousel(propertyId, 1);
            } else if (e.target.closest('.carousel-dot')) {
                const propertyId = e.target.closest('.carousel-dot').dataset.propertyId;
                const index = parseInt(e.target.closest('.carousel-dot').dataset.index);
                this.goToSlide(propertyId, index);
            }
        });
    }
    
    navigateCarousel(propertyId, direction) {
        const state = this.carouselStates[propertyId];
        if (!state) return;
        
        const newIndex = (state.currentIndex + direction + state.totalImages) % state.totalImages;
        this.goToSlide(propertyId, newIndex);
    }
    
    goToSlide(propertyId, index) {
        const state = this.carouselStates[propertyId];
        if (!state || index === state.currentIndex) return;
        
        const card = document.querySelector(`[data-property-id="${propertyId}"]`);
        if (!card) return;
        
        const image = card.querySelector('.property-image');
        const dots = card.querySelectorAll('.carousel-dot');
        
        // Get original listing data (remove copy suffix)
        const originalId = propertyId.split('_')[0];
        const listing = this.listings.find(l => l.id === parseInt(originalId));
        
        if (!listing || !image) return;
        
        // Update image with fade transition
        gsap.to(image, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.inOut',
            onComplete: () => {
                image.src = listing.images[index];
                gsap.to(image, {
                    opacity: 1,
                    duration: 0.2,
                    ease: 'power2.inOut'
                });
            }
        });
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        // Update state
        state.currentIndex = index;
    }
    
    initializeScrollAnimations() {
        // Simplified scroll animations for better performance
        gsap.fromTo('.listings-section', 
            {
                y: 30,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.listings-section',
                    start: 'top 80%',
                    toggleActions: 'play none none none',
                    once: true // Only animate once for performance
                }
            }
        );
        
        // Simplified property card animation
        gsap.fromTo('.property-card', 
            {
                y: 40,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.listings-grid',
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                    once: true // Only animate once for performance
                }
            }
        );
    }
    
    initializeInfiniteScroll() {
        const scrollLeft = document.getElementById('scrollLeft');
        const scrollRight = document.getElementById('scrollRight');
        const listingsGrid = document.getElementById('listingsGrid');
        
        if (!scrollLeft || !scrollRight || !listingsGrid) return;
        
        // Smooth scroll function with infinite loop
        const smoothScroll = (direction) => {
            if (this.isScrolling) return;
            
            this.isScrolling = true;
            const currentScroll = listingsGrid.scrollLeft;
            const targetScroll = currentScroll + (direction * this.cardWidth);
            
            // Animate scroll with GSAP for smooth transition
            gsap.to(listingsGrid, {
                scrollLeft: targetScroll,
                duration: 0.6,
                ease: 'power2.out',
                onComplete: () => {
                    this.checkInfiniteLoop(listingsGrid);
                    this.isScrolling = false;
                }
            });
        };
        
        scrollLeft.addEventListener('click', () => {
            smoothScroll(-1);
            
            // Add click animation
            gsap.to(scrollLeft, {
                scale: 0.9,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            });
        });
        
        scrollRight.addEventListener('click', () => {
            smoothScroll(1);
            
            // Add click animation
            gsap.to(scrollRight, {
                scale: 0.9,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            });
        });
        
        // Handle manual scrolling for infinite loop
        listingsGrid.addEventListener('scroll', () => {
            if (!this.isScrolling) {
                this.checkInfiniteLoop(listingsGrid);
            }
        });
        
        // Remove arrow visibility logic since it's infinite
        // Arrows are always visible and functional
    }
    
    checkInfiniteLoop(listingsGrid) {
        const totalWidth = listingsGrid.scrollWidth;
        const containerWidth = listingsGrid.clientWidth;
        const currentScroll = listingsGrid.scrollLeft;
        const sectionWidth = this.cardWidth * this.listings.length;
        
        // If scrolled to the beginning, jump to middle section
        if (currentScroll <= 0) {
            listingsGrid.scrollLeft = sectionWidth;
        }
        // If scrolled to the end, jump to middle section
        else if (currentScroll >= totalWidth - containerWidth - 10) {
            listingsGrid.scrollLeft = sectionWidth;
        }
    }
}

// Initialize property listings when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize property listings after a delay to ensure other animations complete
    setTimeout(async () => {
        window.propertyListings = new PropertyListings();
        await window.propertyListings.init();
    }, 100);
});

// Contact form functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form-container');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const phone = contactForm.querySelector('input[type="tel"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            // Create WhatsApp message
            const whatsappMessage = `Hello LuxStay! 

New Contact Form Submission:
Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}

Please get back to me. Thank you!`;
            
            const encodedMessage = encodeURIComponent(whatsappMessage);
            const whatsappUrl = `https://wa.me/2349039269846?text=${encodedMessage}`;
            
            // Open WhatsApp
            window.open(whatsappUrl, '_blank');
            
            // Show success message
            alert('Thank you for your message! We will get back to you soon.');
            
            // Reset form
            contactForm.reset();
        });
    }
});
// Services section functionality
document.addEventListener('DOMContentLoaded', function() {
    // Service request buttons
    const serviceButtons = document.querySelectorAll('.service-btn');
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceCard = this.closest('.service-card');
            const serviceTitle = serviceCard.querySelector('.service-title').textContent;
            const servicePrice = serviceCard.querySelector('.service-price').textContent;
            
            // Create WhatsApp message for service request
            const message = `Hello LuxStay! I would like to request the following service:

Service: ${serviceTitle}
Pricing: ${servicePrice}

Please provide more details and availability.

Thank you!`;
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/2349039269846?text=${encodedMessage}`;
            
            // Open WhatsApp
            window.open(whatsappUrl, '_blank');
        });
    });
    
    // Contact Concierge button
    const contactConciergeBtn = document.getElementById('contactConcierge');
    if (contactConciergeBtn) {
        contactConciergeBtn.addEventListener('click', function() {
            const message = `Hello LuxStay Concierge!

I would like to speak with your concierge team about arranging special services for my stay.

Please contact me to discuss my requirements.

Thank you!`;
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/2349039269846?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }
    
    // View All Services button
    const viewAllServicesBtn = document.getElementById('viewAllServices');
    if (viewAllServicesBtn) {
        viewAllServicesBtn.addEventListener('click', function() {
            // Scroll to top of services section
            const servicesSection = document.getElementById('services');
            if (servicesSection) {
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight + 20 : 80;
                const targetPosition = servicesSection.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // Add hover animations to service cards
    const serviceCards = document.querySelectorAll('.service-card, .amenity-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (typeof gsap !== 'undefined') {
                gsap.to(this, {
                    scale: 1.02,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (typeof gsap !== 'undefined') {
                gsap.to(this, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });
    });
});