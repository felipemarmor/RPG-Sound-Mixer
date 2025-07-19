document.addEventListener('DOMContentLoaded', () => {
    // All setup code will be wrapped in an async function to ensure proper order
    async function init() {
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
        const baseUrl = 'http://localhost:3001';
        let currentUserId = null;
        let currentUsername = null;
        let allAvailableSounds = []; // Cache for all sounds

        // Scene saving UI elements
        const newSceneNameInput = document.getElementById('new-scene-name');
        const saveSceneBtn = document.getElementById('save-scene-btn');
        const sceneSelect = document.getElementById('scene-select');

        function updateSceneControlsAvailability() {
               const isLoggedIn = !!currentUserId;
               if (newSceneNameInput) newSceneNameInput.disabled = !isLoggedIn;
               if (saveSceneBtn) saveSceneBtn.disabled = !isLoggedIn;
               if (sceneSelect) {
                   sceneSelect.disabled = !isLoggedIn;
                   if (!isLoggedIn) {
                       sceneSelect.innerHTML = '<option value="">- Login to see scenes -</option>';
                   }
               }
               const addNewSoundBtn = document.getElementById('add-new-sound-btn');
               if (addNewSoundBtn) {
                   addNewSoundBtn.style.display = isLoggedIn ? 'block' : 'none';
               }
               const connectSpotifyBtn = document.getElementById('connect-spotify-btn');
               if (connectSpotifyBtn) {
                   connectSpotifyBtn.style.display = isLoggedIn ? 'block' : 'none';
               }
           }

        function populateSceneDropdownFromServer(scenesFromServer) {
                if (!sceneSelect) return;
                
                const currentSelectedValue = sceneSelect.value; 
                
                sceneSelect.innerHTML = '<option value="">- Select a Server Scene -</option>'; 
                if (scenesFromServer && scenesFromServer.length > 0) {
                    scenesFromServer.forEach(scene => {
                        const option = document.createElement('option');
                        option.value = scene.scene_id; 
                        option.textContent = scene.scene_name;
                        sceneSelect.appendChild(option);
                    });
                    // Try to reselect previous value if it's a scene_id from the server
                    if (scenesFromServer.find(s => s.scene_id && s.scene_id.toString() === currentSelectedValue)) {
                        sceneSelect.value = currentSelectedValue;
                    }
                } else if (currentUserId) { // Only show "No server scenes" if logged in
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "- No server scenes found -";
                    option.disabled = true;
                    sceneSelect.appendChild(option);
                }
            }

        async function fetchUserScenesFromServer(userId) {
                if (!userId) {
                    populateSceneDropdownFromServer([]); // Clear server scenes from dropdown
                    updateSceneControlsAvailability(); // Ensure UI reflects logged-out state
                    return;
                }
                console.log(`Fetching server scenes for user ID: ${userId}`);
                try {
                    const response = await fetch(`${baseUrl}/api/scenes?userId=${userId}`);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch server scenes.' }));
                        console.error('Error fetching server scenes:', response.status, errorData.message);
                        populateSceneDropdownFromServer([]); // Clear dropdown on error
                        return;
                    }
                    const scenes = await response.json();
                    console.log('Fetched server scenes:', scenes);
                    populateSceneDropdownFromServer(scenes);
                } catch (error) {
                    console.error('Network error fetching server scenes:', error);
                    populateSceneDropdownFromServer([]); // Clear dropdown on network error
                }
                updateSceneControlsAvailability(); // Update controls like disabled states after fetch
            }
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

       // Spotify Integration
       const spotifyClientId = '4b196ec84f8140709c59cff50dc13d96';
       const spotifyRedirectUri = window.location.origin.includes('ngrok') ? 'https://70c4c84c63f8.ngrok-free.app/callback' : 'http://localhost:3001/callback';

       function connectToSpotify() {
           if (!currentUserId) {
               alert('Please log in before connecting to Spotify.');
               return;
           }

           // Generate a random state for CSRF protection
           const state = Math.random().toString(36).substring(2, 15);
           
           // Store the state and associate it with the user ID
           const statePayload = { state, userId: currentUserId };
           const encodedState = btoa(JSON.stringify(statePayload)); // Base64 encode

           localStorage.setItem('spotify_auth_state', state);

           const scopes = [
               'streaming',
               'user-read-email',
               'user-read-private',
               'user-modify-playback-state'
           ].join(' ');

           const authUrl = `https://accounts.spotify.com/authorize?` +
               `response_type=code` +
               `&client_id=${spotifyClientId}` +
               `&scope=${encodeURIComponent(scopes)}` +
               `&redirect_uri=${encodeURIComponent(spotifyRedirectUri)}` +
               `&state=${encodedState}`;

           window.location.href = authUrl;
       }

       const connectSpotifyBtn = document.getElementById('connect-spotify-btn');
       if (connectSpotifyBtn) {
           connectSpotifyBtn.addEventListener('click', connectToSpotify);
       }

       // Sound Mixer Controls
       let spotifyPlayer;
       let spotifyDeviceId;

       async function getAccessToken() {
           if (!currentUserId) return null;
           try {
               const response = await fetch(`${baseUrl}/api/spotify-token?userId=${currentUserId}`);
               if (!response.ok) return null;
               const data = await response.json();
               return data.accessToken;
           } catch (error) {
               console.error('Error fetching access token:', error);
               return null;
           }
       }

       window.onSpotifyWebPlaybackSDKReady = async () => {
           const token = await getAccessToken();
           if (!token) {
               console.log('Could not initialize Spotify player, no access token.');
               return;
           }

           spotifyPlayer = new Spotify.Player({
               name: 'RPG Sound Mixer',
               getOAuthToken: cb => { cb(token); },
               volume: 0.5
           });

           // Error handling
           spotifyPlayer.addListener('initialization_error', ({ message }) => { console.error(message); });
           spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error(message); });
           spotifyPlayer.addListener('account_error', ({ message }) => { console.error(message); });
           spotifyPlayer.addListener('playback_error', ({ message }) => { console.error(message); });

           // Playback status updates
           spotifyPlayer.addListener('player_state_changed', state => {
               if (!state) {
                   return;
               }
               const currentTrack = state.track_window.current_track;
               const trackName = currentTrack.name;
               const artistName = currentTrack.artists.map(artist => artist.name).join(', ');
               const albumArt = currentTrack.album.images[0].url;
               const isPaused = state.paused;

               const spotifyTile = document.querySelector('.spotify-tile');
               if (spotifyTile) {
                   spotifyTile.querySelector('.spotify-track-name').textContent = trackName;
                   spotifyTile.querySelector('.spotify-track-artist').textContent = artistName;
                   spotifyTile.querySelector('.spotify-album-art').src = albumArt;
                   spotifyTile.querySelector('.spotify-play-pause-btn').textContent = isPaused ? '▶️' : '⏸️';
               }
           });

           // Ready
           spotifyPlayer.addListener('ready', ({ device_id }) => {
               console.log('Ready with Device ID', device_id);
               spotifyDeviceId = device_id;
           });

           // Not Ready
           spotifyPlayer.addListener('not_ready', ({ device_id }) => {
               console.log('Device ID has gone offline', device_id);
           });

           // Connect to the player!
           spotifyPlayer.connect();
       };

       async function playOnSpotify(spotifyUri) {
           if (!spotifyDeviceId) {
               alert('Spotify player is not ready. Please try again.');
               return;
           }
           const token = await getAccessToken();
           fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
               method: 'PUT',
               body: JSON.stringify({ uris: [spotifyUri] }),
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}`
               },
           });
       }

       async function searchSpotify(query) {
           const token = await getAccessToken();
           if (!token) return [];
           const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
               headers: {
                   'Authorization': `Bearer ${token}`
               }
           });
           const data = await response.json();
           return data.tracks.items;
       }

        let soundTiles = document.querySelectorAll('.sound-tile'); // Changed to let
        const audioElements = {};
        let nextTileId = 1; // For generating unique IDs for new tiles

       const defaultSounds = {
           rain: { file: 'sounds/Light Rain.mp3', icon: '🌧️' },
           wind: { file: 'sounds/Wind Sound.mp3', icon: '🌬️' },
           city: { file: 'sounds/city sound.mp3', icon: '🏙️' },
           battle: { file: 'sounds/Medieval Battle Sound.mp3', icon: '⚔️' },
           forest: { file: 'sounds/Forest Sound.mp3', icon: '🌲' },
           campfire: { file: 'sounds/Campfire Sound.mp3', icon: '🔥' },
           tavern: { file: 'sounds/Tavern Sound.mp3', icon: '🍺' },
           cave: { file: 'sounds/Cave Sound.mp3', icon: '🦇' }
       };

        // Audio objects will now be created on demand by initializeSoundTile

        function initializeDragEventsForTile(tile) {
            tile.setAttribute('draggable', 'true');
            let originalSlotForDrag = null; 

            tile.addEventListener('dragstart', (event) => {
                if (event.target.classList.contains('volume-slider') ||
                    (event.target.closest && event.target.closest('.fader-container'))) {
                    event.preventDefault();
                    event.stopPropagation(); 
                    return;
                }
                
                draggedTile = tile; 
                originalSlotForDrag = draggedTile.parentElement; 
                draggedTile.dataset.droppedSuccessfully = 'false'; 

                event.dataTransfer.setData('text/plain', draggedTile.id);
                event.dataTransfer.effectAllowed = 'move';
                
                setTimeout(() => {
                    if (draggedTile) draggedTile.classList.add('dragging');
                }, 0);
            });

            tile.addEventListener('dragend', () => {
                const tileThatWasDragged = tile; 
                
                tileThatWasDragged.classList.remove('dragging');

                if (tileThatWasDragged.dataset.droppedSuccessfully === 'false') {
                    tileThatWasDragged.classList.add('tile-deleting');
                    
                    tileThatWasDragged.addEventListener('animationend', function handleAnimationEnd() {
                        this.removeEventListener('animationend', handleAnimationEnd);
                        
                        const soundName = this.dataset.sound;
                        if (audioElements[soundName]) {
                            audioElements[soundName].pause();
                            audioElements[soundName].currentTime = 0;
                        }
                        
                        const parentSlot = originalSlotForDrag;
                        this.remove(); 

                        if (parentSlot && parentSlot.classList.contains('drop-slot')) {
                            parentSlot.classList.remove('spotify-large');
                            updateSlotAppearance(parentSlot);
                        }
                        soundTiles = document.querySelectorAll('.sound-tile'); 
                    }, { once: true });
                }
                
                delete tileThatWasDragged.dataset.droppedSuccessfully; 

                if (draggedTile === tileThatWasDragged) { 
                    draggedTile = null; 
                }
                originalSlotForDrag = null; 

                dropSlots.forEach(s => s.classList.remove('drag-over'));
            });
        }

        function initializeSoundTile(tile, initialVolume = 0.5, startPlaying = false) {
            const closeBtn = tile.querySelector('.close-tile-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tile.remove();
                });
            }
            const soundName = tile.dataset.sound;
            if (!soundName) {
                console.error('Tile is missing data-sound attribute:', tile);
                return tile;
            }

           const soundData = allAvailableSounds.find(s => s.sound_name === soundName);
           if (!audioElements[soundName] && soundData) {
               audioElements[soundName] = new Audio(soundData.file_path);
               audioElements[soundName].loop = true;
           } else if (!soundData) {
               console.warn(`Sound data for ${soundName} not found. Cannot initialize audio.`);
               return initializeDragEventsForTile(tile);
           }
            const audio = audioElements[soundName];

            let tileMainContent = tile.querySelector('.tile-main-content');
            if (tileMainContent) {
                const newTileMainContent = tileMainContent.cloneNode(true);
                if (tileMainContent.parentNode) {
                    tileMainContent.parentNode.replaceChild(newTileMainContent, tileMainContent);
                }
                tileMainContent = newTileMainContent; 

                tileMainContent.addEventListener('click', () => {
                    if (tile.classList.contains('playing')) {
                        tile.classList.remove('playing');
                        if (audio) { 
                            try {
                                audio.pause();
                                audio.currentTime = 0;
                            } catch (e) {
                            }
                        }
                    } else {
                        tile.classList.add('playing');
                        if (audio) { 
                            try {
                                if (audio.currentTime !== 0) {
                                    audio.currentTime = 0;
                                }
                                audio.play().catch(e => {
                                    console.error(`Error playing sound ${soundName}:`, e);
                                    tile.classList.remove('playing');
                                });
                            } catch (e) {
                                console.warn(`Could not play audio for ${soundName} due to an exception:`, e.message);
                                tile.classList.remove('playing'); 
                            }
                        }
                    }
                });
            }

            let volumeSlider = tile.querySelector('.volume-slider');
            if (volumeSlider && audio) {
                audio.volume = initialVolume; 
                
                const newVolumeSlider = volumeSlider.cloneNode(true);
                volumeSlider.parentNode.replaceChild(newVolumeSlider, volumeSlider);
                volumeSlider = newVolumeSlider;
                volumeSlider.value = audio.volume;


                volumeSlider.addEventListener('input', () => {
                    const newVolume = parseFloat(volumeSlider.value);
                    if (audio) {
                        audio.volume = newVolume;
                    } else {
                        console.warn(`Cannot change volume for ${soundName}: audio object not found.`);
                    }
                });

                volumeSlider.addEventListener('mousedown', (event) => {
                    event.stopPropagation();
                });
                volumeSlider.addEventListener('touchstart', (event) => {
                    event.stopPropagation();
                }, { passive: true });

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
                const newFaderContainer = faderContainer.cloneNode(true);
                faderContainer.parentNode.replaceChild(newFaderContainer, faderContainer);
                
                newFaderContainer.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
            }
            
            initializeDragEventsForTile(tile); 
            return tile; 
        }

        // Drag and Drop Logic
        const dropSlots = document.querySelectorAll('.drop-slot');
        let draggedTile = null;

        function updateSlotAppearance(slot) {
            if (!slot || !slot.classList.contains('drop-slot')) return;
        }

        dropSlots.forEach(slot => updateSlotAppearance(slot));

        dropSlots.forEach(slot => {
            slot.addEventListener('dragover', (event) => {
                event.preventDefault(); 
                slot.classList.add('drag-over');
                event.dataTransfer.dropEffect = 'move';
            });

            slot.addEventListener('dragenter', (event) => {
                event.preventDefault();
                slot.classList.add('drag-over');
            });

            slot.addEventListener('dragleave', (event) => {
                if (!slot.contains(event.relatedTarget)) {
                    slot.classList.remove('drag-over');
                }
            });

            slot.addEventListener('drop', (event) => {
                event.preventDefault();
                slot.classList.remove('drag-over');
                const id = event.dataTransfer.getData('text/plain');
                const droppedElement = document.getElementById(id);

                if (droppedElement && draggedTile && droppedElement === draggedTile) {
                    const originalSlot = draggedTile.parentElement; 
                    const targetSlot = slot; 
                    
                    const tileBeingReplaced = targetSlot.querySelector('.sound-tile');

                    targetSlot.appendChild(draggedTile);
                    updateSlotAppearance(targetSlot); 

                    if (tileBeingReplaced && tileBeingReplaced !== draggedTile) {
                        if (originalSlot && originalSlot !== targetSlot) {
                            originalSlot.appendChild(tileBeingReplaced);
                            updateSlotAppearance(originalSlot); 
                        }
                    } else if (originalSlot && originalSlot !== targetSlot) {
                        updateSlotAppearance(originalSlot); 
                    }
                    
                    if (draggedTile) draggedTile.dataset.droppedSuccessfully = 'true'; 
                }
            });
        }); 

        // --- Login/Signup Overlay Logic ---
        const loginOverlay = document.getElementById('login-overlay');
        const loginBtnTrigger = document.getElementById('login-btn-trigger');
        const closeLoginOverlayBtn = document.getElementById('close-login-overlay');
        
        if (loginBtnTrigger && loginOverlay && closeLoginOverlayBtn) {
            loginBtnTrigger.addEventListener('click', () => {
                if (loginBtnTrigger.textContent === 'Logout') {
                    currentUserId = null;
                    currentUsername = null;
                    loginBtnTrigger.textContent = 'Login';
                    if (userIconBtn) {
                        userIconBtn.innerHTML = defaultUserIconContent; 
                    }
                    if (newSceneNameInput) newSceneNameInput.disabled = true;
                    if (saveSceneBtn) saveSceneBtn.disabled = true;
                    fetchUserScenesFromServer(null); 
                    alert('You have been logged out.');
                    if (userDropdown && userDropdown.classList.contains('active')) {
                        userDropdown.classList.remove('active');
                    }

                } else {
                    loginOverlay.style.display = 'flex';
                    document.body.classList.add('overlay-active');
                    const localUserDropdown = document.getElementById('user-dropdown'); 
                    if (localUserDropdown && localUserDropdown.classList.contains('active')) {
                        localUserDropdown.classList.remove('active');
                    }

                    const currentLoginOverlay = document.getElementById('login-overlay');

                    if (!currentLoginOverlay) {
                        console.error('CRITICAL: login-overlay element itself was NOT FOUND!');
                        alert("Developer Alert: 'login-overlay' element not found.");
                        return;
                    }

                    const overlayTogglePasswordSpans = currentLoginOverlay.querySelectorAll('.toggle-password');
                    overlayTogglePasswordSpans.forEach(span => {
                        if (!span.dataset.listenerAttached) {
                            span.innerHTML = eyeIconSVG;
                            const initialTargetInputId = span.dataset.for;
                            const initialTargetInput = document.getElementById(initialTargetInputId);
                            if (initialTargetInput) {
                                initialTargetInput.type = 'password';
                            }

                            span.addEventListener('click', () => {
                                const targetInputId = span.dataset.for;
                                const targetInput = document.getElementById(targetInputId);
                                if (targetInput) {
                                    if (targetInput.type === 'password') {
                                        targetInput.type = 'text';
                                        span.innerHTML = eyeSlashIconSVG;
                                    } else {
                                        targetInput.type = 'password';
                                        span.innerHTML = eyeIconSVG;
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
                loginOverlay.style.display = 'none';
                document.body.classList.remove('overlay-active');
            });
        
            loginOverlay.addEventListener('click', (event) => {
                if (event.target === loginOverlay) { 
                    loginOverlay.style.display = 'none';
                    document.body.classList.remove('overlay-active');
                }
            });
        } else {
            console.error('Login trigger button or overlay elements NOT FOUND.');
        }
        
        const overlayEmailLoginForm = document.getElementById('email-login-form'); 
        const overlayGoogleLoginBtn = document.getElementById('google-login-btn'); 
        const overlayShowSignupLink = document.getElementById('show-signup'); 
        const overlayShowLoginLink = document.getElementById('show-login');   
        
        if (overlayEmailLoginForm && loginOverlay) { 
            const overlayH1 = loginOverlay.querySelector('.overlay-content h1');
            const overlaySubmitButton = overlayEmailLoginForm.querySelector('button[type="submit"]');
            const overlayPSignupAnchor = loginOverlay.querySelector('.toggle-form-text a#show-signup'); 
            const overlayPLoginAnchor = loginOverlay.querySelector('.toggle-form-text a#show-login');   
            const pShowSignupContainer = overlayPSignupAnchor ? overlayPSignupAnchor.closest('p') : null;
            const pShowLoginContainer = overlayPLoginAnchor ? overlayPLoginAnchor.closest('p') : null;
        
            if (overlayShowSignupLink && overlayShowLoginLink && overlayH1 && overlaySubmitButton && pShowSignupContainer && pShowLoginContainer) {
                overlayShowSignupLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    overlayH1.textContent = 'Create Account';
                    overlaySubmitButton.textContent = 'Sign Up';
                    
                    const confirmPasswordGroup = document.getElementById('confirm-password-group');
                    if (confirmPasswordGroup) {
                        confirmPasswordGroup.style.display = 'block';
                        const confirmPasswordInput = document.getElementById('modal-confirm-password');
                        if (confirmPasswordInput) {
                            confirmPasswordInput.required = true;
                        } else {
                            console.error("'modal-confirm-password' input not found.");
                        }
                    } else {
                        console.error("'confirm-password-group' div not found.");
                    }

                    pShowSignupContainer.style.display = 'none';
                    pShowLoginContainer.style.display = 'block';
                    overlayEmailLoginForm.dataset.mode = 'signup';
                });
        
                overlayShowLoginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    overlayH1.textContent = 'Login';
                    overlaySubmitButton.textContent = 'Login';

                    const confirmPasswordGroup = document.getElementById('confirm-password-group');
                    if (confirmPasswordGroup) {
                        confirmPasswordGroup.style.display = 'none';
                        const confirmPasswordInput = document.getElementById('modal-confirm-password');
                        if (confirmPasswordInput) {
                            confirmPasswordInput.required = false;
                        } else {
                            console.error("'modal-confirm-password' input not found.");
                        }
                    } else {
                        console.error("'confirm-password-group' div not found.");
                    }

                    pShowSignupContainer.style.display = 'block';
                    pShowLoginContainer.style.display = 'none';
                    overlayEmailLoginForm.dataset.mode = 'login';
                });
            } else {
                console.error('One or more elements for form toggling are missing.');
            }
        
            overlayEmailLoginForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const emailInput = document.getElementById('modal-email');
                const passwordInput = document.getElementById('modal-password');
                const confirmPasswordInput = document.getElementById('modal-confirm-password');

                const email = emailInput ? emailInput.value : '';
                const password = passwordInput ? passwordInput.value : '';
                const mode = overlayEmailLoginForm.dataset.mode || 'login';
        
                if (mode === 'login') {
                    if (!email || !password) {
                        alert('Email and password are required for login.');
                        return;
                    }

                    fetch(`${baseUrl}/api/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }), 
                    })
                    .then(response => response.json().then(data => ({ status: response.status, body: data })))
                    .then(async ({ status, body }) => {
                        if (status === 200) {
                            currentUserId = body.userId; 
                            currentUsername = body.username; 
                            
                            if (userIconBtn) {
                                userIconBtn.textContent = currentUsername.charAt(0).toUpperCase();
                            }
                            if (loginBtnTrigger) {
                                loginBtnTrigger.textContent = 'Logout';
                            }
                            
                            updateSceneControlsAvailability(); 
                            fetchUserScenesFromServer(currentUserId); 
                            await updateAllSoundsCache(); 

                            const loginOverlay = document.getElementById('login-overlay');
                            if (loginOverlay) loginOverlay.style.display = 'none';
                            document.body.classList.remove('overlay-active');
                            overlayEmailLoginForm.reset();
                            alert('Login successful! Welcome back, ' + currentUsername + '!');

                        } else {
                            currentUserId = null; 
                            currentUsername = null;
                            alert('Login failed: ' + (body.message || 'Invalid credentials.'));
                            updateSceneControlsAvailability(); 
                        }
                    })
                    .catch(error => {
                        console.error('Error during login:', error);
                        alert('Login failed: An error occurred. Check console for details.');
                    });

                } else if (mode === 'signup') {
                    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

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

                    const username = email; 

                    fetch(`${baseUrl}/api/signup`, {
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
                            if (overlayShowLoginLink) overlayShowLoginLink.click(); 
                            overlayEmailLoginForm.reset(); 
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
        }
        
        if (overlayGoogleLoginBtn) {
            overlayGoogleLoginBtn.addEventListener('click', () => {
                alert('Google Sign-In not yet implemented.');
            });
        } else {
            console.error('overlayGoogleLoginBtn element NOT FOUND.');
        }
function resetAddSoundModal() {
            const addSoundOverlay = document.getElementById('add-sound-overlay');
            const availableSoundsList = document.getElementById('available-sounds-list');
            const spotifySection = document.getElementById('spotify-sound-section');
            const spotifyEmbedContainer = document.getElementById('spotify-embed-container');
            const uploadSoundSection = document.getElementById('upload-sound-section');

            if (addSoundOverlay) {
                addSoundOverlay.style.display = 'none';
            }
            document.body.classList.remove('overlay-active');
            targetSlotForNewSound = null;

            if (availableSoundsList) {
                availableSoundsList.style.display = 'grid';
            }
            if (spotifySection) {
                spotifySection.style.display = 'none';
            }
            if (spotifyEmbedContainer) {
                spotifyEmbedContainer.innerHTML = '';
            }
            if (uploadSoundSection) {
                uploadSoundSection.style.display = 'none';
            }
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
                if (event.target.classList.contains('add-sound-icon') && clickedSlot && !clickedSlot.querySelector('.sound-tile')) {
                    targetSlotForNewSound = clickedSlot;
                    fetchAndPopulateSounds(); 
                    addSoundOverlay.style.display = 'flex';
                    document.body.classList.add('overlay-active');
                }
            });
        }

        if (closeAddSoundOverlayBtn && addSoundOverlay) {
            closeAddSoundOverlayBtn.addEventListener('click', resetAddSoundModal);
            addSoundOverlay.addEventListener('click', (event) => {
                if (event.target === addSoundOverlay) {
                    resetAddSoundModal();
                }
            });
        }

        async function updateAllSoundsCache() {
            const defaultSoundData = Object.keys(defaultSounds).map(key => ({
                sound_name: key,
                file_path: defaultSounds[key].file,
                icon: defaultSounds[key].icon,
                is_default: true
            }));

            let userSounds = [];
            if (currentUserId) {
                try {
                    const response = await fetch(`${baseUrl}/api/sounds?userId=${currentUserId}`);
                    if (response.ok) {
                        const serverSounds = await response.json();
                        userSounds = serverSounds.filter(s => s.user_id === currentUserId);
                    } else {
                        console.error('Failed to fetch user sounds');
                    }
                } catch (error) {
                    console.error('Error fetching user sounds:', error);
                }
            }
            allAvailableSounds = [...defaultSoundData, ...userSounds];
        }

       function populateSoundSelectorFromCache() {
           const defaultSounds = allAvailableSounds.filter(s => s.is_default);
           const userSounds = allAvailableSounds.filter(s => !s.is_default);
 
           availableSoundsList.innerHTML = '';

           const diceRollerOption = document.createElement('div');
           diceRollerOption.className = 'available-sound-item dice-roller-option';
           diceRollerOption.innerHTML = `
                <span class="tile-icon">🎲</span>
                <span class="tile-label">Dice Roller</span>
           `;
           availableSoundsList.appendChild(diceRollerOption);
 
           const appendSoundItems = (sounds) => {
               sounds.forEach(sound => {
                   const soundItem = document.createElement('div');
                   soundItem.className = 'available-sound-item';
                   soundItem.dataset.soundName = sound.sound_name;
                   soundItem.dataset.soundSymbol = sound.icon;
                   soundItem.dataset.soundFile = sound.file_path;
 
                   soundItem.innerHTML = `
                       <span class="tile-icon">${sound.icon}</span>
                       <span class="tile-label">${sound.sound_name}</span>
                   `;
 
                   if (!sound.is_default && sound.user_id === currentUserId) {
                       const deleteBtn = document.createElement('button');
                       deleteBtn.className = 'delete-sound-btn';
                       deleteBtn.innerHTML = '&times;';
                       deleteBtn.dataset.soundId = sound.sound_id;
                       soundItem.appendChild(deleteBtn);
                   }
                   availableSoundsList.appendChild(soundItem);
               });
           };
 
           const defaultHeader = document.createElement('h3');
           defaultHeader.className = 'sounds-list-header';
           defaultHeader.textContent = 'Default Sounds';
           availableSoundsList.appendChild(defaultHeader);
           appendSoundItems(defaultSounds);
 
           if (userSounds.length > 0) {
               const customHeader = document.createElement('h3');
               customHeader.className = 'sounds-list-header';
               customHeader.textContent = 'Custom Sounds';
               availableSoundsList.appendChild(customHeader);
               appendSoundItems(userSounds);
           }
       }

       async function fetchAndPopulateSounds() {
            await updateAllSoundsCache();
            populateSoundSelectorFromCache();
       }

       if (addSoundOverlay) {
           const addNewSoundBtn = document.getElementById('add-new-sound-btn');
           const uploadSoundSection = document.getElementById('upload-sound-section');
           
           if (addNewSoundBtn) {
               addNewSoundBtn.addEventListener('click', () => {
                   uploadSoundSection.style.display = uploadSoundSection.style.display === 'none' ? 'block' : 'none';
               });
           }
       }

        if (availableSoundsList && addSoundOverlay) {
            availableSoundsList.addEventListener('click', (event) => {
               const diceRollerOption = event.target.closest('.dice-roller-option');
               if (diceRollerOption) {
                   if (targetSlotForNewSound) {
                       addDiceRollerTile(targetSlotForNewSound);
                       resetAddSoundModal();
                   }
                   return;
               }
        function addSpotifyTile(targetSlot) {
            const tileId = `spotify-tile-${nextTileId++}`;
            const newTile = document.createElement('div');
            newTile.className = 'sound-tile spotify-tile';
            newTile.id = tileId;
            newTile.dataset.sound = 'spotify';
            newTile.innerHTML = `
                <button class="close-spotify-btn">&times;</button>
                <div class="spotify-player-container">
                    <div class="spotify-track-info">
                        <img src="Images/Spotify Icon.png" alt="Album Art" class="spotify-album-art">
                        <div class="spotify-track-details">
                            <div class="spotify-track-name">Player Ready</div>
                            <div class="spotify-track-artist">Select a song to play</div>
                        </div>
                    </div>
                    <div class="spotify-player-controls">
                        <button class="spotify-prev-btn">⏮</button>
                        <button class="spotify-play-pause-btn">▶️</button>
                        <button class="spotify-next-btn">⏭</button>
                    </div>
                </div>
            `;
            targetSlot.appendChild(newTile);
            targetSlot.classList.add('spotify-large');
            updateSlotAppearance(targetSlot);

            const closeBtn = newTile.querySelector('.close-spotify-btn');
            closeBtn.addEventListener('click', () => {
                const parentSlot = newTile.parentElement;
                if (spotifyPlayer) {
                    spotifyPlayer.pause();
                }
                newTile.remove();
                if (parentSlot && parentSlot.classList.contains('drop-slot')) {
                    parentSlot.classList.remove('spotify-large');
                    updateSlotAppearance(parentSlot);
                }
            });

            const playPauseBtn = newTile.querySelector('.spotify-play-pause-btn');
            playPauseBtn.addEventListener('click', () => {
                spotifyPlayer.togglePlay();
            });

            const prevBtn = newTile.querySelector('.spotify-prev-btn');
            prevBtn.addEventListener('click', () => {
                spotifyPlayer.previousTrack();
            });

            const nextBtn = newTile.querySelector('.spotify-next-btn');
            nextBtn.addEventListener('click', () => {
                spotifyPlayer.nextTrack();
            });

            initializeDragEventsForTile(newTile);
            soundTiles = document.querySelectorAll('.sound-tile');
        }

        function addDiceRollerTile(targetSlot) {
            const tileId = `dice-roller-${nextTileId++}`;
            const newTile = document.createElement('div');
            newTile.className = 'sound-tile dice-roller-tile';
            newTile.id = tileId;
            newTile.dataset.sound = 'dice-roller';
            newTile.innerHTML = `
                <button class="close-tile-btn">&times;</button>
                <div class="dice-roller-header">Dice Roller</div>
                <div id="dice-result-display-${tileId}" class="dice-result-display">0</div>
                <div class="dice-buttons">
                    <button class="dice-btn" data-sides="4">d4</button>
                    <button class="dice-btn" data-sides="6">d6</button>
                    <button class="dice-btn" data-sides="8">d8</button>
                    <button class="dice-btn" data-sides="10">d10</button>
                    <button class="dice-btn" data-sides="12">d12</button>
                    <button class="dice-btn" data-sides="20">d20</button>
                </div>
            `;
            targetSlot.appendChild(newTile);
            updateSlotAppearance(targetSlot);

            const diceButtons = newTile.querySelectorAll('.dice-btn');
            const diceResultDisplay = newTile.querySelector(`#dice-result-display-${tileId}`);
            const diceSound = new Audio('sounds/dice sound effect.mp3');

            diceButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    diceSound.currentTime = 0;
                    diceSound.play();
                    const sides = parseInt(button.dataset.sides, 10);
                    const result = Math.floor(Math.random() * sides) + 1;
                    diceResultDisplay.textContent = result;
                });
            });

            initializeDragEventsForTile(newTile);
            soundTiles = document.querySelectorAll('.sound-tile');
        }

               if (event.target.classList.contains('delete-sound-btn')) {
                   const soundId = event.target.dataset.soundId;
                   if (confirm('Are you sure you want to delete this sound?')) {
                       fetch(`${baseUrl}/api/sounds/${soundId}`, {
                           method: 'DELETE',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ userId: currentUserId })
                       })
                       .then(response => response.json())
                       .then(data => {
                           if (data.message === 'Sound deleted successfully.') {
                               fetchAndPopulateSounds();
                           } else {
                               alert('Error deleting sound: ' + data.message);
                           }
                       });
                   }
                   return;
               }

                const selectedSoundItem = event.target.closest('.available-sound-item');
                if (selectedSoundItem && targetSlotForNewSound) {
                    const soundName = selectedSoundItem.dataset.soundName;
                    const soundSymbol = selectedSoundItem.dataset.soundSymbol;
                    const soundFile = selectedSoundItem.dataset.soundFile;
                    const tileId = `${soundName}-tile-${nextTileId++}`;

                    const newTile = document.createElement('div');
                    newTile.className = 'sound-tile';
                    newTile.id = tileId;
                    newTile.dataset.sound = soundName;
                    newTile.innerHTML = `
                        <button class="close-tile-btn">&times;</button>
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
                    initializeSoundTile(newTile);
                    soundTiles = document.querySelectorAll('.sound-tile');

                    addSoundOverlay.style.display = 'none';
                    document.body.classList.remove('overlay-active');
                    targetSlotForNewSound = null;
                }
            });
        }

       const uploadSoundForm = document.getElementById('upload-sound-form');
       if (uploadSoundForm) {
           uploadSoundForm.addEventListener('submit', function(event) {
               event.preventDefault();
               const formData = new FormData(this);

               fetch(`${baseUrl}/api/sounds/upload/${currentUserId}`, { 
                   method: 'POST',
                   body: formData
               })
               .then(response => response.json())
               .then(data => {
                   if (data.soundId) {
                       alert('Upload successful!');
                       fetchAndPopulateSounds();
                       document.getElementById('upload-sound-section').style.display = 'none';
                       this.reset();
                   } else {
                       alert('Upload failed: ' + data.message);
                   }
               })
               .catch(error => {
                   console.error('Error uploading sound:', error);
                   alert('An error occurred during upload.');
               });
           });
       }
    const emojiPickerBtn = document.getElementById('emoji-picker-btn');
    const soundIconInput = document.getElementById('sound-icon-input');
    const emojiPickerModal = document.getElementById('emoji-picker-modal');
    const closeEmojiPickerBtn = document.getElementById('close-emoji-picker');
    const emojiPickerList = document.querySelector('.emoji-picker-list');

    if (emojiPickerBtn && soundIconInput && emojiPickerModal && closeEmojiPickerBtn && emojiPickerList) {
        const emojis = [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
            '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
            '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
            '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷',
            '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻',
            '😼', '😽', '🙀', '😿', '😾', '🤲', '👐', '🙌', '👏', '🤝', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌',
            '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🦶', '🦵', '🦿',
            '💄', '💋', '👄', '🦷', '👅', '👂', '🦻', '👃', '👣', '👁️', '👀', '🧠', '🫀', '🫁', '🦴', '👤', '👥', '🗣️', '🫂', '👶', '👧',
            '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱', '👩‍🦰', '🧑‍🦰', '👨‍🦰', '👱‍♀️', '👱', '👱‍♂️', '👩‍🦳', '🧑‍🦳', '👨‍🦳', '👩‍🦲', '🧑‍🦲', '👨‍🦲', '🧔‍♀️',
            '🧔', '🧔‍♂️', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳', '👳‍♂️', '🧕', '👮‍♀️', '👮', '👮‍♂️', '👷‍♀️', '👷', '👷‍♂️', '💂‍♀️', '💂', '💂‍♂️', '🕵️‍♀️',
            '🕵️', '🕵️‍♂️', '👩‍⚕️', '🧑‍⚕️', '👨‍⚕️', '👩‍🌾', '🧑‍🌾', '👨‍🌾', '👩‍🍳', '🧑‍🍳', '👨‍🍳', '👩‍🎓', '🧑‍🎓', '👨‍🎓', '👩‍🎤', '🧑‍🎤', '👨‍🎤', '👩‍🏫', '🧑‍🏫', '👨‍🏫',
            '👩‍🏭', '🧑‍🏭', '👨‍🏭', '👩‍💻', '🧑‍💻', '👨‍💻', '👩‍💼', '🧑‍💼', '👨‍💼', '👩‍🔧', '🧑‍🔧', '👨‍🔧', '👩‍🔬', '🧑‍🔬', '👨‍🔬', '👩‍🎨', '🧑‍🎨', '👨‍🎨',
            '👩‍🚒', '🧑‍🚒', '👨‍🚒', '👩‍✈️', '🧑‍✈️', '👨‍✈️', '👩‍🚀', '🧑‍🚀', '👨‍🚀', '👩‍⚖️', '🧑‍⚖️', '👨‍⚖️', '👰‍♀️', '👰', '👰‍♂️', '🤵‍♀️', '🤵', '🤵‍♂️',
            '👸', '🤴', '🦸‍♀️', '🦸', '🦸‍♂️', '🦹‍♀️', '🦹', '🦹‍♂️', '🤶', '🧑‍🎄', '🎅', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛',
            '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '👼', '🤰', '🤱', '👩‍🍼', '🧑‍🍼', '👨‍🍼',
            '🙇‍♀️', '🙇', '🙇‍♂️', '💁‍♀️', '💁', '💁‍♂️', '🙅‍♀️', '🙅', '🙅‍♂️', '🙆‍♀️', '🙆', '🙆‍♂️', '🙋‍♀️', '🙋', '🙋‍♂️', '🧏‍♀️', '🧏', '🧏‍♂️', '🤦‍♀️',
            '🤦', '🤦‍♂️', '🤷‍♀️', '🤷', '🤷‍♂️', '🙎‍♀️', '🙎', '🙎‍♂️', '🙍‍♀️', '🙍', '🙍‍♂️', '💇‍♀️', '💇', '💇‍♂️', '💆‍♀️', '💆', '💆‍♂️', '🧖‍♀️', '🧖',
            '🧖‍♂️', '💅', '🤳', '💃', '🕺', '👯‍♀️', '👯', '👯‍♂️', '🕴️', '👩‍🦽', '🧑‍🦽', '👨‍🦽', '👩‍🦼', '🧑‍🦼', '👨‍🦼', '🚶‍♀️', '🚶', '🚶‍♂️',
            '👩‍🦯', '🧑‍🦯', '👨‍🦯', '🧎‍♀️', '🧎', '🧎‍♂️', '🏃‍♀️', '🏃', '🏃‍♂️', '🧍‍♀️', '🧍', '🧍‍♂️', '👫', '👭', '👬', '👩‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👨',
            '👩‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '👨‍❤️‍💋‍👨', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧',
            '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👦‍👦', '👩‍👧‍👧', '👨‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👦‍👦', '👨‍👧‍👧',
            '🪢', '🧶', '🧵', '🧥', '🥼', '🦺', '👚', '👕', '👖', '🩲', '🩳', '👔', '👗', '👙', '🩱', '👘', '🥻', '🩴', '🥿', '👠',
            '👡', '👢', '👞', '👟', '🥾', '🧦', '🧤', '🧣', '🎩', '🧢', '👒', '🎓', '⛑️', '🪖', '👑', '💍', '👝', '👛', '👜', '💼',
            '🎒', '🧳', '👓', '🕶️', '🥽', '🌂', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷',
            '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦢', '🦅', '🦉', '🦤', '🪶', '🦇',
            '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢',
            '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓',
            '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐',
            '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉',
            '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗',
            '🪳', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴',
            '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎',
            '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦',
            '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟',
            '🍕', '🌭', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪',
            '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫',
            '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃',
            '🫗', '🥤', '🧋', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪', '🫙', '🏺', '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭',
            '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡',
            '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍',
            '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃',
            '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖',
            '🚗', '🚘', '🚙', '🛻', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️',
            '🛢️', '⛽', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂',
            '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️', '🕰️', '🕛', '🕧', '🕐',
            '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚',
            '🕦', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌡️', '☀️', '🌝', '🌞', '🪐', '⭐', '🌟',
            '🌠', '🌌', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔', '⛱️',
            '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊', '🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎',
            '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾', '🥎', '🏀', '🏐',
            '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '⛸️', '🎣', '🤿', '🎽', '🎿',
            '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', '🪄', '🧿', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅', '🪆', '♠️', '♥️', '♦️',
            '♣️', '♟️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '🪢', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖',
            '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '🩴', '👠', '👡', '👢', '👞', '👟', '🥾', '🧢', '👒',
            '🎩', '🎓', '👑', '⛑️', '🪖', '🎒', '👝', '👛', '👜', '💼', '👓', '🕶️', '🥽', '🪢', '💍', '🌂', '☂️', '🎃', '🎄', '🎅',
            '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🎖️',
            '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓',
            '🏸', '🥊', '🥋', '🥅', '⛳', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', '🪄', '🧿', '🎮',
            '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅', '🪆', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🪡',
            '🧶', '🪢', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '🎙️', '🎚️', '🎛️', '🎤', '🎧', '📻',
            '🎷', '🪗', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '🪘', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '🖨️',
            '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🕯️',
            '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖',
            '🏷️', '💰', '🪙', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪',
            '📬', '📭', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️',
            '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐',
            '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🪃', '🏹', '🛡️', '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜️',
            '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', '🧲', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺',
            '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣',
            '🧼', '🪥', '🧽', '🧯', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾',
            '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '🔞', '📵', '☢️', '☣️', '⬆️', '↗️',
            '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝',
            '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎', '🔯', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
            '♐', '♑', '♒', '♓', '⛎', '🔀', '🔁', '🔂', '▶️', '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️', '🔼', '⏫', '🔽', '⏬', '⏸️',
            '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧️', '✖️', '➕', '➖', '➗', '♾️', '‼️', '⁉️',
            '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭕', '✅', '☑️', '✔️', '✖️', '❌', '❎',
            '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣',
            '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖',
            '🅾️', '🆗', '🅿️', '🆘', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯', '🉐', '🈹', '🈚', '🈲', '🉑', '🈸', '🈴', '🈳',
            '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪',
            '🟫', '⬛', '⬜', '◼️', '◻️', '◾', '◽', '▪️', '▫️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲',
            '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷',
            '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭', '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳',
            '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫', '🇨🇬', '🇨🇭', '🇨🇮', '🇨🇰', '🇨🇱',
            '🇨🇲', '🇨🇳', '🇨🇴', '🇨🇵', '🇨🇷', '🇨🇺', '🇨🇻', '🇨🇼', '🇨🇽', '🇨🇾', '🇨🇿', '🇩🇪', '🇩🇬', '🇩🇯', '🇩🇰', '🇩🇲', '🇩🇴', '🇩🇿',
            '🇪🇦', '🇪🇨', '🇪🇪', '🇪🇬', '🇪🇭', '🇪🇷', '🇪🇸', '🇪🇹', '🇪🇺', '🇫🇮', '🇫🇯', '🇫🇰', '🇫🇲', '🇫🇴', '🇫🇷', '🇬🇦', '🇬🇧', '🇬🇩',
            '🇬🇪', '🇬🇫', '🇬🇬', '🇬🇭', '🇬🇮', '🇬🇱', '🇬🇲', '🇬🇳', '🇬🇵', '🇬🇶', '🇬🇷', '🇬🇸', '🇬🇹', '🇬🇺', '🇬🇼', '🇬🇾', '🇭🇰', '🇭🇲',
            '🇭🇳', '🇭🇷', '🇭🇹', '🇭🇺', '🇮🇨', '🇮🇩', '🇮🇪', '🇮🇱', '🇮🇲', '🇮🇳', '🇮🇴', '🇮🇶', '🇮🇷', '🇮🇸', '🇮🇹', '🇯🇪', '🇯🇲', '🇯🇴',
            '🇯🇵', '🇰🇪', '🇰🇬', '🇰🇭', '🇰🇮', '🇰🇲', '🇰🇳', '🇰🇵', '🇰🇷', '🇰🇼', '🇰🇾', '🇰🇿', '🇱🇦', '🇱🇧', '🇱🇨', '🇱🇮', '🇱🇰', '🇱🇷',
            '🇱🇸', '🇱🇹', '🇱🇺', '🇱🇻', '🇱🇾', '🇲🇦', '🇲🇨', '🇲🇩', '🇲🇪', '🇲🇫', '🇲🇬', '🇲🇭', '🇲🇰', '🇲🇱', '🇲🇲', '🇲🇳', '🇲🇴', '🇲🇵',
            '🇲🇶', '🇲🇷', '🇲🇸', '🇲🇹', '🇲🇺', '🇲🇻', '🇲🇼', '🇲🇽', '🇲🇾', '🇲🇿', '🇳🇦', '🇳🇨', '🇳🇪', '🇳🇫', '🇳🇬', '🇳🇮', '🇳🇱', '🇳🇴',
            '🇳🇵', '🇳🇷', '🇳🇺', '🇳🇿', '🇴🇲', '🇵🇦', '🇵🇪', '🇵🇫', '🇵🇬', '🇵🇭', '🇵🇰', '🇵🇱', '🇵🇲', '🇵🇳', '🇵🇷', '🇵🇸', '🇵🇹', '🇵🇼',
            '🇵🇾', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇸', '🇷🇺', '🇷🇼', '🇸🇦', '🇸🇧', '🇸🇨', '🇸🇩', '🇸🇪', '🇸🇬', '🇸🇭', '🇸🇮', '🇸🇯', '🇸🇰', '🇸🇱',
            '🇸🇲', '🇸🇳', '🇸🇴', '🇸🇷', '🇸🇸', '🇸🇹', '🇸🇻', '🇸🇽', '🇸🇾', '🇸🇿', '🇹🇦', '🇹🇨', '🇹🇩', '🇹🇫', '🇹🇬', '🇹🇭', '🇹🇯', '🇹🇰',
            '🇹🇱', '🇹🇲', '🇹🇳', '🇹🇴', '🇹🇷', '🇹🇹', '🇹🇻', '🇹🇼', '🇹🇿', '🇺🇦', '🇺🇬', '🇺🇲', '🇺🇳', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇦', '🇻🇨',
            '🇻🇪', '🇻🇬', '🇻🇮', '🇻🇳', '🇻🇺', '🇼🇫', '🇼🇸', '🇽🇰', '🇾🇪', '🇾🇹', '🇿🇦', '🇿🇲', '🇿🇼', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
        ];
        
        emojis.forEach(emoji => {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.addEventListener('click', () => {
                soundIconInput.value = emoji;
                emojiPickerModal.style.display = 'none';
            });
            emojiPickerList.appendChild(emojiSpan);
        });

        emojiPickerBtn.addEventListener('click', () => {
            emojiPickerModal.style.display = 'flex';
        });

        closeEmojiPickerBtn.addEventListener('click', () => {
            emojiPickerModal.style.display = 'none';
        });

        emojiPickerModal.addEventListener('click', (event) => {
            if (event.target === emojiPickerModal) {
                emojiPickerModal.style.display = 'none';
            }
        });
    }

     const SCENES_STORAGE_KEY = 'rpgSoundMixerScenes';
     let savedScenes = [];


    function loadScenesFromLocalStorage() {
        const scenesJson = localStorage.getItem(SCENES_STORAGE_KEY);
        return scenesJson ? JSON.parse(scenesJson) : [];
    }

    function populateSceneDropdown() {
        if (!sceneSelect) return;
        while (sceneSelect.options.length > 1) {
            sceneSelect.remove(1);
        }

        savedScenes.forEach((scene, index) => {
            const option = document.createElement('option');
            option.value = scene.name;
            option.textContent = scene.name;
            sceneSelect.appendChild(option);
        });
       
           const addTileBtn = document.getElementById('add-tile-btn');
           if (addTileBtn) {
               addTileBtn.addEventListener('click', () => {
                   const soundMixer = document.getElementById('sound-mixer');
                   const newDropSlot = document.createElement('div');
                   newDropSlot.className = 'drop-slot';
                   newDropSlot.innerHTML = '<span class="add-sound-icon">+</span>';
                   soundMixer.appendChild(newDropSlot);
               });
           }
           const removeTileBtn = document.getElementById('remove-tile-btn');
            if (removeTileBtn) {
                removeTileBtn.addEventListener('click', () => {
                    const soundMixer = document.getElementById('sound-mixer');
                    const dropSlots = soundMixer.querySelectorAll('.drop-slot');
                    if (dropSlots.length > 1) { // Keep at least one slot
                        dropSlots[dropSlots.length - 1].remove();
                    }
                });
            }
    }

    function loadScene(sceneData) {
       const allDropSlots = document.querySelectorAll('.drop-slot');
        allDropSlots.forEach(slot => {
            const tile = slot.querySelector('.sound-tile');
            if (tile) {
                const soundName = tile.dataset.sound;
                if (audioElements[soundName]) {
                    audioElements[soundName].pause();
                    audioElements[soundName].currentTime = 0;
                }
                tile.remove();
            }
            updateSlotAppearance(slot);
        });

        const sounds = sceneData.config || sceneData.sounds;
        sounds.forEach(soundConfig => {
           const allDropSlots = document.querySelectorAll('.drop-slot');
            const targetSlot = allDropSlots[soundConfig.slot_index];
            if (targetSlot) {
                const { sound_name, volume } = soundConfig;
                const soundData = allAvailableSounds.find(s => s.sound_name === sound_name);
                const soundSymbol = soundData ? soundData.icon : '❓';

                const newTile = document.createElement('div');
                newTile.className = 'sound-tile';
                newTile.id = `${sound_name}-tile-${nextTileId++}`;
                newTile.dataset.sound = sound_name;
                newTile.innerHTML = `
                    <div class="tile-main-content">
                        <span class="tile-icon">${soundSymbol}</span>
                        <h2 class="tile-label">${sound_name.charAt(0).toUpperCase() + sound_name.slice(1)}</h2>
                    </div>
                    <div class="fader-container tile-fader">
                        <input type="range" class="volume-slider" data-sound="${sound_name}" min="0" max="1" step="0.01" value="${volume}">
                    </div>
                `;
                
                targetSlot.appendChild(newTile);
                initializeSoundTile(newTile, volume, false);
                updateSlotAppearance(targetSlot);
            }
        });
        soundTiles = document.querySelectorAll('.sound-tile');
    }

    if (sceneSelect && newSceneNameInput && saveSceneBtn) {
        savedScenes = loadScenesFromLocalStorage();
        populateSceneDropdown();

        saveSceneBtn.addEventListener('click', () => {
            const sceneName = newSceneNameInput.value.trim();
            if (!sceneName) {
                alert('Please enter a name for the scene.');
                return;
            }

            const soundsToSave = [];
            const allDropSlots = document.querySelectorAll('.drop-slot');
            allDropSlots.forEach((slot, index) => {
                const tile = slot.querySelector('.sound-tile');
                if (tile) {
                    const soundId = tile.dataset.sound;
                    const volumeSlider = tile.querySelector('.volume-slider');
                    if (soundId && volumeSlider) {
                        soundsToSave.push({
                            sound_name: soundId,
                            volume: parseFloat(volumeSlider.value),
                            slot_index: index
                        });
                    }
                }
            });

            if (currentUserId) {
                const sceneDataForServer = {
                    userId: currentUserId,
                    sceneName: sceneName,
                    sounds: soundsToSave,
                    totalTiles: allDropSlots.length
                };
                
                fetch(`${baseUrl}/api/scenes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sceneDataForServer),
                })
                .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, body: data })))
                .then(({ ok, status, body }) => {
                    if (ok) {
                        alert(`Scene "${sceneName}" saved successfully!`);
                        newSceneNameInput.value = '';
                        fetchUserScenesFromServer(currentUserId);
                    } else {
                        alert(`Error saving scene: ${body.message || `Server responded with status ${status}`}`);
                    }
                })
                .catch(error => {
                    console.error('Error saving scene to server:', error);
                    alert('An error occurred while saving the scene.');
                });
            } else {
                const existingSceneIndex = savedScenes.findIndex(s => s.name === sceneName);
                if (existingSceneIndex > -1) {
                    savedScenes[existingSceneIndex].config = soundsToSave;
                } else {
                    savedScenes.push({ name: sceneName, config: soundsToSave });
                }
                localStorage.setItem(SCENES_STORAGE_KEY, JSON.stringify(savedScenes));
                populateSceneDropdown();
                newSceneNameInput.value = '';
                sceneSelect.value = sceneName;
                alert(`Scene "${sceneName}" saved locally.`);
            }
        });
        
        await updateAllSoundsCache(); // Populate the cache on initial load

        sceneSelect.addEventListener('change', () => {
            const selectedValue = sceneSelect.value;
            if (!selectedValue) return;

            if (!isNaN(selectedValue)) {
                fetch(`${baseUrl}/api/scenes/${selectedValue}?userId=${currentUserId}`)
                    .then(response => response.json())
                    .then(sceneData => {
                        if (sceneData && sceneData.sounds) {
                            loadScene(sceneData);
                        }
                    })
                    .catch(error => console.error('Error loading scene from server:', error));
            } else {
                const sceneToLoad = savedScenes.find(s => s.name === selectedValue);
                if (sceneToLoad) {
                    loadScene(sceneToLoad);
                }
            }
        });
    }

        // Now that the cache is populated, initialize the tiles
        soundTiles.forEach((tile) => {
            initializeSoundTile(tile);
        });
    }

    init(); // Run the initialization function
});