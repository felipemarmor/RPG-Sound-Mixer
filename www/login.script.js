document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    const emailLoginForm = document.getElementById('email-login-form');
    console.log('emailLoginForm:', emailLoginForm);
    const googleLoginBtn = document.getElementById('google-login-btn');
    console.log('googleLoginBtn:', googleLoginBtn);
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const h1 = document.querySelector('.login-container h1');
    const submitButton = emailLoginForm.querySelector('button[type="submit"]');
    const pShowSignup = document.querySelector('p.toggle-form-text:not([style*="display:none"])');
    console.log('pShowSignup:', pShowSignup);
    const pShowLogin = document.querySelector('p.toggle-form-text[style*="display:none"]');
    console.log('pShowLogin:', pShowLogin);
    const backToMixerLink = document.querySelector('.back-link');
    console.log('backToMixerLink:', backToMixerLink);
    // const confirmPasswordGroup = document.getElementById('confirm-password-group'); // Initial fetch might be too early if HTML is malformed or script order issue
    // console.log('confirmPasswordGroup element (initial):', confirmPasswordGroup);
    // const passwordInput = document.getElementById('password');
    // console.log('passwordInput element (initial):', passwordInput);
    // const confirmPasswordInput = document.getElementById('confirm-password');
    // console.log('confirmPasswordInput element (initial):', confirmPasswordInput);
    const loginContainer = document.querySelector('.login-container');
    console.log('loginContainer:', loginContainer);


    // --- Toggle between Login and Sign Up ---
    // We check for confirmPasswordGroup inside the handlers now
    if (showSignupLink && showLoginLink && h1 && submitButton && pShowSignup && pShowLogin) {
        console.log('Login/Signup toggle core elements found. Attaching event listeners.');
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Show Signup link clicked');
            h1.textContent = 'Create Account';
            submitButton.textContent = 'Sign Up';
            
            console.log('Attempting to find confirm-password-group...');
            const localConfirmPasswordGroup = document.getElementById('confirm-password-group');
            console.log('localConfirmPasswordGroup found:', localConfirmPasswordGroup); // Log the element itself

            if (localConfirmPasswordGroup) {
                console.log('localConfirmPasswordGroup is TRUTHY, attempting to set display and opacity.');
                localConfirmPasswordGroup.style.display = 'block';
                console.log('confirmPasswordGroup display set to block. Current display style:', localConfirmPasswordGroup.style.display);
                setTimeout(() => {
                    localConfirmPasswordGroup.style.opacity = '1';
                    console.log('confirmPasswordGroup opacity forced to 1. Current opacity style:', localConfirmPasswordGroup.style.opacity);
                }, 50);
            } else {
                console.error('CRITICAL: confirmPasswordGroup is FALSY (null or undefined) inside showSignupLink click handler!');
                alert("CRITICAL ERROR: The 'confirm-password-group' element was NOT found by its ID when the Sign Up link was clicked. Please check the HTML ID and JavaScript.");
            }
            
            console.log('Attempting to find confirm-password input...');
            const localConfirmPasswordInput = document.getElementById('confirm-password');
            console.log('localConfirmPasswordInput found:', localConfirmPasswordInput);

            if(localConfirmPasswordInput) {
                localConfirmPasswordInput.required = true;
                console.log('confirmPasswordInput set to required');
            } else {
                console.error('CRITICAL: confirmPasswordInput is FALSY (null or undefined) inside showSignupLink click handler!');
                alert("CRITICAL ERROR: The 'confirm-password' input element was NOT found by its ID when the Sign Up link was clicked. Please check the HTML ID and JavaScript.");
            }
            pShowSignup.style.display = 'none';
            pShowLogin.style.display = 'block';
            emailLoginForm.dataset.mode = 'signup';
            console.log('Form mode set to signup');
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Show Login link clicked');
            h1.textContent = 'Login';
            submitButton.textContent = 'Login';
            const localConfirmPasswordGroup = document.getElementById('confirm-password-group');
            if (localConfirmPasswordGroup) {
                localConfirmPasswordGroup.style.display = 'none';
                console.log('confirmPasswordGroup display set to none');
            } else {
                console.error('confirmPasswordGroup NOT found inside showLoginLink click handler!');
            }
            const localConfirmPasswordInput = document.getElementById('confirm-password');
            if(localConfirmPasswordInput) {
                localConfirmPasswordInput.required = false;
                console.log('confirmPasswordInput set to not required');
            } else {
                console.error('confirmPasswordInput NOT found inside showLoginLink click handler!');
            }
            pShowSignup.style.display = 'block';
            pShowLogin.style.display = 'none';
            emailLoginForm.dataset.mode = 'login';
            console.log('Form mode set to login');
        });
    } else {
        console.error('One or more critical elements for Login/Signup toggle not found initially:',
            {showSignupLink, showLoginLink, h1, submitButton, pShowSignup, pShowLogin }
        );
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
                const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
                console.log('Attempting sign up with:', { email, password, confirmPassword });

                if (password !== confirmPassword) {
                    alert('Passwords do not match.');
                    return;
                }
                
                // Use email as username for this example, as the form doesn't have a separate username field
                const username = email;

                fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                })
                .then(response => response.json().then(data => ({ status: response.status, body: data })))
                .then(({ status, body }) => {
                    if (status === 201) {
                        alert('Sign up successful! User: ' + body.username + ' (ID: ' + body.userId + ')\nYou can now try to login.');
                        // Optionally, switch to login mode or clear form
                        if (showLoginLink) showLoginLink.click(); // Switch to login view
                        emailLoginForm.reset();
                    } else {
                        alert('Sign up failed: ' + (body.message || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error during sign up:', error);
                    alert('Sign up failed: An error occurred. Check console for details.');
                });
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

    // --- Password Visibility Toggle ---
    const togglePasswordSpans = document.querySelectorAll('.toggle-password');
    console.log('Found togglePasswordSpans:', togglePasswordSpans.length, togglePasswordSpans);
    togglePasswordSpans.forEach(span => {
        console.log('Attaching click listener to toggle span:', span);
        span.addEventListener('click', () => {
            const targetInputId = span.dataset.for;
            const targetInput = document.getElementById(targetInputId);
            console.log(`Toggle password clicked for input ID: ${targetInputId}`, targetInput);
            if (targetInput) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    span.textContent = 'H';
                    console.log(`Changed ${targetInputId} to text`);
                } else {
                    targetInput.type = 'password';
                    span.textContent = 'S';
                    console.log(`Changed ${targetInputId} to password`);
                }
            } else {
                console.error(`Target input not found for ID: ${targetInputId}`);
            }
        });
    });
});