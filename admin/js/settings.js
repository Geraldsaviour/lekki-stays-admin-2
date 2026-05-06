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
        initializeLucideIcons();
    } catch (error) {
        console.error('Initialization error:', error);
        // Show error but don't redirect immediately
        alert('Error loading settings: ' + error.message);
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
    
    // Password toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                icon.setAttribute('data-lucide', 'eye');
            }
            
            lucide.createIcons();
        });
    });
    
    // Password strength indicator
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
    }
    
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
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

// Update password strength indicator
function updatePasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthBar = document.querySelector('.strength-bar-fill');
    const strengthText = document.querySelector('.strength-text span');
    
    if (!password) {
        strengthBar.className = 'strength-bar-fill';
        strengthText.textContent = '-';
        strengthText.className = '';
        return;
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // Determine strength level
    let level = 'weak';
    if (strength >= 4) level = 'strong';
    else if (strength >= 2) level = 'medium';
    
    strengthBar.className = `strength-bar-fill ${level}`;
    strengthText.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    strengthText.className = level;
}

// Handle change password
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('updatePasswordBtn');
    const errorElement = document.getElementById('passwordError');
    
    // Clear previous errors
    errorElement.classList.remove('show');
    errorElement.textContent = '';
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        errorElement.classList.add('show');
        return;
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
        errorElement.textContent = 'Password must be at least 8 characters long';
        errorElement.classList.add('show');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    try {
        // First, verify current password by attempting to sign in
        const user = await getCurrentUser();
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });
        
        if (signInError) {
            throw new Error('Current password is incorrect');
        }
        
        // Update password
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        
        // Success
        showSuccessModal('Password updated successfully! Please sign in again with your new password.');
        
        // Clear form
        document.getElementById('changePasswordForm').reset();
        updatePasswordStrength();
        
        // Sign out after 2 seconds
        setTimeout(async () => {
            await signOut();
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error changing password:', error);
        showErrorModal(error.message || 'Failed to update password. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// Handle change email
async function handleChangeEmail(e) {
    e.preventDefault();
    
    const newEmail = document.getElementById('newEmail').value;
    const password = document.getElementById('emailPassword').value;
    const submitBtn = document.getElementById('updateEmailBtn');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    try {
        // Verify current password
        const user = await getCurrentUser();
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: password
        });
        
        if (signInError) {
            throw new Error('Current password is incorrect');
        }
        
        // Update email
        const { error } = await supabase.auth.updateUser({
            email: newEmail
        });
        
        if (error) throw error;
        
        // Success
        showSuccessModal('Verification email sent! Please check your new email address and click the confirmation link.');
        
        // Clear form
        document.getElementById('changeEmailForm').reset();
        
    } catch (error) {
        console.error('Error changing email:', error);
        
        let errorMessage = 'Failed to update email. Please try again.';
        
        if (error.message.includes('already registered')) {
            errorMessage = 'This email address is already in use.';
        } else if (error.message.includes('invalid')) {
            errorMessage = 'Please enter a valid email address.';
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
