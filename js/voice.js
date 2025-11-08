// Voice assistant functionality
class VoiceAssistant {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.setupVoiceRecognition();
    }

    setupVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-KE';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceUI(true);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceUI(false);
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processVoiceCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceUI(false);
        };

        // Setup voice button
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.toggleListening();
            });
        }

        // Setup voice search
        const voiceSearchBtn = document.getElementById('voiceSearchBtn');
        if (voiceSearchBtn) {
            voiceSearchBtn.addEventListener('click', () => {
                this.startVoiceSearch();
            });
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    startVoiceSearch() {
        if (!this.recognition) {
            utils.showToast('Error', 'Voice search not supported', 'error');
            return;
        }

        this.recognition.start();
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('searchInput').value = transcript;
            products.filters.search = transcript;
            products.loadProducts(true);
        };
    }

    processVoiceCommand(transcript) {
        const command = transcript.toLowerCase().trim();
        this.showVoiceFeedback(`You said: "${command}"`);

        // Navigation commands
        if (command.includes('home') || command.includes('go home')) {
            utils.navigateToPage('home');
        } else if (command.includes('products') || command.includes('browse')) {
            utils.navigateToPage('products');
        } else if (command.includes('farmers')) {
            utils.navigateToPage('farmers');
        } else if (command.includes('messages')) {
            utils.navigateToPage('messages');
        } else if (command.includes('orders')) {
            utils.navigateToPage('orders');
        } else if (command.includes('dashboard')) {
            utils.navigateToPage('dashboard');
        }
        // Search commands
        else if (command.includes('search')) {
            const searchTerm = command.replace('search', '').trim();
            if (searchTerm) {
                document.getElementById('searchInput').value = searchTerm;
                products.filters.search = searchTerm;
                products.loadProducts(true);
            }
        }
        // Authentication commands
        else if (command.includes('login') || command.includes('sign in')) {
            utils.navigateToPage('auth');
        } else if (command.includes('logout') || command.includes('sign out')) {
            utils.logout();
        }
        // Help command
        else if (command.includes('help')) {
            this.showVoiceHelp();
        }
        else {
            this.showVoiceFeedback(`Command not recognized: "${command}"`);
        }
    }

    showVoiceFeedback(message) {
        const feedback = document.getElementById('voiceFeedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.style.display = 'block';
            
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }
    }

    showVoiceHelp() {
        const helpText = `Available voice commands:
        - "Go home" - Navigate to home page
        - "Browse products" - View products
        - "Search [product name]" - Search for products
        - "Messages" - View messages
        - "Orders" - View orders
        - "Login" - Sign in to your account
        - "Logout" - Sign out
        - "Help" - Show this help message`;

        this.showVoiceFeedback(helpText);
    }

    updateVoiceUI(listening) {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.toggle('listening', listening);
            voiceBtn.querySelector('.material-icons').textContent = 
                listening ? 'mic_off' : 'mic';
        }
    }
}

// Initialize voice assistant
const voiceAssistant = new VoiceAssistant();
