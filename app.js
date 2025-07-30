// Protokół Kolberg 2.0 - Main Application JavaScript

class ProtocolKolberg {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.initDropzone();
        this.initCommunication();
        this.initMap();
        this.initSystemStatus();
        this.initParticles();
        this.initScrollEffects();
    }

    // ASPID - File Upload and OCR
    initDropzone() {
        // Initialize Dropzone for file uploads
        const dropzoneElement = document.getElementById('aspid-dropzone');
        if (dropzoneElement) {
            const myDropzone = new Dropzone(dropzoneElement, {
                url: `${this.apiBase}/aspid/upload`,
                maxFilesize: 10, // MB
                acceptedFiles: 'image/*,.pdf',
                addRemoveLinks: true,
                dictDefaultMessage: 'Przeciągnij manuskrypt lub kliknij aby wybrać',
                dictRemoveFile: 'Usuń',
                dictCancelUpload: 'Anuluj',
                dictUploadCanceled: 'Upload anulowany',
                dictInvalidFileType: 'Nieprawidłowy typ pliku',
                dictFileTooBig: 'Plik zbyt duży ({{filesize}}MB). Maksymalny rozmiar: {{maxFilesize}}MB.',
                
                init: function() {
                    this.on('success', (file, response) => {
                        console.log('File uploaded successfully:', response);
                        app.processOCR(file);
                    });
                    
                    this.on('error', (file, errorMessage) => {
                        console.error('Upload error:', errorMessage);
                        app.showMessage('Błąd podczas przesyłania pliku: ' + errorMessage, 'error');
                    });
                }
            });
        }
    }

    async processOCR(file) {
        const resultsDiv = document.getElementById('ocr-results');
        const extractedTextDiv = document.getElementById('extracted-text');
        const metadataDiv = document.getElementById('analysis-metadata');
        
        if (!resultsDiv || !extractedTextDiv) return;

        resultsDiv.classList.remove('hidden');
        extractedTextDiv.innerHTML = '<div class="loading-text">Analizowanie manuskryptu...</div>';

        try {
            // Use Tesseract.js for OCR
            const { data: { text, confidence } } = await Tesseract.recognize(
                file,
                'pol', // Polish language
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const progress = Math.round(m.progress * 100);
                            extractedTextDiv.innerHTML = `<div class="loading-text">Rozpoznawanie tekstu: ${progress}%</div>`;
                        }
                    }
                }
            );

            // Display extracted text
            extractedTextDiv.innerHTML = text || 'Nie udało się rozpoznać tekstu w manuskrypcie.';
            
            // Display metadata
            if (metadataDiv) {
                metadataDiv.innerHTML = `
                    <div class="metadata-item">
                        <strong>Pewność rozpoznania:</strong> ${Math.round(confidence)}%
                    </div>
                    <div class="metadata-item">
                        <strong>Język:</strong> Polski
                    </div>
                    <div class="metadata-item">
                        <strong>Typ:</strong> Słowiańska legenda
                    </div>
                    <div class="metadata-item">
                        <strong>Status:</strong> Zarchiwizowano
                    </div>
                `;
            }

            // Update statistics
            this.updateStats('manuscripts', 1);
            this.showMessage('Manuskrypt został pomyślnie przeanalizowany i dodany do archiwum!', 'success');

        } catch (error) {
            console.error('OCR Error:', error);
            extractedTextDiv.innerHTML = 'Błąd podczas analizy manuskryptu. Spróbuj ponownie.';
            this.showMessage('Błąd podczas analizy OCR: ' + error.message, 'error');
        }
    }

    // MKP2 - Communication Protocol
    initCommunication() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-message');
        const messageLog = document.getElementById('message-log');

        if (sendButton && messageInput) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const messageLog = document.getElementById('message-log');
        
        if (!messageInput || !messageLog) return;

        const message = messageInput.value.trim();
        if (!message) return;

        // Add user message to log
        this.addMessageToLog(`> ${message}`, 'user-message');
        messageInput.value = '';

        try {
            // Simulate protocol communication
            const response = await fetch(`${this.apiBase}/mkp2/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            // Add response to log
            this.addMessageToLog(`< ${data.response}`, 'response-message');
            
            // Update statistics
            this.updateStats('legends', 1);

        } catch (error) {
            console.error('Communication error:', error);
            this.addMessageToLog('< Błąd transmisji: Połączenie z siecią mistycznych przekaźników zostało przerwane.', 'error-message');
        }
    }

    addMessageToLog(message, className) {
        const messageLog = document.getElementById('message-log');
        if (!messageLog) return;

        const messageElement = document.createElement('div');
        messageElement.className = className;
        messageElement.textContent = message;
        
        messageLog.appendChild(messageElement);
        messageLog.scrollTop = messageLog.scrollHeight;
    }

    // IMWDP - Interactive Map
    initMap() {
        const addLegendButton = document.getElementById('add-legend');
        const loadKmlButton = document.getElementById('load-kml');

        if (addLegendButton) {
            addLegendButton.addEventListener('click', () => {
                this.addLegendToMap();
            });
        }

        if (loadKmlButton) {
            loadKmlButton.addEventListener('click', () => {
                this.loadKmlData();
            });
        }
    }

    addLegendToMap() {
        // Simulate adding a legend to the map
        const legendName = prompt('Wprowadź nazwę legendy:');
        if (legendName) {
            this.showMessage(`Legenda "${legendName}" została dodana do mapy!`, 'success');
            this.updateStats('locations', 1);
        }
    }

    loadKmlData() {
        // Simulate KML data loading
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.kml,.kmz';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.showMessage(`Plik KML "${file.name}" został wczytany do mapy!`, 'success');
                this.updateStats('locations', 5); // Assume 5 locations in KML
            }
        };
        
        input.click();
    }

    // System Status and Statistics
    initSystemStatus() {
        this.updateSystemStatus();
        this.initStats();
        
        // Update status every 30 seconds
        setInterval(() => {
            this.updateSystemStatus();
        }, 30000);
    }

    async updateSystemStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            const data = await response.json();
            
            // Update status indicators
            document.getElementById('aspid-status').textContent = 'Aktywny';
            document.getElementById('mkp2-status').textContent = 'Aktywny';
            document.getElementById('imwdp-status').textContent = 'Aktywny';
            
        } catch (error) {
            console.error('Status update error:', error);
            document.getElementById('aspid-status').textContent = 'Błąd';
            document.getElementById('mkp2-status').textContent = 'Błąd';
            document.getElementById('imwdp-status').textContent = 'Błąd';
        }
    }

    initStats() {
        // Initialize statistics from localStorage
        const stats = this.getStats();
        document.getElementById('legends-count').textContent = stats.legends;
        document.getElementById('manuscripts-count').textContent = stats.manuscripts;
        document.getElementById('locations-count').textContent = stats.locations;
    }

    getStats() {
        const defaultStats = { legends: 0, manuscripts: 0, locations: 0 };
        const stored = localStorage.getItem('kolberg-stats');
        return stored ? JSON.parse(stored) : defaultStats;
    }

    updateStats(type, increment = 1) {
        const stats = this.getStats();
        stats[type] = (stats[type] || 0) + increment;
        localStorage.setItem('kolberg-stats', JSON.stringify(stats));
        
        // Update display
        const element = document.getElementById(`${type}-count`);
        if (element) {
            element.textContent = stats[type];
            element.parentElement.classList.add('pulse');
            setTimeout(() => {
                element.parentElement.classList.remove('pulse');
            }, 2000);
        }
    }

    // Visual Effects
    initParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: var(--witcher-gold);
                border-radius: 50%;
                opacity: 0.6;
                animation: float ${5 + Math.random() * 10}s infinite linear;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                box-shadow: 0 0 6px var(--witcher-gold);
            `;
            particlesContainer.appendChild(particle);
        }

        // Add CSS animation for particles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 0.6; }
                90% { opacity: 0.6; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    initScrollEffects() {
        // Add scroll-based animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe all sections
        document.querySelectorAll('.module-section').forEach(section => {
            observer.observe(section);
        });
    }

    // Utility Methods
    showMessage(message, type = 'info') {
        // Create and show a notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--witcher-dark);
            border: 2px solid var(--witcher-gold);
            color: var(--witcher-gold);
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: var(--shadow-dark);
            z-index: 10000;
            max-width: 400px;
            font-family: var(--font-secondary);
        `;
        
        if (type === 'error') {
            notification.style.borderColor = 'var(--witcher-red)';
            notification.style.color = 'var(--witcher-red)';
        } else if (type === 'success') {
            notification.style.borderColor = 'var(--witcher-green)';
            notification.style.color = 'var(--witcher-green)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ProtocolKolberg();
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}



    // PWA Functionality Extensions
    initPWAFeatures() {
        this.initOfflineQueue();
        this.initPushNotifications();
        this.initBackgroundSync();
        this.initMasonryLayout();
        this.initModalDialogs();
    }

    // Offline Queue (inspirowane Starbucks PWA)
    initOfflineQueue() {
        this.offlineQueue = [];
        
        // Sprawdź status połączenia
        window.addEventListener('online', () => {
            this.processOfflineQueue();
            this.showMessage('Połączenie przywrócone. Synchronizuję dane...', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showMessage('Tryb offline aktywny. Dane będą zsynchronizowane po przywróceniu połączenia.', 'warning');
        });
    }

    // Dodaj do kolejki offline
    addToOfflineQueue(action, data) {
        const queueItem = {
            id: Date.now(),
            action: action,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        this.offlineQueue.push(queueItem);
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
        
        this.showMessage('Akcja dodana do kolejki offline', 'info');
    }

    // Przetwórz kolejkę offline
    async processOfflineQueue() {
        const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        
        for (const item of queue) {
            try {
                await this.executeQueuedAction(item);
                this.removeFromQueue(item.id);
            } catch (error) {
                console.error('Błąd podczas przetwarzania kolejki:', error);
            }
        }
    }

    async executeQueuedAction(item) {
        switch (item.action) {
            case 'addLegend':
                return await this.submitLegend(item.data);
            case 'uploadFile':
                return await this.uploadFile(item.da
(Content truncated due to size limit. Use line ranges to read in chunks)