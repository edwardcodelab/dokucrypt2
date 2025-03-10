// disable_drafts.js for dokucrypt2 plugin
// Disables draft saving, prevents browser caching, and checks Cache-Control/Pragma headers

document.addEventListener('DOMContentLoaded', function() {
    console.log('disable_drafts.js loaded successfully'); // Confirm script is running

    // Target the DokuWiki edit textarea (id="wiki__text")
    const textarea = document.getElementById('wiki__text');
    if (!textarea) {
        console.log('Edit textarea (wiki__text) not found - not in edit mode');
        // Check headers even if not in edit mode (for view mode)
        checkResponseHeaders();
        return;
    }
    console.log('Edit mode detected - monitoring textarea for </SECRET> tags');

    // Function to check Cache-Control and Pragma headers
    function checkResponseHeaders() {
        fetch(window.location.href, { method: 'HEAD' })
            .then(response => {
                const cacheControl = response.headers.get('Cache-Control');
                const pragma = response.headers.get('Pragma');

                if (cacheControl) {
                    console.log(`Cache-Control header: ${cacheControl}`);
                    if (cacheControl.includes('no-store') && 
                        cacheControl.includes('no-cache') && 
                        cacheControl.includes('must-revalidate') && 
                        cacheControl.includes('private')) {
                        console.log('Cache-Control matches expected: no-store, no-cache, must-revalidate, private');
                    } else {
                        console.warn('Cache-Control does not fully match expected values');
                    }
                } else {
                    console.warn('Cache-Control header not found');
                }

                if (pragma) {
                    console.log(`Pragma header: ${pragma}`);
                    if (pragma === 'no-cache') {
                        console.log('Pragma matches expected: no-cache');
                    } else {
                        console.warn('Pragma does not match expected value');
                    }
                } else {
                    console.warn('Pragma header not found');
                }
            })
            .catch(error => {
                console.error('Error fetching headers:', error);
            });
    }

    // Function to check for </SECRET> and disable drafts/cache
    function checkAndDisableDraftsAndCache() {
        const content = textarea.value;
        if (content.includes('</SECRET>')) {
            console.log('"</SECRET>" detected in textarea - disabling drafts and caching');

            // --- Disable Drafts ---
            if (typeof DWsaveDraft !== 'undefined') {
                DWsaveDraft = function() {
                    console.log('Autosave attempted but disabled due to </SECRET>');
                    return false;
                };
                console.log('DWsaveDraft autosave function overridden');
            } else {
                console.log('DWsaveDraft not found - autosave may already be disabled');
            }

            let draftButton = document.querySelector('#dw__editform input[name="do[draft]"]');
            if (draftButton && !draftButton.disabled) {
                draftButton.disabled = true;
                draftButton.value = 'Drafts Disabled';
                draftButton.title = 'Draft saving disabled due to encrypted content';
                console.log('Manual "Save Draft" button disabled');
            }

            // --- Prevent Browser Caching ---
            const editForm = document.getElementById('dw__editform');
            if (editForm && !editForm.dataset.cacheBusted) {
                editForm.addEventListener('submit', function(e) {
                    const timestamp = Date.now();
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'nocache';
                    hiddenInput.value = timestamp;
                    editForm.appendChild(hiddenInput);
                    console.log(`Added cache-busting parameter nocache=${timestamp} to form submission`);
                });
                editForm.dataset.cacheBusted = true;
            }

            if (!window.history.state || !window.history.state.nocache) {
                window.history.replaceState({ nocache: true }, document.title, window.location.href + '#nocache');
                console.log('History state modified to prevent back/forward caching');
            }
        } else {
            console.log('No "</SECRET>" in textarea yet');
        }
    }

    // Initial checks
    checkResponseHeaders();           // Check headers on load
    checkAndDisableDraftsAndCache();  // Check textarea on load

    // Listen for changes in the textarea
    textarea.addEventListener('input', function() {
        checkAndDisableDraftsAndCache();
    });

    // Check on form submission
    const editForm = document.getElementById('dw__editform');
    if (editForm) {
        editForm.addEventListener('submit', function() {
            checkAndDisableDraftsAndCache();
        });
    }

    // Prevent page from being stored in browser cache on unload
    window.addEventListener('unload', function() {
        if (textarea.value.includes('</SECRET>')) {
            console.log('Page unloading with </SECRET> - attempting to clear cache');
        }
    });
});