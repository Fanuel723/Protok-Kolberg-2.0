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
            if (response.ok) {
                this.showNotification(`Plik ${data.filename} został wysłany.`);
            } else {
                this.showNotification(`Błąd: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Błąd podczas wysyłania pliku.', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Animate out and remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 5000);
    }

    initParticles() {
        if (document.getElementById('particles-js')) {
            particlesJS('particles-js', {
                "particles": {
                    "number": { "value": 100, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": "#d7cbac" },
                    "shape": { "type": "circle" },
                    "opacity": { "value": 0.5, "random": true },
                    "size": { "value": 2, "random": true },
                    "line_linked": { "enable": true, "distance": 150, "color": "#d7cbac", "opacity": 0.2, "width": 1 },
                    "move": { "enable": true, "speed": 2, "direction": "none", "out_mode": "out" }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": false } },
                    "modes": { "repulse": { "distance": 60 } }
                },
                "retina_detect": true
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
            const map = L.map('map').setView([52.2297, 21.0122], 6); // Center on Poland

            const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const rawSubmissionsLayer = L.featureGroup();
            const szeptyLayer = L.featureGroup();

            this.loadRawSubmissions(rawSubmissionsLayer);
            this.loadSzeptyMarkers(szeptyLayer);

            const overlayMaps = {
                "Wszystkie Zgłoszenia": rawSubmissionsLayer,
                "Szepty i Cienie": szeptyLayer
            };

            L.control.layers({ "Mapa Podstawowa": baseLayer }, overlayMaps).addTo(map);

            // Add layers to the map by default
            rawSubmissionsLayer.addTo(map);
            szeptyLayer.addTo(map);
        }
    }

    async loadRawSubmissions(layer) {
        try {
            const response = await fetch(`${this.apiBase}/submissions`);
            if (!response.ok) return;
            const submissions = await response.json();

            submissions.forEach(submission => {
                if (submission.latitude && submission.longitude) {
                     const popupContent = `<b>Zgłoszenie (surowe)</b><br>Plik: ${submission.original_filename || 'Brak'}`;
                    L.marker([submission.latitude, submission.longitude]).bindPopup(popupContent).addTo(layer);
                }
            });
        } catch (error) {
            console.error('Error loading raw submissions:', error);
        }
    }

    async loadSzeptyMarkers(layer) {
        try {
            const response = await fetch(`${this.apiBase}/map/szepty-i-cienie`);
            if (!response.ok) return;
            const data = await response.json();

            data.forEach(item => {
                if (item.latitude && item.longitude) {
                    const popupContent = `
                        <b>Szept (zweryfikowany)</b><br>
                        <i>${item.original_filename || 'Brak nazwy'}</i><br><br>
                        ${(item.przetworzony_tekst || 'Brak treści.').substring(0, 200)}...
                    `;
                    L.marker([item.latitude, item.longitude], {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })
                    }).bindPopup(popupContent).addTo(layer);
                }
            });
        } catch (error) {
            console.error('Error loading Szepty i Cienie:', error);
        }
    }

    async loadMapMarkers(map) {
        try {
            const response = await fetch(`${this.apiBase}/submissions`);
            if (!response.ok) {
                this.showNotification('Nie udało się załadować danych mapy.', 'error');
                return;
            }
            const submissions = await response.json();

            if (submissions.length === 0) {
                // No submissions with geo data yet, maybe show a default marker or do nothing
                L.marker([52.2297, 21.0122]).addTo(map)
                    .bindPopup('Brak danych. Centrala w Warszawie.')
                    .openPopup();
                return;
            }

            const markers = L.featureGroup();

            submissions.forEach(submission => {
                if (submission.latitude && submission.longitude) {
                    const popupContent = `
                        <b>Plik:</b> ${submission.original_filename || 'Brak nazwy'}<br>
                        <b>Wiadomość:</b> ${submission.content || 'Brak'}<br>
                        <b>Koordynaty:</b> ${submission.latitude.toFixed(4)}, ${submission.longitude.toFixed(4)}
                    `;
                    const marker = L.marker([submission.latitude, submission.longitude])
                        .bindPopup(popupContent);
                    markers.addLayer(marker);
                }
            });

            if (markers.getLayers().length > 0) {
                map.addLayer(markers);
                map.fitBounds(markers.getBounds().pad(0.1)); // Adjust view to show all markers
            }

        } catch (error) {
            console.error('Error loading map markers:', error);
            this.showNotification('Błąd sieci podczas ładowania danych mapy.', 'error');
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
            if (response.ok) {
                this.addMessageToLog(`< ${data.response}`, 'response-message');
                this.showNotification('Wiadomość zarchiwizowana.');
            } else {
                this.showNotification(`Błąd: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Communication error:', error);
            this.addMessageToLog('< Błąd transmisji.', 'error-message');
            this.showNotification('Błąd transmisji.', 'error');
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
