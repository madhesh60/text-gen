// AuraText - Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Elements Selection
    const promptInput = document.getElementById('prompt-input');
    const charCounter = document.getElementById('char-counter');
    const wordCounter = document.getElementById('word-counter');
    
    // Sliders
    const tempSlider = document.getElementById('param-temp');
    const tempVal = document.getElementById('temp-val');
    const lengthSlider = document.getElementById('param-length');
    const lengthVal = document.getElementById('length-val');
    const toppSlider = document.getElementById('param-topp');
    const toppVal = document.getElementById('topp-val');
    const penaltySlider = document.getElementById('param-penalty');
    const penaltyVal = document.getElementById('penalty-val');
    
    // Buttons and Outputs
    const generateBtn = document.getElementById('generate-btn');
    const btnText = document.getElementById('btn-text');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const outputPlaceholder = document.getElementById('output-placeholder');
    const outputLoader = document.getElementById('output-loader');
    const outputText = document.getElementById('output-text');
    
    // Metadata Footer
    const outputMetadata = document.getElementById('output-metadata');
    const metaTime = document.getElementById('meta-time');
    const metaWords = document.getElementById('meta-words');
    
    // History
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    
    // Theme and Settings Modal
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const hfModelInput = document.getElementById('hf-model');
    const hfTokenInput = document.getElementById('hf-token');
    const toggleTokenVisibility = document.getElementById('toggle-token-visibility');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const testApiBtn = document.getElementById('test-api-btn');
    const apiStatus = document.getElementById('api-status');
    const apiStatusText = document.getElementById('api-status-text');
    
    // Toast Notification
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    // 2. Application State Variables
    let currentTheme = localStorage.getItem('theme') || 'dark';
    let hfToken = localStorage.getItem('hf_token') || '';
    let hfModel = localStorage.getItem('hf_model') || 'gpt2';
    let generationHistory = JSON.parse(localStorage.getItem('generation_history')) || [];
    let isGenerating = false;

    // Initialize UI from state
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    
    hfModelInput.value = hfModel;
    hfTokenInput.value = hfToken;
    
    renderHistory();
    lucide.createIcons();

    // 3. Theme Toggle Functionality
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon();
    });

    function updateThemeIcon() {
        if (currentTheme === 'dark') {
            themeIcon.setAttribute('data-lucide', 'sun');
            themeIcon.style.color = '#fbbf24'; // Warm sun color
        } else {
            themeIcon.setAttribute('data-lucide', 'moon');
            themeIcon.style.color = '#475569';
        }
        lucide.createIcons();
    }

    // 4. Modal and Settings Events
    settingsToggle.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        resetApiStatus();
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // Toggle token password visibility
    let tokenVisible = false;
    toggleTokenVisibility.addEventListener('click', () => {
        tokenVisible = !tokenVisible;
        hfTokenInput.type = tokenVisible ? 'text' : 'password';
        const eyeIcon = toggleTokenVisibility.querySelector('i');
        eyeIcon.setAttribute('data-lucide', tokenVisible ? 'eye-off' : 'eye');
        lucide.createIcons();
    });

    // Save Settings
    saveSettingsBtn.addEventListener('click', () => {
        hfModel = hfModelInput.value.trim() || 'gpt2';
        hfToken = hfTokenInput.value.trim();
        
        localStorage.setItem('hf_model', hfModel);
        localStorage.setItem('hf_token', hfToken);
        
        showToast('Settings saved successfully!', 'check-circle');
        settingsModal.classList.add('hidden');
    });

    // Test API Connection
    testApiBtn.addEventListener('click', async () => {
        const testModel = hfModelInput.value.trim() || 'gpt2';
        const testToken = hfTokenInput.value.trim();
        
        setApiStatus('testing', 'Testing connection...');
        
        try {
            const result = await queryHuggingFaceAPI("Ping", testModel, testToken, { max_new_tokens: 5 });
            if (result && (Array.isArray(result) || result.generated_text)) {
                setApiStatus('success', `Success! Connected to ${testModel}`);
            } else if (result.error) {
                setApiStatus('error', `API Error: ${result.error}`);
            } else {
                setApiStatus('error', 'Received unexpected response format.');
            }
        } catch (error) {
            setApiStatus('error', `Connection failed: ${error.message}`);
        }
    });

    function setApiStatus(type, message) {
        const indicator = apiStatus.querySelector('.status-indicator');
        indicator.className = 'status-indicator'; // reset
        
        if (type === 'testing') {
            indicator.classList.add('unknown');
            apiStatusText.textContent = message;
        } else if (type === 'success') {
            indicator.classList.add('success');
            apiStatusText.textContent = message;
        } else {
            indicator.classList.add('error');
            apiStatusText.textContent = message;
        }
    }

    function resetApiStatus() {
        const indicator = apiStatus.querySelector('.status-indicator');
        indicator.className = 'status-indicator unknown';
        apiStatusText.textContent = 'Status: Not Checked';
    }

    // 5. Input Counters
    promptInput.addEventListener('input', () => {
        const text = promptInput.value.trim();
        charCounter.textContent = `${text.length} chars`;
        
        const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
        wordCounter.textContent = `${words} words`;
    });

    // 6. Parameter Slider Bindings
    tempSlider.addEventListener('input', (e) => {
        tempVal.textContent = e.target.value;
    });

    lengthSlider.addEventListener('input', (e) => {
        lengthVal.textContent = e.target.value;
    });

    toppSlider.addEventListener('input', (e) => {
        toppVal.textContent = e.target.value;
    });

    penaltySlider.addEventListener('input', (e) => {
        penaltyVal.textContent = e.target.value;
    });

    // 7. Hugging Face Inference API Query function (routed via Vercel serverless proxy)
    async function queryHuggingFaceAPI(prompt, model, token, params = {}) {
        const url = '/api/generate';
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Pass token through if the user has explicitly entered one in settings
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const payload = {
            prompt: prompt,
            model: model,
            params: {
                max_new_tokens: parseInt(params.max_new_tokens || 100),
                temperature: parseFloat(params.temperature || 0.7),
                top_p: parseFloat(params.top_p || 0.9),
                repetition_penalty: parseFloat(params.repetition_penalty || 1.1)
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        // Handle model loading state (503)
        if (response.status === 503) {
            const errData = await response.json().catch(() => ({}));
            if (errData.estimated_time) {
                showToast(`Model is loading. Waiting estimated ${Math.round(errData.estimated_time)}s...`, 'info');
                // Poll model loading
                return new Promise((resolve, reject) => {
                    let delay = Math.min((errData.estimated_time || 10) * 1000, 15000);
                    setTimeout(async () => {
                        try {
                            const retryResult = await queryHuggingFaceAPI(prompt, model, token, params);
                            resolve(retryResult);
                        } catch (e) {
                            reject(e);
                        }
                    }, delay);
                });
            }
        }

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error || `HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    }

    // 8. Text Generation execution
    generateBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            showToast('Please enter a prompt first!', 'alert-triangle');
            return;
        }

        if (isGenerating) return;

        // Toggle state
        isGenerating = true;
        generateBtn.disabled = true;
        btnText.textContent = 'Generating...';
        
        // UI Layout adjust
        outputPlaceholder.classList.add('hidden');
        outputText.classList.add('hidden');
        outputMetadata.classList.add('hidden');
        outputLoader.classList.remove('hidden');
        
        copyBtn.disabled = true;
        clearBtn.disabled = true;

        const startTime = performance.now();

        try {
            const params = {
                max_new_tokens: lengthSlider.value,
                temperature: tempSlider.value,
                top_p: toppSlider.value,
                repetition_penalty: penaltySlider.value
            };

            const result = await queryHuggingFaceAPI(prompt, hfModel, hfToken, params);
            const endTime = performance.now();
            const elapsed = ((endTime - startTime) / 1000).toFixed(1);

            let generatedText = "";
            if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
                generatedText = result[0].generated_text;
            } else if (result && result.generated_text) {
                generatedText = result.generated_text;
            } else {
                throw new Error("Invalid response format received from Hugging Face API.");
            }

            // Render Output with animation
            outputLoader.classList.add('hidden');
            outputText.classList.remove('hidden');
            
            // Format and animate text insertion
            animateOutputText(generatedText);
            
            // Update stats
            const outWords = generatedText.split(/\s+/).filter(w => w.length > 0).length;
            metaTime.textContent = `${elapsed}s`;
            metaWords.textContent = `${outWords} words`;
            outputMetadata.classList.remove('hidden');
            
            copyBtn.disabled = false;
            clearBtn.disabled = false;

            // Save to History
            saveHistoryItem(prompt, generatedText, hfModel);
            
        } catch (error) {
            outputLoader.classList.add('hidden');
            outputPlaceholder.classList.remove('hidden');
            showToast(`Error: ${error.message}`, 'x-circle');
            console.error(error);
        } finally {
            isGenerating = false;
            generateBtn.disabled = false;
            btnText.textContent = 'Generate Text';
        }
    });

    // Animate typing effect
    function animateOutputText(fullText) {
        outputText.textContent = "";
        let index = 0;
        
        // Fast animation using requestAnimationFrame or short interval
        // Since LLM outputs can be long, we dump chunks of characters rapidly
        const charsPerFrame = Math.ceil(fullText.length / 80); // Finish in ~80 cycles
        
        function type() {
            if (index < fullText.length) {
                outputText.textContent += fullText.substring(index, index + charsPerFrame);
                index += charsPerFrame;
                requestAnimationFrame(type);
            } else {
                outputText.textContent = fullText; // Safety snap to full text
            }
        }
        type();
    }

    // 9. Copy to Clipboard and Clear
    copyBtn.addEventListener('click', () => {
        const text = outputText.textContent;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'check');
        }).catch(err => {
            showToast('Failed to copy text', 'x');
        });
    });

    clearBtn.addEventListener('click', () => {
        outputText.textContent = "";
        outputText.classList.add('hidden');
        outputMetadata.classList.add('hidden');
        outputPlaceholder.classList.remove('hidden');
        copyBtn.disabled = true;
        clearBtn.disabled = true;
        showToast('Output cleared.', 'trash');
    });

    // 10. Toast Notification System
    let toastTimeout;
    function showToast(message, iconName = 'info') {
        clearTimeout(toastTimeout);
        
        toastMessage.textContent = message;
        toastIcon.setAttribute('data-lucide', iconName);
        lucide.createIcons();
        
        toast.classList.remove('hidden');
        
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    // 11. Generation History Logic
    function saveHistoryItem(prompt, result, model) {
        const item = {
            id: Date.now(),
            prompt: prompt,
            result: result,
            model: model,
            timestamp: new Date().toLocaleString()
        };
        
        // Prepend to array
        generationHistory.unshift(item);
        
        // Keep last 15 items
        if (generationHistory.length > 15) {
            generationHistory.pop();
        }
        
        localStorage.setItem('generation_history', JSON.stringify(generationHistory));
        renderHistory();
    }

    function renderHistory() {
        if (generationHistory.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <p>No recent generations. Start generating text to see your history here!</p>
                </div>
            `;
            clearHistoryBtn.disabled = true;
            return;
        }

        clearHistoryBtn.disabled = false;
        historyList.innerHTML = "";

        generationHistory.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-item';
            card.innerHTML = `
                <div class="history-meta">
                    <span>${item.model}</span>
                    <span>${item.timestamp}</span>
                </div>
                <div class="history-prompt"><strong>Prompt:</strong> ${escapeHtml(item.prompt)}</div>
                <div class="history-result">${escapeHtml(item.result)}</div>
                <div class="history-actions">
                    <button class="btn btn-secondary btn-sm load-hist-btn" data-id="${item.id}">
                        <i data-lucide="corner-up-left" style="width:12px;height:12px;"></i>
                        Restore
                    </button>
                    <button class="btn btn-secondary btn-sm delete-hist-btn icon-btn-inline-sm" data-id="${item.id}" style="padding:0.4rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                        <i data-lucide="trash-2" style="width:12px;height:12px; color: var(--error-color);"></i>
                    </button>
                </div>
            `;
            historyList.appendChild(card);
        });

        // Bind history actions
        document.querySelectorAll('.load-hist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const item = generationHistory.find(h => h.id === id);
                if (item) {
                    promptInput.value = item.prompt;
                    promptInput.dispatchEvent(new Event('input'));
                    
                    outputText.textContent = item.result;
                    outputText.classList.remove('hidden');
                    outputPlaceholder.classList.add('hidden');
                    
                    const outWords = item.result.split(/\s+/).filter(w => w.length > 0).length;
                    metaTime.textContent = "--";
                    metaWords.textContent = `${outWords} words`;
                    outputMetadata.classList.remove('hidden');
                    
                    copyBtn.disabled = false;
                    clearBtn.disabled = false;
                    
                    showToast('Prompt and output restored!', 'corner-up-left');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        document.querySelectorAll('.delete-hist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                generationHistory = generationHistory.filter(h => h.id !== id);
                localStorage.setItem('generation_history', JSON.stringify(generationHistory));
                renderHistory();
                showToast('History item deleted.', 'trash-2');
            });
        });

        lucide.createIcons();
    }

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your generation history?')) {
            generationHistory = [];
            localStorage.setItem('generation_history', JSON.stringify(generationHistory));
            renderHistory();
            showToast('All history cleared.', 'trash-2');
        }
    });

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
