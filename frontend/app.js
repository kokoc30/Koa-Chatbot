// Configuration
// CHANGE THIS URL TO POINT TO YOUR BACKEND
const BASE_URL = "http://127.0.0.1:9010";

// DOM Elements
const chatArea = document.getElementById('chat-area');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const errorBanner = document.getElementById('error-banner');
const themeToggle = document.getElementById('theme-toggle');
const profileBtn = document.getElementById('profile-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const helpItem = document.getElementById('help-item');
const helpSubmenu = document.getElementById('help-submenu');

// State
let messages = [];
let isListening = false;
let recognition = null;
let currentTheme = 'dark'; // Default to dark

// Initialize
function init() {
    initTheme();
    setupEventListeners();
    setupSpeechRecognition();
    loadMessages(); // Optional: load from local storage
    renderMessages();
}

// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
    } else {
        currentTheme = 'dark'; // Default
    }
    applyTheme(currentTheme);
}

function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);
    themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
}

// Dropdown Logic
function toggleProfileMenu(e) {
    e.stopPropagation();
    const isExpanded = profileBtn.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
        closeDropdown();
    } else {
        dropdownMenu.classList.add('show');
        profileBtn.setAttribute('aria-expanded', 'true');
    }
}

function closeDropdown() {
    dropdownMenu.classList.remove('show');
    helpSubmenu.classList.remove('show');
    profileBtn.setAttribute('aria-expanded', 'false');
    helpItem.setAttribute('aria-expanded', 'false');
}

function toggleHelpSubmenu(show) {
    if (show) {
        helpSubmenu.classList.add('show');
        helpItem.setAttribute('aria-expanded', 'true');
    } else {
        helpSubmenu.classList.remove('show');
        helpItem.setAttribute('aria-expanded', 'false');
    }
}

// Event Listeners
function setupEventListeners() {
    // Send button
    sendBtn.addEventListener('click', handleSend);

    // Textarea Enter key
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') this.style.height = 'auto';
    });

    // Mic button
    micBtn.addEventListener('click', toggleVoiceInput);

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Profile Menu
    profileBtn.addEventListener('click', toggleProfileMenu);

    // Help Submenu Hover
    helpItem.addEventListener('mouseenter', () => toggleHelpSubmenu(true));
    helpSubmenu.addEventListener('mouseenter', () => toggleHelpSubmenu(true));

    // Help Submenu Leave (with delay to allow moving mouse to submenu)
    let helpTimeout;
    const handleLeave = () => {
        helpTimeout = setTimeout(() => toggleHelpSubmenu(false), 200);
    };

    const handleEnter = () => {
        clearTimeout(helpTimeout);
        toggleHelpSubmenu(true);
    };

    helpItem.addEventListener('mouseleave', handleLeave);
    helpSubmenu.addEventListener('mouseleave', handleLeave);
    helpItem.addEventListener('mouseenter', handleEnter);
    helpSubmenu.addEventListener('mouseenter', handleEnter);

    // Help Submenu Click (for mobile/touch)
    helpItem.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = helpItem.getAttribute('aria-expanded') === 'true';
        toggleHelpSubmenu(!isExpanded);
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !profileBtn.contains(e.target)) {
            closeDropdown();
        }
    });

    // Close dropdowns on Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    // Log menu clicks
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (item === helpItem) return; // Handled separately
            console.log('Clicked:', item.textContent.trim());
            // Optional: Close menu on item click (except for Help)
            // closeDropdown(); 
        });
    });
}

// Speech Recognition Setup
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('listening');
        };

        recognition.onend = () => {
            isListening = false;
            micBtn.classList.remove('listening');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            messageInput.value += (messageInput.value ? ' ' : '') + transcript;
            // Trigger input event to resize textarea
            messageInput.dispatchEvent(new Event('input'));
            messageInput.focus();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            isListening = false;
            micBtn.classList.remove('listening');
        };
    } else {
        micBtn.disabled = true;
        micBtn.title = "Voice input not supported in this browser.";
        micBtn.style.opacity = "0.5";
    }
}

// Actions
async function handleSend() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage({ role: 'user', text: text });
    messageInput.value = '';
    messageInput.style.height = 'auto';
    hideError();

    // Show typing indicator
    showTyping();

    try {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // Remove typing indicator and add Koa's reply
        hideTyping();
        addMessage({ role: 'koa', text: data.reply });

    } catch (error) {
        console.error('Error:', error);
        hideTyping();
        showError();
    }
}

function toggleVoiceInput() {
    if (!recognition) return;

    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// UI Rendering
function addMessage(msg) {
    messages.push(msg);
    // Optional: Save to local storage
    // localStorage.setItem('koa_messages', JSON.stringify(messages));

    renderMessage(msg);
    scrollToBottom();
}

function renderMessage(msg) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', msg.role);

    const label = document.createElement('span');
    label.classList.add('message-label');
    label.textContent = msg.role === 'user' ? 'You' : 'Koa';

    const text = document.createElement('div');
    text.textContent = msg.text;

    msgDiv.appendChild(label);
    msgDiv.appendChild(text);

    // Insert before typing indicator if it exists, otherwise append
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        chatArea.insertBefore(msgDiv, typingIndicator);
    } else {
        chatArea.appendChild(msgDiv);
    }
}

function renderMessages() {
    // Clear existing messages (except welcome if we want to keep it, but simpler to clear)
    // Actually, let's keep the welcome message if no messages
    const welcome = document.querySelector('.welcome-message');
    if (messages.length > 0 && welcome) {
        welcome.style.display = 'none';
    }

    // We only need to render new messages if we were doing a full re-render, 
    // but addMessage handles incremental rendering. 
    // This function is mainly for initial load if we had persistence.
    messages.forEach(msg => renderMessage(msg));
}

function loadMessages() {
    // const saved = localStorage.getItem('koa_messages');
    // if (saved) {
    //     messages = JSON.parse(saved);
    // }
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.innerHTML = `
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    `;
    chatArea.appendChild(typingDiv);
    scrollToBottom();
}

function hideTyping() {
    const typingDiv = document.querySelector('.typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

function showError() {
    errorBanner.classList.remove('hidden');
    errorBanner.style.display = 'block'; // Ensure it's visible
}

function hideError() {
    errorBanner.classList.add('hidden');
    setTimeout(() => {
        errorBanner.style.display = 'none';
    }, 300); // Match transition duration
}

function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Start
init();
