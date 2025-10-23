class ProtocolKolberg {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        console.log("Initializing ProtocolKolberg...");
        this.initCommunication();
        this.initMap();
        this.initParticles();
        this.initScrollEffects();
        this.initUpload();
        this.initPWAFeatures();
    }

    initUpload() {
        const dropzone = document.getElementById('aspid-dropzone');
        if (dropzone) {
            dropzone.addEventListener('click', () => this.triggerFileInput());
            // Add drag and drop listeners if you want to expand this
        }
    }

    triggerFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadFile(file);
            }
        };
        input.click();
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.apiBase}/aspid/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            console.log('File uploaded:', data);
            alert(`Plik ${data.filename} został wysłany.`);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Błąd podczas wysyłania pliku.');
        }
    }

    initParticles() {
        if (document.getElementById('particles-js')) {
            particlesJS('particles-js', {
                "particles": { "number": { "value": 80 }, "color": { "value": "#d7cbac" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true }, "size": { "value": 3, "random": true }, "line_linked": { "enable": false }, "move": { "enable": true, "speed": 1, "direction": "none", "out_mode": "out" } },
                "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": false }, "onclick": { "enable": false } }, "modes": { "repulse": { "distance": 50 } } }
            });
        }
    }

    initScrollEffects() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.module-section').forEach(section => {
            observer.observe(section);
        });
    }

    initMap() {
        if (document.getElementById('map')) {
            const map = L.map('map').setView([52.2297, 21.0122], 13); // Warsaw coordinates

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            L.marker([52.2297, 21.0122]).addTo(map)
                .bindPopup('Przykładowy znacznik w Warszawie.')
                .openPopup();
        }
    }

    initCommunication() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-message');

        if (sendButton && messageInput) {
            sendButton.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const messageLog = document.getElementById('message-log');
        const message = messageInput.value.trim();

        if (!message) return;

        this.addMessageToLog(`> ${message}`, 'user-message');
        messageInput.value = '';

        try {
            const response = await fetch(`${this.apiBase}/mkp2/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            this.addMessageToLog(`< ${data.response}`, 'response-message');
        } catch (error) {
            console.error('Communication error:', error);
            this.addMessageToLog('< Błąd transmisji.', 'error-message');
        }
    }

    addMessageToLog(message, className) {
        const messageLog = document.getElementById('message-log');
        const messageElement = document.createElement('div');
        messageElement.className = className;
        messageElement.textContent = message;
        messageLog.appendChild(messageElement);
        messageLog.scrollTop = messageLog.scrollHeight;
    }

    // This is the original bug fix.
    initPWAFeatures() {
        this.initOfflineQueue();
        // The following functions do not exist, so they are commented out.
        // this.initPushNotifications();
        // this.initBackgroundSync();
    }

    initOfflineQueue() {
        this.offlineQueue = [];
        console.log("Offline queue initialized.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ProtocolKolberg();
});
