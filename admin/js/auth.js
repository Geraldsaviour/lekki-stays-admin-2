// Authentication Logic
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const loginBtn = document.getElementById('loginBtn');
const btnText = loginBtn.querySelector('.btn-text');
const btnLoader = loginBtn.querySelector('.btn-loader');

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    loginBtn.disabled = true;
    errorMessage.style.display = 'none';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Clear form fields immediately for security
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Clear password field on error for security
        document.getElementById('password').value = '';
        
        let message = 'Login failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
            message = 'Invalid email or password.';
        } else if (error.message.includes('Email not confirmed')) {
            message = 'Please confirm your email address.';
        } else if (error.message.includes('Too many requests')) {
            message = 'Too many login attempts. Please try again later.';
        } else {
            message = error.message;
        }

        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        loginBtn.disabled = false;
    }
});

// Prevent form autofill on page load
window.addEventListener('load', () => {
    // Clear form fields on page load
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    
    // Disable browser password manager suggestions
    setTimeout(() => {
        document.getElementById('email').setAttribute('readonly', 'readonly');
        document.getElementById('password').setAttribute('readonly', 'readonly');
        
        // Remove readonly after a short delay to allow user input
        setTimeout(() => {
            document.getElementById('email').removeAttribute('readonly');
            document.getElementById('password').removeAttribute('readonly');
        }, 100);
    }, 100);
});

// Clear fields when user navigates away
window.addEventListener('beforeunload', () => {
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
});

// Check if already logged in
supabase.auth.onAuthStateChanged((event, session) => {
    if (session) {
        window.location.href = 'dashboard.html';
    }
});

// Initialize Lucide icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}
