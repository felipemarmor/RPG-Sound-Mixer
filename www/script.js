document.addEventListener('DOMContentLoaded', () => {
    // User Menu Dropdown
    const userIconBtn = document.getElementById('user-icon-btn');
    const userDropdown = document.getElementById('user-dropdown');

    if (userIconBtn && userDropdown) {
        userIconBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from bubbling to document
            userDropdown.classList.toggle('active');
        });

        // Close dropdown if clicked outside
        document.addEventListener('click', (event) => {
            if (userDropdown.classList.contains('active') && !userIconBtn.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    // Sound Mixer Controls
    const soundTiles = document.querySelectorAll('.sound-tile');
    const audioElements = {};

    // Preload sounds (assuming they are in a 'sounds' folder)
    const soundFiles = {
        rain: 'sounds/rain.mp3',
        wind: 'sounds/wind.mp3',
        city: 'sounds/city.mp3',
        battle: 'sounds/battle.mp3'
    };

    // Create Audio objects
    for (const sound in soundFiles) {
        if (soundFiles.hasOwnProperty(sound)) {
            audioElements[sound] = new Audio(soundFiles[sound]);
            audioElements[sound].loop = true;
        }
    }

    soundTiles.forEach(tile => {
        const soundName = tile.dataset.sound;
        const audio = audioElements[soundName];
        const tileMainContent = tile.querySelector('.tile-main-content');

        if (audio && tileMainContent) {
            tileMainContent.addEventListener('click', () => {
                console.log(`Tile clicked for ${soundName}. Tile class: ${tile.className}, Audio paused: ${audio.paused}, Current time: ${audio.currentTime}`);

                if (tile.classList.contains('playing')) { // If tile IS in "playing" state, user wants to STOP
                    tile.classList.remove('playing');
                    try {
                        audio.pause();
                        audio.currentTime = 0;
                    } catch (e) {
                        console.error(`Error stopping sound ${soundName}:`, e);
                    }
                } else { // If tile IS NOT in "playing" state, user wants to PLAY
                    tile.classList.add('playing');
                    try {
                        if (audio.currentTime !== 0) {
                            audio.currentTime = 0;
                        }
                        audio.play();
                    } catch (e) {
                        console.error(`Error playing sound ${soundName}:`, e);
                        tile.classList.remove('playing'); // Revert UI if play fails
                    }
                }
            });
        }

        // Volume Sliders within each tile
        const volumeSlider = tile.querySelector('.volume-slider');
        if (volumeSlider && audio) {
            // Set initial volume from slider's default value before adding event listener
            audio.volume = volumeSlider.value;

            volumeSlider.addEventListener('input', () => {
                audio.volume = volumeSlider.value;
            });
            
            // Prevent click on fader container or slider from triggering tile play/stop
            const faderContainer = tile.querySelector('.fader-container');
            if (faderContainer) {
                faderContainer.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
            }
        }
    });

    // Drag and Drop Logic
    const draggableTiles = document.querySelectorAll('.sound-tile[draggable="true"]');
    const dropSlots = document.querySelectorAll('.drop-slot');
    let draggedTile = null;

    draggableTiles.forEach(tile => {
        tile.addEventListener('dragstart', (event) => {
            draggedTile = event.target.closest('.sound-tile'); // Get the .sound-tile element
            event.dataTransfer.setData('text/plain', draggedTile.id);
            event.dataTransfer.effectAllowed = 'move';
            setTimeout(() => { // Timeout to allow browser to render drag image before style change
                draggedTile.classList.add('dragging');
            }, 0);
            console.log('Drag Start:', draggedTile.id);
        });

        tile.addEventListener('dragend', (event) => {
            // 'tile' (from the forEach loop closure) is the element that was dragged
            // and this event listener is attached to. event.target would also be this 'tile'.
            tile.classList.remove('dragging');
            // console.log(`Drag End on ${tile.id}, removed 'dragging' class.`); // More informative log

            draggedTile = null; // Reset the global draggedTile state
            
            // Clear any lingering drag-over styles from slots
            dropSlots.forEach(slot => slot.classList.remove('drag-over'));
            console.log('Drag End on tile:', tile.id); // Updated log for clarity
        });
    });

    dropSlots.forEach(slot => {
        slot.addEventListener('dragover', (event) => {
            event.preventDefault(); // Necessary to allow dropping
            slot.classList.add('drag-over');
            event.dataTransfer.dropEffect = 'move';
            // console.log('Drag Over:', slot);
        });

        slot.addEventListener('dragenter', (event) => {
            event.preventDefault();
            slot.classList.add('drag-over');
            // console.log('Drag Enter:', slot);
        });

        slot.addEventListener('dragleave', (event) => {
            // Check if the leave is not into a child element, which can happen with complex structures
            if (!slot.contains(event.relatedTarget)) {
                slot.classList.remove('drag-over');
            }
            // console.log('Drag Leave:', slot);
        });
        
        slot.addEventListener('drop', (event) => {
            event.preventDefault();
            slot.classList.remove('drag-over');
            const id = event.dataTransfer.getData('text/plain');
            const draggableElement = document.getElementById(id);

            if (draggableElement && draggedTile) { // Ensure both exist
                // If the slot is empty or we are dropping onto the original slot of the dragged item
                if (!slot.firstChild || slot === draggedTile.parentElement) {
                    slot.appendChild(draggableElement);
                } else if (slot.firstChild && slot.firstChild.classList && slot.firstChild.classList.contains('sound-tile')) {
                    // If slot has another tile, swap them
                    const existingTile = slot.firstChild;
                    const originalSlot = draggedTile.parentElement; // Slot where the dragged tile came from
                    
                    slot.appendChild(draggedTile); // Move dragged tile to new slot
                    if (originalSlot) {
                        originalSlot.appendChild(existingTile); // Move existing tile to original slot
                    } else {
                        // This case should ideally not happen if tiles always start in a slot
                        console.error("Original slot not found for dragged tile's parent.");
                    }
                } else {
                     // Fallback for other cases, e.g., slot has non-tile content (shouldn't happen here)
                    slot.innerHTML = ''; // Clear slot
                    slot.appendChild(draggableElement);
                }
                console.log('Dropped:', draggableElement.id, 'into slot');
            }
            draggedTile = null; // Reset after drop
        });
    }); // End of dropSlots.forEach

    // --- Login/Signup Overlay Logic (Moved to correct scope) ---
    const loginOverlay = document.getElementById('login-overlay');
    const loginBtnTrigger = document.getElementById('login-btn-trigger');
    const closeLoginOverlayBtn = document.getElementById('close-login-overlay');
    
    if (loginBtnTrigger && loginOverlay && closeLoginOverlayBtn) {
        loginBtnTrigger.addEventListener('click', () => {
            loginOverlay.style.display = 'flex';
            document.body.classList.add('overlay-active');
            // Also, ensure the user dropdown closes if it's open
            const userDropdown = document.getElementById('user-dropdown');
            if (userDropdown && userDropdown.classList.contains('active')) {
                userDropdown.classList.remove('active');
            }
        });
    
        closeLoginOverlayBtn.addEventListener('click', () => {
            loginOverlay.style.display = 'none';
            document.body.classList.remove('overlay-active');
        });
    
        // Close overlay if clicked outside the modal content
        loginOverlay.addEventListener('click', (event) => {
            if (event.target === loginOverlay) { // Check if the click is on the backdrop itself
                loginOverlay.style.display = 'none';
                document.body.classList.remove('overlay-active');
            }
        });
    }
    
    // Logic from login.script.js, adapted for the overlay
    const overlayEmailLoginForm = document.getElementById('email-login-form'); // This ID is in the overlay
    const overlayGoogleLoginBtn = document.getElementById('google-login-btn'); // This ID is in the overlay
    const overlayShowSignupLink = document.getElementById('show-signup'); // This ID is in the overlay
    const overlayShowLoginLink = document.getElementById('show-login');   // This ID is in the overlay
    
    if (overlayEmailLoginForm && loginOverlay) { // Ensure loginOverlay is defined here too
        const overlayH1 = loginOverlay.querySelector('.overlay-content h1');
        const overlaySubmitButton = overlayEmailLoginForm.querySelector('button[type="submit"]');
        // Query within the overlay for these paragraphs
        const overlayPSignupAnchor = loginOverlay.querySelector('.toggle-form-text a#show-signup'); // More specific
        const overlayPLoginAnchor = loginOverlay.querySelector('.toggle-form-text a#show-login');   // More specific
        const pShowSignupContainer = overlayPSignupAnchor ? overlayPSignupAnchor.closest('p') : null;
        const pShowLoginContainer = overlayPLoginAnchor ? overlayPLoginAnchor.closest('p') : null;
    
        // --- Toggle between Login and Sign Up within Overlay ---
        if (overlayShowSignupLink && overlayShowLoginLink && overlayH1 && overlaySubmitButton && pShowSignupContainer && pShowLoginContainer) {
            overlayShowSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                overlayH1.textContent = 'Create Account';
                overlaySubmitButton.textContent = 'Sign Up';
                pShowSignupContainer.style.display = 'none';
                pShowLoginContainer.style.display = 'block';
                overlayEmailLoginForm.dataset.mode = 'signup';
            });
    
            overlayShowLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                overlayH1.textContent = 'Login';
                overlaySubmitButton.textContent = 'Login';
                pShowSignupContainer.style.display = 'block';
                pShowLoginContainer.style.display = 'none';
                overlayEmailLoginForm.dataset.mode = 'login';
            });
        }
    
        // --- Email Login/Sign Up Form Submission within Overlay ---
        overlayEmailLoginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const emailInput = document.getElementById('modal-email'); // Use specific ID from overlay
            const passwordInput = document.getElementById('modal-password'); // Use specific ID from overlay
            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
            const mode = overlayEmailLoginForm.dataset.mode || 'login';
    
            if (mode === 'login') {
                console.log('Attempting login with:', { email, password });
                alert('Login functionality not yet implemented.');
            } else if (mode === 'signup') {
                console.log('Attempting sign up with:', { email, password });
                alert('Sign up functionality not yet implemented.');
            }
        });
    }
    
    // --- Google Login Button within Overlay ---
    if (overlayGoogleLoginBtn) {
        overlayGoogleLoginBtn.addEventListener('click', () => {
            console.log('Google login button clicked.');
            alert('Google Sign-In not yet implemented.');
        });
    }
});