document.addEventListener('DOMContentLoaded', () => {
    // SVG Icons for password visibility - using single quotes and concatenation
    const eyeIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">' +
        '<path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>' +
        '<path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>' +
    '</svg>';
    const eyeSlashIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16">' +
        '<path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.938 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/>' +
        '<path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/>' +
    '</svg>';
    console.log('DOMContentLoaded event fired. Script starting. v2'); // v2 to confirm update
    
    const defaultUserIconContent = '👤'; // Store the default icon

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
    let soundTiles = document.querySelectorAll('.sound-tile'); // Changed to let
    const audioElements = {};
    let nextTileId = 1; // For generating unique IDs for new tiles

    // Initial sound files - changed to let
    let soundFiles = {
        rain: 'sounds/rain.mp3',
        wind: 'sounds/wind.mp3',
        city: 'sounds/city.mp3',
        battle: 'sounds/battle.mp3'
    };

    // Create initial Audio objects
    for (const sound in soundFiles) {
        if (soundFiles.hasOwnProperty(sound)) {
            audioElements[sound] = new Audio(soundFiles[sound]);
            audioElements[sound].loop = true;
        }
    }

    function initializeDragEventsForTile(tile) {
        tile.setAttribute('draggable', 'true');
        // This function will NOT clone the tile. It assumes 'tile' is the correct DOM element.

        let originalSlotForDrag = null; // Scoped to this tile's drag operation

        tile.addEventListener('dragstart', (event) => {
            // Ensure the event target is the tile itself or a child, then get the tile.
            const currentTile = event.target.closest('.sound-tile');
            if (!currentTile || currentTile !== tile) {
                // console.warn('Dragstart on unexpected target or mismatched tile.', event.target, tile);
                return;
            }

            draggedTile = currentTile; // Set the global draggedTile
            originalSlotForDrag = draggedTile.parentElement; // Store where it came from
            draggedTile.dataset.droppedSuccessfully = 'false'; // Initialize flag

            event.dataTransfer.setData('text/plain', draggedTile.id);
            event.dataTransfer.effectAllowed = 'move';
            
            setTimeout(() => {
                if (draggedTile) draggedTile.classList.add('dragging');
            }, 0);
            // console.log('Drag Start:', draggedTile.id, 'from slot:', originalSlotForDrag);
        });

        tile.addEventListener('dragend', () => {
            const tileThatWasDragged = tile; // 'tile' from the closure is the element this listener is on.
            
            tileThatWasDragged.classList.remove('dragging');

            if (tileThatWasDragged.dataset.droppedSuccessfully === 'false') {
                // console.log('Tile', tileThatWasDragged.id, 'not dropped successfully. Initiating deletion.');
                tileThatWasDragged.classList.add('tile-deleting');
                
                tileThatWasDragged.addEventListener('animationend', function handleAnimationEnd() {
                    // 'this' inside here is tileThatWasDragged
                    this.removeEventListener('animationend', handleAnimationEnd);
                    
                    const soundName = this.dataset.sound;
                    if (audioElements[soundName]) {
                        audioElements[soundName].pause();
                        audioElements[soundName].currentTime = 0;
                        // Consider if audioElements[soundName] and soundFiles[soundName] should be deleted
                        // if sounds are unique and not meant to be re-added from a palette.
                        // For now, just stopping.
                    }
                    
                    // Use the originalSlotForDrag captured at the start of this specific drag operation
                    const parentSlot = originalSlotForDrag;
                    this.remove(); // Remove the tile from DOM

                    if (parentSlot && parentSlot.classList.contains('drop-slot')) {
                        updateSlotAppearance(parentSlot);
                    }
                    soundTiles = document.querySelectorAll('.sound-tile'); // Update global list
                    // console.log('Tile', this.id, 'deleted after animation.');
                }, { once: true });
            }
            
            delete tileThatWasDragged.dataset.droppedSuccessfully; // Clean up the flag

            if (draggedTile === tileThatWasDragged) { // If this was the globally tracked draggedTile
                draggedTile = null; // Reset global draggedTile
            }
            originalSlotForDrag = null; // Reset for this tile's next potential drag

            dropSlots.forEach(s => s.classList.remove('drag-over'));
            // console.log('Drag End on tile:', tileThatWasDragged.id);
        });
        // No return needed as we are modifying the tile in place
    }

    function initializeSoundTile(tile, initialVolume = 0.5, startPlaying = false) {
        const soundName = tile.dataset.sound;
        if (!soundName) {
            console.error('Tile is missing data-sound attribute:', tile);
            return tile;
        }

        if (!audioElements[soundName] && soundFiles[soundName]) {
            audioElements[soundName] = new Audio(soundFiles[soundName]);
            audioElements[soundName].loop = true;
        } else if (!audioElements[soundName] && !soundFiles[soundName]) {
            // If a sound from a scene is no longer in soundFiles (e.g. removed from app)
            console.warn(`Sound file for ${soundName} not found. Cannot initialize audio.`);
            // Still initialize drag events for the placeholder tile
            return initializeDragEventsForTile(tile);
        }
        const audio = audioElements[soundName];

        let tileMainContent = tile.querySelector('.tile-main-content');
        if (tileMainContent) {
            const newTileMainContent = tileMainContent.cloneNode(true);
            if (tileMainContent.parentNode) {
                tileMainContent.parentNode.replaceChild(newTileMainContent, tileMainContent);
            } else {
                // This case should ideally not happen if tile is already in DOM.
                // If tile is being built before adding to DOM, this is fine.
                // console.warn("tileMainContent had no parentNode during clone replace", tile);
            }
            tileMainContent = newTileMainContent; // Update reference to the new, cloned element

            console.log(`Attaching click listener to .tile-main-content for ${soundName} (Tile ID: ${tile.id})`);
            tileMainContent.addEventListener('click', () => {
                console.log(`--- Click on .tile-main-content for ${soundName} (Tile ID: ${tile.id}) ---`);
                
                // --- MODIFIED FOR VISUAL TOGGLE ONLY (since audio files are missing) ---
                if (tile.classList.contains('playing')) {
                    console.log(`Action: Visually Stop sound ${soundName}`);
                    tile.classList.remove('playing');
                    if (audio) { // Still attempt to pause if audio object exists, but don't let failure revert UI
                        try {
                            audio.pause();
                            audio.currentTime = 0;
                        } catch (e) {
                            // console.warn(`Could not pause/reset audio for ${soundName} (expected if file missing):`, e.message);
                        }
                    }
                } else {
                    console.log(`Action: Visually Play sound ${soundName}`);
                    tile.classList.add('playing');
                    if (audio) { // Still attempt to play if audio object exists, but don't let failure revert UI
                        try {
                            if (audio.currentTime !== 0) {
                                audio.currentTime = 0;
                            }
                            // audio.play().catch(e => {
                            //     console.error(`Error playing sound ${soundName} (expected if file missing):`, e);
                            //     // DO NOT remove 'playing' class here anymore for visual testing
                            // });
                            console.log(`Audio play attempt for ${soundName} (actual sound file might be missing).`);
                        } catch (e) {
                            // console.warn(`Could not play audio for ${soundName} (expected if file missing):`, e.message);
                        }
                    }
                }
                console.log(`After click: Tile playing class? ${tile.classList.contains('playing')}.`);
                // --- END OF MODIFICATION ---
            });
        }

        let volumeSlider = tile.querySelector('.volume-slider');
        if (volumeSlider && audio) {
            audio.volume = initialVolume; // Set volume from parameter
            
            const newVolumeSlider = volumeSlider.cloneNode(true);
            volumeSlider.parentNode.replaceChild(newVolumeSlider, volumeSlider);
            volumeSlider = newVolumeSlider;
            volumeSlider.value = audio.volume;


            volumeSlider.addEventListener('input', () => {
                if (audio) audio.volume = volumeSlider.value;
            });
        }

        if (audio && startPlaying) {
            tile.classList.add('playing');
            if (audio.currentTime !== 0) audio.currentTime = 0;
            audio.play().catch(e => {
                console.error(`Error auto-playing sound ${soundName} on scene load:`, e);
                tile.classList.remove('playing');
            });
        } else if (!audio && startPlaying) {
            console.warn(`Cannot start playing ${soundName} as audio is not available.`);
        }
        
        const faderContainer = tile.querySelector('.fader-container');
        if (faderContainer) {
            // Re-cloning faderContainer might be excessive if its only job is stopPropagation
            // and it doesn't have listeners that need cleaning for *itself*.
            // However, if its children (like slider) are cloned, direct references might break.
            // For now, assume its own listener is fine.
            const newFaderContainer = faderContainer.cloneNode(true);
            faderContainer.parentNode.replaceChild(newFaderContainer, faderContainer);
            
            newFaderContainer.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
        
        initializeDragEventsForTile(tile); // Initialize drag events on the (original or child-cloned) tile
        return tile; // Return the tile that had its children potentially cloned
    }

    // Initialize existing sound tiles
    soundTiles.forEach((tile, index) => {
        const updatedTile = initializeSoundTile(tile);
        if (tile.parentNode && updatedTile !== tile) { // If tile was cloned and replaced
             // soundTiles NodeList is static, direct update isn't standard.
             // We'll re-query soundTiles after adding new ones if needed,
             // or rely on the fact that event listeners are on the correct DOM elements.
        }
    });
    
    // Drag and Drop Logic
    // const draggableTiles = document.querySelectorAll('.sound-tile[draggable="true"]'); // This is now handled by initializeDragEventsForTile
    const dropSlots = document.querySelectorAll('.drop-slot');
    let draggedTile = null;

    // --- Helper function to manage add sound icon ---
    function updateSlotAppearance(slot) {
        if (!slot || !slot.classList.contains('drop-slot')) return;

        // With the new CSS using :not(:has(> .sound-tile)) for the .add-sound-icon,
        // this function doesn't strictly need to do anything visual to the icon itself.
        // The CSS handles making the icon visible/interactive when the slot is empty.
        // We'll keep this function in case we need to toggle classes on the slot
        // for other JavaScript logic in the future (e.g., `slot.classList.toggle('is-empty', !hasSoundTile)`).
        // For now, its primary role was to add/remove the icon element, which is no longer needed.
        // console.log('updateSlotAppearance for slot:', slot.id || 'no id', 'Has tile?', !!slot.querySelector('.sound-tile'));
    }

    // Initial setup for all slots
    dropSlots.forEach(slot => updateSlotAppearance(slot));

    // The draggableTiles.forEach loop for dragstart/dragend is now removed
    // as this logic is incorporated into initializeDragEventsForTile,
    // which is called by initializeSoundTile.

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
            const droppedElement = document.getElementById(id);

            if (droppedElement && draggedTile && droppedElement === draggedTile) {
                const originalSlot = draggedTile.parentElement; // Slot the tile came from
                const targetSlot = slot; // Slot the tile is dropped onto (aliasing for clarity)
                
                const tileBeingReplaced = targetSlot.querySelector('.sound-tile');

                // Move draggedTile to targetSlot
                targetSlot.appendChild(draggedTile);
                updateSlotAppearance(targetSlot); // Update target slot (should remove icon, keep tile)

                // If there was a tile in the target slot, move it to the original slot
                if (tileBeingReplaced && tileBeingReplaced !== draggedTile) {
                    if (originalSlot && originalSlot !== targetSlot) {
                        originalSlot.appendChild(tileBeingReplaced);
                        updateSlotAppearance(originalSlot); // Update original slot
                    } else {
                        // If originalSlot is the same as targetSlot (should not happen if swapping)
                        // or if the tileBeingReplaced has nowhere to go (e.g. draggedTile came from outside a slot)
                        // This might leave tileBeingReplaced orphaned if not handled.
                        // For now, assume valid originalSlot for swaps.
                    }
                } else if (originalSlot && originalSlot !== targetSlot) {
                    // If targetSlot was empty and draggedTile came from a different slot,
                    // originalSlot is now empty or contains whatever was there before draggedTile.
                    updateSlotAppearance(originalSlot); // Update original slot (should add icon if empty)
                }
                
                console.log('Dropped:', droppedElement.id, 'into slot:', targetSlot.id || 'slot without id');
                if (draggedTile) draggedTile.dataset.droppedSuccessfully = 'true'; // Mark as successfully dropped
            }
            // Note: Global draggedTile is reset in its own 'dragend' event if the drag was not successful
            // or if it was the tile that just got its dragend event.
        });
    }); // End of dropSlots.forEach

    // --- Login/Signup Overlay Logic (Moved to correct scope) ---
    console.log('Attempting to get overlay elements...');
    const loginOverlay = document.getElementById('login-overlay');
    const loginBtnTrigger = document.getElementById('login-btn-trigger');
    const closeLoginOverlayBtn = document.getElementById('close-login-overlay');
    
    if (loginBtnTrigger && loginOverlay && closeLoginOverlayBtn) {
        console.log('Login trigger button and overlay elements FOUND. Adding event listeners.');
        loginBtnTrigger.addEventListener('click', () => {
            if (loginBtnTrigger.textContent === 'Logout') {
                // Perform Logout
                console.log('Logout button TRIGGERED!');
                loginBtnTrigger.textContent = 'Login';
                if (userIconBtn) {
                    userIconBtn.innerHTML = defaultUserIconContent; // Revert to default icon
                }
                // TODO: Clear any stored user session/token if implemented later
                alert('You have been logged out.');
                // Ensure dropdown closes if it was open due to this button
                if (userDropdown && userDropdown.classList.contains('active')) {
                    userDropdown.classList.remove('active');
                }

            } else {
                // Perform Login (Open Overlay)
                console.log('Login button TRIGGERED!');
                loginOverlay.style.display = 'flex';
                document.body.classList.add('overlay-active');
                // Also, ensure the user dropdown closes if it's open
                const localUserDropdown = document.getElementById('user-dropdown'); // Use local var to avoid conflict
                if (localUserDropdown && localUserDropdown.classList.contains('active')) {
                    localUserDropdown.classList.remove('active');
                }

                // EYE ICON SETUP (only when opening for login/signup)
                console.log('[Inside Login Trigger] Attempting to get currentLoginOverlay by ID...');
                const currentLoginOverlay = document.getElementById('login-overlay');
                console.log('[Inside Login Trigger] currentLoginOverlay value:', currentLoginOverlay);

                if (!currentLoginOverlay) {
                    console.error('[Inside Login Trigger] CRITICAL: login-overlay element itself was NOT FOUND (is null) when trying to set up eye icons!');
                    alert("Developer Alert: 'login-overlay' element not found when trying to set up eye icons. Check script.js and index.html.");
                    return;
                }
                console.log('[Inside Login Trigger] currentLoginOverlay was found. Proceeding to query for .toggle-password spans.');

                const overlayTogglePasswordSpans = currentLoginOverlay.querySelectorAll('.toggle-password');
                console.log('[Inside Login Trigger] Found overlayTogglePasswordSpans:', overlayTogglePasswordSpans.length, 'in overlay:', currentLoginOverlay, overlayTogglePasswordSpans);
                overlayTogglePasswordSpans.forEach(span => {
                    if (!span.dataset.listenerAttached) {
                        console.log('[Inside Login Trigger] Attaching click listener and setting initial icon for span:', span);
                        span.innerHTML = eyeIconSVG;
                        const initialTargetInputId = span.dataset.for;
                        const initialTargetInput = document.getElementById(initialTargetInputId);
                        if (initialTargetInput) {
                            initialTargetInput.type = 'password';
                        }

                        span.addEventListener('click', () => {
                            const targetInputId = span.dataset.for;
                            const targetInput = document.getElementById(targetInputId);
                            console.log(`Overlay toggle password clicked for input ID: ${targetInputId}`, targetInput);
                            if (targetInput) {
                                if (targetInput.type === 'password') {
                                    targetInput.type = 'text';
                                    console.log('Setting eyeSlashIconSVG for span:', span);
                                    span.innerHTML = eyeSlashIconSVG;
                                    console.log('Span innerHTML after setting slash:', span.innerHTML.substring(0, 30) + "...");
                                } else {
                                    targetInput.type = 'password';
                                    console.log('Setting eyeIconSVG for span:', span);
                                    span.innerHTML = eyeIconSVG;
                                    console.log('Span innerHTML after setting eye:', span.innerHTML.substring(0, 30) + "...");
                                }
                            } else {
                                console.error(`Overlay target input not found for ID: ${targetInputId}`);
                            }
                        });
                        span.dataset.listenerAttached = 'true';
                    }
                });
            }
        });
    
        closeLoginOverlayBtn.addEventListener('click', () => {
            console.log('Close overlay button TRIGGERED!');
            loginOverlay.style.display = 'none';
            document.body.classList.remove('overlay-active');
        });
    
        // Close overlay if clicked outside the modal content
        loginOverlay.addEventListener('click', (event) => {
            if (event.target === loginOverlay) { // Check if the click is on the backdrop itself
                console.log('Overlay backdrop CLICKED!');
                loginOverlay.style.display = 'none';
                document.body.classList.remove('overlay-active');
            }
        });
    } else {
        console.error('Login trigger button or overlay elements NOT FOUND.');
        if (!loginBtnTrigger) console.error('loginBtnTrigger is missing');
        if (!loginOverlay) console.error('loginOverlay is missing');
        if (!closeLoginOverlayBtn) console.error('closeLoginOverlayBtn is missing');
    }
    
    // Logic from login.script.js, adapted for the overlay
    const overlayEmailLoginForm = document.getElementById('email-login-form'); // This ID is in the overlay
    const overlayGoogleLoginBtn = document.getElementById('google-login-btn'); // This ID is in the overlay
    const overlayShowSignupLink = document.getElementById('show-signup'); // This ID is in the overlay
    const overlayShowLoginLink = document.getElementById('show-login');   // This ID is in the overlay
    
    if (overlayEmailLoginForm && loginOverlay) { // Ensure loginOverlay is defined here too
        console.log('Setting up email form and toggle links logic...');
        const overlayH1 = loginOverlay.querySelector('.overlay-content h1');
        const overlaySubmitButton = overlayEmailLoginForm.querySelector('button[type="submit"]');
        // Query within the overlay for these paragraphs
        const overlayPSignupAnchor = loginOverlay.querySelector('.toggle-form-text a#show-signup'); // More specific
        const overlayPLoginAnchor = loginOverlay.querySelector('.toggle-form-text a#show-login');   // More specific
        const pShowSignupContainer = overlayPSignupAnchor ? overlayPSignupAnchor.closest('p') : null;
        const pShowLoginContainer = overlayPLoginAnchor ? overlayPLoginAnchor.closest('p') : null;
    
        // --- Toggle between Login and Sign Up within Overlay ---
        if (overlayShowSignupLink && overlayShowLoginLink && overlayH1 && overlaySubmitButton && pShowSignupContainer && pShowLoginContainer) {
            console.log('Attaching toggle link event listeners.');
            overlayShowSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Show signup link CLICKED');
                overlayH1.textContent = 'Create Account';
                overlaySubmitButton.textContent = 'Sign Up';
                
                // This ID 'confirm-password-group' should now exist in index.html's overlay
                const confirmPasswordGroup = document.getElementById('confirm-password-group');
                if (confirmPasswordGroup) {
                    confirmPasswordGroup.style.display = 'block';
                    // The input ID inside this group is 'modal-confirm-password'
                    const confirmPasswordInput = document.getElementById('modal-confirm-password');
                    if (confirmPasswordInput) {
                        confirmPasswordInput.required = true;
                    } else {
                        console.error("'modal-confirm-password' input not found within confirm-password-group.");
                    }
                } else {
                    console.error("'confirm-password-group' div not found in overlay for signup mode.");
                }

                pShowSignupContainer.style.display = 'none';
                pShowLoginContainer.style.display = 'block';
                overlayEmailLoginForm.dataset.mode = 'signup';
            });
    
            overlayShowLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Show login link CLICKED');
                overlayH1.textContent = 'Login';
                overlaySubmitButton.textContent = 'Login';

                // This ID 'confirm-password-group' should now exist in index.html's overlay
                const confirmPasswordGroup = document.getElementById('confirm-password-group');
                if (confirmPasswordGroup) {
                    confirmPasswordGroup.style.display = 'none';
                     // The input ID inside this group is 'modal-confirm-password'
                    const confirmPasswordInput = document.getElementById('modal-confirm-password');
                    if (confirmPasswordInput) {
                        confirmPasswordInput.required = false;
                    } else {
                        console.error("'modal-confirm-password' input not found within confirm-password-group for login mode.");
                    }
                } else {
                    console.error("'confirm-password-group' div not found in overlay for login mode.");
                }

                pShowSignupContainer.style.display = 'block';
                pShowLoginContainer.style.display = 'none';
                overlayEmailLoginForm.dataset.mode = 'login';
            });
        } else {
            console.error('One or more elements for form toggling are missing.');
        }
    
        // --- Email Login/Sign Up Form Submission within Overlay ---
        overlayEmailLoginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log('Email form SUBMITTED.');
            // Using the correct IDs from the overlay HTML structure in index.html
            const emailInput = document.getElementById('modal-email');
            const passwordInput = document.getElementById('modal-password');
            const confirmPasswordInput = document.getElementById('modal-confirm-password');
            // The eye icon setup code block was moved into the loginBtnTrigger click listener.
            // This redundant block has been removed.

            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
            const mode = overlayEmailLoginForm.dataset.mode || 'login';
    
            if (mode === 'login') {
                console.log('Attempting login with:', { email, password });
                if (!email || !password) {
                    alert('Email and password are required for login.');
                    return;
                }

                fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }), // Send email (which server checks as email or username)
                })
                .then(response => response.json().then(data => ({ status: response.status, body: data })))
                .then(({ status, body }) => {
                    if (status === 200) {
                        alert('Login successful! Welcome back, ' + body.username + '!');
                        // TODO: Handle successful login (e.g., store user info, update UI, close overlay)
                        console.log('Login successful:', body);
                        
                        // Example: Update UI and close overlay
                        const userIconBtn = document.getElementById('user-icon-btn');
                        if (userIconBtn) {
                            userIconBtn.textContent = body.username.charAt(0).toUpperCase(); // Show first letter of username
                        }
                        const loginBtnTrigger = document.getElementById('login-btn-trigger');
                        if (loginBtnTrigger) {
                            loginBtnTrigger.textContent = 'Logout'; // Change button text
                            // TODO: Add logout functionality to this button now
                        }
                        const loginOverlay = document.getElementById('login-overlay');
                        if (loginOverlay) loginOverlay.style.display = 'none';
                        document.body.classList.remove('overlay-active');
                        overlayEmailLoginForm.reset();

                    } else {
                        alert('Login failed: ' + (body.message || 'Invalid credentials.'));
                    }
                })
                .catch(error => {
                    console.error('Error during login:', error);
                    alert('Login failed: An error occurred. Check console for details.');
                });

            } else if (mode === 'signup') {
                const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
                console.log('Attempting sign up with:', { email, password, confirmPassword });

                if (!email || !password) {
                    alert('Email and password are required for signup.');
                    return;
                }
                if (password.length < 6) {
                    alert('Password must be at least 6 characters long.');
                    return;
                }
                if (password !== confirmPassword) {
                    alert('Passwords do not match.');
                    return;
                }

                const username = email; // Using email as username as per previous logic

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
                        if (overlayShowLoginLink) overlayShowLoginLink.click(); // Switch to login view
                        overlayEmailLoginForm.reset(); // Clear the form
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
    } else {
        if (!overlayEmailLoginForm) console.error('overlayEmailLoginForm element NOT FOUND.');
        if (overlayEmailLoginForm && !loginOverlay) console.error('loginOverlay is null when trying to setup email form logic.');
    }
    
    // --- Google Login Button within Overlay ---
    if (overlayGoogleLoginBtn) {
        console.log('Attaching Google login button event listener.');
        overlayGoogleLoginBtn.addEventListener('click', () => {
            console.log('Google login button CLICKED.');
            alert('Google Sign-In not yet implemented.');
        });
    } else {
        console.error('overlayGoogleLoginBtn element NOT FOUND.');
    }

    // --- Add Sound Overlay Logic ---
    const addSoundOverlay = document.getElementById('add-sound-overlay');
    const closeAddSoundOverlayBtn = document.getElementById('close-add-sound-overlay');
    const availableSoundsList = document.getElementById('available-sounds-list');
    const soundMixerContainer = document.getElementById('sound-mixer');
    let targetSlotForNewSound = null;

    if (soundMixerContainer) {
        soundMixerContainer.addEventListener('click', (event) => {
            const clickedSlot = event.target.closest('.drop-slot');
            // Ensure the click is on an .add-sound-icon AND that its parent slot is actually empty.
            // The CSS should make the icon non-interactive if a tile is present, but this is a safeguard.
            if (event.target.classList.contains('add-sound-icon') && clickedSlot && !clickedSlot.querySelector('.sound-tile')) {
                targetSlotForNewSound = clickedSlot;
                addSoundOverlay.style.display = 'flex';
                document.body.classList.add('overlay-active');
                // console.log('Add sound icon clicked, opening overlay for slot:', targetSlotForNewSound);
            }
        });
    }

    if (closeAddSoundOverlayBtn && addSoundOverlay) {
        closeAddSoundOverlayBtn.addEventListener('click', () => {
            addSoundOverlay.style.display = 'none';
            document.body.classList.remove('overlay-active');
            targetSlotForNewSound = null;
        });
        addSoundOverlay.addEventListener('click', (event) => { // Close if backdrop clicked
            if (event.target === addSoundOverlay) {
                addSoundOverlay.style.display = 'none';
                document.body.classList.remove('overlay-active');
                targetSlotForNewSound = null;
            }
        });
    }

    if (availableSoundsList && addSoundOverlay) {
        availableSoundsList.addEventListener('click', (event) => {
            const selectedSoundItem = event.target.closest('.available-sound-item');
            if (selectedSoundItem && targetSlotForNewSound) {
                const soundName = selectedSoundItem.dataset.soundName;
                const soundSymbol = selectedSoundItem.dataset.soundSymbol;
                const soundFile = selectedSoundItem.dataset.soundFile;
                const tileId = `${soundName}-tile-${nextTileId++}`;

                // Add to soundFiles and audioElements if not already there (though typically these are new)
                if (!soundFiles[soundName]) {
                    soundFiles[soundName] = soundFile;
                }
                // Audio element creation is handled by initializeSoundTile

                // Create new tile HTML
                const newTile = document.createElement('div');
                newTile.className = 'sound-tile';
                newTile.id = tileId;
                newTile.dataset.sound = soundName;
                newTile.innerHTML = `
                    <div class="tile-main-content">
                        <span class="tile-icon">${soundSymbol}</span>
                        <h2 class="tile-label">${soundName.charAt(0).toUpperCase() + soundName.slice(1)}</h2>
                    </div>
                    <div class="fader-container tile-fader">
                        <input type="range" class="volume-slider" data-sound="${soundName}" min="0" max="1" step="0.01" value="0.5" orient="vertical">
                    </div>
                `;

                targetSlotForNewSound.appendChild(newTile);
                updateSlotAppearance(targetSlotForNewSound);
                initializeSoundTile(newTile); // Initialize its audio, events, etc.
                
                // Update the global list of sound tiles for future drag/drop operations
                // soundTiles NodeList is static. To get an updated list:
                soundTiles = document.querySelectorAll('.sound-tile'); // Re-query to include the new tile


                addSoundOverlay.style.display = 'none';
                document.body.classList.remove('overlay-active');
                targetSlotForNewSound = null;
                console.log(`Added new sound tile: ${soundName} to slot.`);
            }
        
            // --- Scene Selector Logic ---
            const sceneSelect = document.getElementById('scene-select');
            const newSceneNameInput = document.getElementById('new-scene-name');
            const saveSceneBtn = document.getElementById('save-scene-btn');
            const SCENES_STORAGE_KEY = 'rpgSoundMixerScenes';
            let savedScenes = [];
        
            function loadScenesFromLocalStorage() {
                const scenesJson = localStorage.getItem(SCENES_STORAGE_KEY);
                return scenesJson ? JSON.parse(scenesJson) : [];
            }
        
            function populateSceneDropdown() {
                // Clear existing options (except the first placeholder)
                while (sceneSelect.options.length > 1) {
                    sceneSelect.remove(1);
                }
        
                savedScenes.forEach((scene, index) => {
                    const option = document.createElement('option');
                    option.value = scene.name; // Using name as value, ensure names are unique or use index
                    option.textContent = scene.name;
                    sceneSelect.appendChild(option);
                });
            }
            
            // Initial load of scenes
            if (sceneSelect && newSceneNameInput && saveSceneBtn) {
                savedScenes = loadScenesFromLocalStorage();
                populateSceneDropdown();
                // console.log('Loaded scenes:', savedScenes);
        
                saveSceneBtn.addEventListener('click', () => {
                    const sceneName = newSceneNameInput.value.trim();
                    if (!sceneName) {
                        alert('Please enter a name for the scene.');
                        return;
                    }
        
                    const currentSceneConfig = [];
                    dropSlots.forEach((slot, index) => {
                        const tile = slot.querySelector('.sound-tile');
                        if (tile) {
                            const soundName = tile.dataset.sound;
                            const audio = audioElements[soundName];
                            currentSceneConfig.push({
                                soundName: soundName,
                                volume: audio ? audio.volume : 0.5, // Default if audio somehow not found
                                isPlaying: tile.classList.contains('playing'),
                                tileId: tile.id // Save tileId for potential future use, not strictly needed for reload
                            });
                        } else {
                            currentSceneConfig.push(null); // Placeholder for empty slot
                        }
                    });
        
                    const existingSceneIndex = savedScenes.findIndex(s => s.name === sceneName);
                    if (existingSceneIndex > -1) {
                        // For now, overwrite. Later, could ask user.
                        savedScenes[existingSceneIndex].config = currentSceneConfig;
                        console.log(`Scene "${sceneName}" overwritten.`);
                    } else {
                        savedScenes.push({ name: sceneName, config: currentSceneConfig });
                        console.log(`Scene "${sceneName}" saved.`);
                    }
        
                    localStorage.setItem(SCENES_STORAGE_KEY, JSON.stringify(savedScenes));
                    populateSceneDropdown();
                    newSceneNameInput.value = '';
                    sceneSelect.value = sceneName;
                });
        
                sceneSelect.addEventListener('change', () => {
                    const selectedSceneName = sceneSelect.value;
                    if (!selectedSceneName) return;
        
                    const sceneToLoad = savedScenes.find(s => s.name === selectedSceneName);
                    if (sceneToLoad) {
                        console.log('Loading scene:', sceneToLoad.name);
                        // 1. Clear existing tiles and stop their audio
                        dropSlots.forEach(slot => {
                            const tile = slot.querySelector('.sound-tile');
                            if (tile) {
                                const soundName = tile.dataset.sound;
                                if (audioElements[soundName]) {
                                    audioElements[soundName].pause();
                                    audioElements[soundName].currentTime = 0;
                                }
                                tile.remove();
                            }
                            updateSlotAppearance(slot); // Ensure '+' icon appears
                        });
        
                        // 2. Load new tiles from scene config
                        sceneToLoad.config.forEach((tileConfig, index) => {
                            const targetSlot = dropSlots[index];
                            if (tileConfig && targetSlot) {
                                const { soundName, volume, isPlaying, tileId: savedTileId } = tileConfig;
                                
                                // Find symbol from available sounds (or default if not found)
                                let soundSymbol = '❓';
                                const availableSoundDiv = availableSoundsList.querySelector(`.available-sound-item[data-sound-name="${soundName}"]`);
                                if (availableSoundDiv) {
                                    soundSymbol = availableSoundDiv.dataset.soundSymbol;
                                } else {
                                    // If sound is not in the "available sounds" list (e.g. an old scene with a removed sound)
                                    // we might need a placeholder or to skip. For now, use default symbol.
                                    console.warn(`Symbol for sound "${soundName}" not found in available sounds list. Using default.`);
                                }
        
        
                                const newTile = document.createElement('div');
                                newTile.className = 'sound-tile';
                                // Use a new unique ID or the saved one if it helps, but ensure uniqueness if scenes can have same sound multiple times
                                newTile.id = `${soundName}-tile-${nextTileId++}`;
                                newTile.dataset.sound = soundName;
                                newTile.innerHTML = `
                                    <div class="tile-main-content">
                                        <span class="tile-icon">${soundSymbol}</span>
                                        <h2 class="tile-label">${soundName.charAt(0).toUpperCase() + soundName.slice(1)}</h2>
                                    </div>
                                    <div class="fader-container tile-fader">
                                        <input type="range" class="volume-slider" data-sound="${soundName}" min="0" max="1" step="0.01" value="${volume}">
                                    </div>
                                `;
                                
                                targetSlot.appendChild(newTile);
                                initializeSoundTile(newTile, volume, isPlaying);
                                updateSlotAppearance(targetSlot);
                            }
                        });
                        soundTiles = document.querySelectorAll('.sound-tile'); // Update global list
                    }
                });
        
            } else {
                console.error('Scene selector elements not all found.');
            }
        
        });
    }

});