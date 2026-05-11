// Settings Page Logic
import { 
    supabase,
    getCurrentUser,
    signOut
} from './api.js';

// Initialize settings page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Settings page loaded');
    
    try {
        await checkAuth();
        await loadUserInfo();
        initializeEventListeners();
        initializeMobileMenu();
        initializeThemeToggle();
        initializeLucideIcons();
    } catch (error) {
        console.error('Initialization error:', error);
        // Show error using custom modal
        showErrorModal('Error loading settings: ' + error.message);
    }
});

// Check authentication
async function checkAuth() {
    console.log('Checking auth...');
    
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            console.log('No user found, redirecting...');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('User authenticated:', user.email);
        
        // Display user email in sidebar
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        throw error;
    }
}

// Load user information
async function loadUserInfo() {
    try {
        const user = await getCurrentUser();
        
        if (!user) return;
        
        // Display current email
        document.getElementById('currentEmail').textContent = user.email;
        
        // Display account created date
        const createdAt = new Date(user.created_at);
        document.getElementById('accountCreated').textContent = formatDate(createdAt);
        
        // Display last sign in
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
        document.getElementById('lastSignIn').textContent = lastSignIn ? formatDate(lastSignIn) : 'Never';
        
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Send password reset button
    const sendPasswordResetBtn = document.getElementById('sendPasswordResetBtn');
    if (sendPasswordResetBtn) {
        sendPasswordResetBtn.addEventListener('click', handleSendPasswordReset);
    }
    
    // Change email form
    const changeEmailForm = document.getElementById('changeEmailForm');
    if (changeEmailForm) {
        changeEmailForm.addEventListener('submit', handleChangeEmail);
    }
    
    // Modal close buttons
    setupModalListeners();
}

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');

    // Set dynamic viewport height for mobile
    function setMobileViewportHeight() {
        const vh = window.innerHeight;
        const sidebarHeight = vh - 50;
        sidebar.style.height = `${sidebarHeight}px`;
        sidebar.style.maxHeight = `${sidebarHeight}px`;
    }

    setMobileViewportHeight();
    window.addEventListener('resize', setMobileViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setMobileViewportHeight, 100);
    });

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
}

// Handle send password reset
async function handleSendPasswordReset() {
    const submitBtn = document.getElementById('sendPasswordResetBtn');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            throw new Error('User not authenticated');
        }
        
        // Use the actual production URL for redirect
        const redirectUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/admin/dashboard.html'
            : 'https://lekki-stays-admin-2.vercel.app/admin/dashboard.html';
        
        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: redirectUrl
        });
        
        if (error) throw error;
        
        // Success
        showSuccessModal('Password reset email sent! Please check your inbox and follow the link to set a new password.');
        
    } catch (error) {
        console.error('Error sending password reset:', error);
        showErrorModal(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// Handle change email
async function handleChangeEmail(e) {
    e.preventDefault();
    
    const newEmail = document.getElementById('newEmail').value.trim();
    const submitBtn = document.getElementById('updateEmailBtn');
    
    if (!newEmail) {
        showErrorModal('Please enter a new email address.');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    try {
        // Update email
        const { error } = await supabase.auth.updateUser({
            email: newEmail
        });
        
        if (error) throw error;
        
        // Success
        showSuccessModal('Verification email sent! Please check your new email address and click the confirmation link to complete the change.');
        
        // Clear form
        document.getElementById('changeEmailForm').reset();
        
    } catch (error) {
        console.error('Error changing email:', error);
        
        let errorMessage = 'Failed to update email. Please try again.';
        
        if (error.message && error.message.includes('already registered')) {
            errorMessage = 'This email address is already in use.';
        } else if (error.message && error.message.includes('invalid')) {
            errorMessage = 'Please enter a valid email address.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showErrorModal(errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showErrorModal('Failed to logout. Please try again.');
    }
}

// Show success modal
function showSuccessModal(message) {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('successMessage');
    
    messageElement.textContent = message;
    modal.classList.add('active');
    
    lucide.createIcons();
}

// Show error modal
function showErrorModal(message) {
    const modal = document.getElementById('errorModal');
    const messageElement = document.getElementById('errorMessage');
    
    messageElement.textContent = message;
    modal.classList.add('active');
    
    lucide.createIcons();
}

// Setup modal listeners
function setupModalListeners() {
    // Success modal
    const successModal = document.getElementById('successModal');
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => {
            successModal.classList.remove('active');
        });
    }
    
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
        });
    }
    
    // Error modal
    const errorModal = document.getElementById('errorModal');
    const closeErrorModal = document.getElementById('closeErrorModal');
    const closeErrorBtn = document.getElementById('closeErrorBtn');
    
    if (closeErrorModal) {
        closeErrorModal.addEventListener('click', () => {
            errorModal.classList.remove('active');
        });
    }
    
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', () => {
            errorModal.classList.remove('active');
        });
    }
    
    // Close on overlay click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
    });
}

// Format date
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// Initialize Lucide icons
function initializeLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


// ============================================================================
// THEME TOGGLE
// ============================================================================

function initializeThemeToggle() {
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('admin-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Set active theme option
    updateThemeUI(savedTheme);
    
    // Add click handlers to theme options
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            
            // Update theme
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('admin-theme', theme);
            
            // Update UI
            updateThemeUI(theme);
            
            // Reinitialize icons after theme change
            initializeLucideIcons();
        });
    });
}

function updateThemeUI(theme) {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        if (option.dataset.theme === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}
