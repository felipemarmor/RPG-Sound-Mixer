document.addEventListener('DOMContentLoaded', () => {
    const emailLoginForm = document.getElementById('email-login-form');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const h1 = document.querySelector('.login-container h1');
    const submitButton = emailLoginForm.querySelector('button[type="submit"]');
    const pShowSignup = document.querySelector('p.toggle-form-text:not([style*="display:none"])');
    const pShowLogin = document.querySelector('p.toggle-form-text[style*="display:none"]');
    const backToMixerLink = document.querySelector('.back-link');
    const loginContainer = document.querySelector('.login-container');

    // --- Toggle between Login and Sign Up ---
    if (showSignupLink && showLoginLink && h1 && submitButton && pShowSignup && pShowLogin) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            h1.textContent = 'Create Account';
            submitButton.textContent = 'Sign Up';
            // You might want to add/remove form fields for sign-up here
            // For now, we'll just change the text
            pShowSignup.style.display = 'none';
            pShowLogin.style.display = 'block';
            emailLoginForm.dataset.mode = 'signup'; // For potential future use
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            h1.textContent = 'Login';
            submitButton.textContent = 'Login';
            pShowSignup.style.display = 'block';
            pShowLogin.style.display = 'none';
            emailLoginForm.dataset.mode = 'login'; // For potential future use
        });
    }

    // --- Email Login/Sign Up Form Submission ---
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = event.target.email.value;
            const password = event.target.password.value;
            const mode = emailLoginForm.dataset.mode || 'login';

            if (mode === 'login') {
                console.log('Attempting login with:', { email, password });
                // TODO: Implement actual login logic (e.g., API call)
                alert('Login functionality not yet implemented.');
            } else if (mode === 'signup') {
                console.log('Attempting sign up with:', { email, password });
                // TODO: Implement actual sign up logic
                alert('Sign up functionality not yet implemented.');
            }
        });
    }

    // --- Google Login Button ---
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            console.log('Google login button clicked.');
            // TODO: Implement Google Sign-In functionality
            alert('Google Sign-In not yet implemented.');
        });
    }

    // --- Back to Mixer Link Animation ---
    if (backToMixerLink && loginContainer) {
        backToMixerLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent immediate navigation
            loginContainer.classList.add('closing');

            // Wait for animation to finish before navigating
            // The animation duration is 0.3s (300ms) as defined in login.style.css
            setTimeout(() => {
                window.location.href = backToMixerLink.href;
            }, 300);
        });
    }
});