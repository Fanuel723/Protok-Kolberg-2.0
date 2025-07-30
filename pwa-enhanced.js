/**
 * Enhanced PWA Module for Protokół Kolberg 2.0
 * Implements offline queue, background sync, and advanced caching
 */

class EnhancedPWA {
    constructor() {
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;
        this.dbName = 'ProtocolKolbergDB';
        this.dbVersion = 1;
        this.db = null;
        
        this.init();
    }

    async init() {
        await this.initIndexedDB();
        this.registerServiceWorker();
        this.setupNetworkListeners();
        this.setupInstallPrompt();
        this.setupNotifications();
        this.loadOfflineQueue();
    }

    // IndexedDB for offline storage
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store for offline legends
                if (!db.objectStoreNames.contains('legends')) {
                    const legendStore = db.createObjectStore('legends', { keyPath: 'id', autoIncrement: true });
                    legendStore.createIndex('timestamp', 'timestamp', { unique: false });
                    legendStore.createIndex('status', 'status', { unique: false });
                }
                
                // Store for offline manuscripts
                if (!db.objectStoreNames.contains('manuscripts')) {
                    const manuscriptStore = db.createObjectStore('manuscripts', { keyPath: 'id', autoIncrement: true });
                    manuscriptStore.createIndex('timestamp', 'timestamp', { unique: false });
                    manuscriptStore.createIndex('status', 'status', { unique: false });
                }
                
                // Store for offline messages
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                    messageStore.createIndex('status', 'status', { unique: false });
                }
                
                // Store for offline queue
                if (!db.objectStoreNames.contains('offlineQueue')) {
                    const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
                    queueStore.createIndex('timestamp', 'timestamp', { unique: false });
                    queueStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // Service Worker registration with update handling
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailable();
                        }
                    });
                });
                
                // Listen for messages from SW
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'BACKGROUND_SYNC_SUCCESS') {
                        this.handleBackgroundSyncSuccess(event.data.payload);
                    }
                });
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Network status monitoring
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showMessage('Połączenie przywrócone! Synchronizuję dane...', 'success');
            this.processOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showMessage('Brak połączenia. Aplikacja działa w trybie offline.', 'warning');
        });
    }

    // Install prompt handling
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton(deferredPrompt);
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.showMessage('Aplikacja została zainstalowana!', 'success');
        });
    }

    showInstallButton(deferredPrompt) {
        const installBtn = document.createElement('button');
        installBtn.innerHTML = `
            <i class="material-icons">download</i>
            Zainstaluj Aplikację
        `;
        installBtn.className = 'install-btn witcher-btn';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(45deg, #8B4513, #CD853F);
            color: #d7cbac;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-family: 'Cinzel', serif;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        installBtn.addEventListener('click', async () => {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            
            deferredPrompt = null;
            installBtn.remove();
        });
        
        document.body.appendChild(installBtn);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.remove();
            }
        }, 10000);
    }

    // Notification setup
    async setupNotifications() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notifications enabled');
            }
        }
    }

    // Offline queue management
    async addToOfflineQueue(type, data) {
        const queueItem = {
            type: type,
            data: data,
            timestamp: new Date().toISOString(),
            status: 'pending',
            retryCount: 0
        };
        
        if (this.db) {
            const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
            const store = transaction.objectStore('offlineQueue');
            await store.add(queueItem);
        }
        
        this.offlineQueue.push(queueItem);
        this.showMessage(`Akcja dodana do kolejki offline (${type})`, 'info');
    }

    async loadOfflineQueue() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['offlineQueue'], 'readonly');
        const store = transaction.objectStore('offlineQueue');
        const request = store.getAll();
        
        request.onsuccess = () => {
            this.offlineQueue = request.result.filter(item => item.status === 'pending');
            if (this.offlineQueue.length > 0) {
                this.showMessage(`${this.offlineQueue.length} akcji oczekuje na synchronizację`, 'info');
            }
        };
    }

    async processOfflineQueue() {
        if (!this.isOnline || this.offlineQueue.length === 0) return;
        
        const pendingItems = this.offlineQueue.filter(item => item.status === 'pending');
        
        for (const item of pendingItems) {
            try {
                await this.processQueueItem(item);
                item.status = 'completed';
                await this.updateQueueItem(item);
            } catch (error) {
                item.retryCount++;
                if (item.retryCount >= 3) {
                    item.status = 'failed';
                    await this.updateQueueItem(item);
                }
                console.error('Failed to process queue item:', error);
            }
        }
        
        // Remove completed items from memory
        this.offlineQueue = this.offlineQueue.filter(item => item.status === 'pending');
    }

    async processQueueItem(item) {
        switch (item.type) {
            case 'legend':
                return await this.submitLegend(item.data);
            case 'manuscript':
                return await this.submitManuscript(item.data);
            case 'message':
                return await this.submitMessage(item.data);
            default:
                throw new Error(`Unknown queue item type: ${item.type}`);
        }
    }

    async updateQueueItem(item) {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
        const store = transaction.objectStore('offlineQueue');
        await store.put(item);
    }

    // API calls with offline fallback
    async submitLegend(legendData) {
        if (!this.isOnline) {
            await this.addToOfflineQueue('legend', legendData);
            return { offline: true };
        }
        
        try {
            const response = await fetch('/api/imwdp/add-legend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(legendData)
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
            
        } catch (error) {
            if (!this.isOnline) {
                await this.addToOfflineQueue('legend', legendData);
                return { offline: true };
            }
            throw error;
        }
    }

    async submitManuscript(manuscriptData) {
        if (!this.isOnline) {
            await this.addToOfflineQueue('manuscript', manuscriptData);
            return { offline: true };
        }
        
        try {
            const response = await fetch('/api/aspid/upload', {
                method: 'POST',
                body: manuscriptData // FormData
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
            
        } catch (error) {
            if (!this.isOnline) {
                await this.addToOfflineQueue('manuscript', manuscriptData);
                return { offline: true };
            }
            throw error;
        }
    }

    async submitMessage(messageData) {
        if (!this.isOnline) {
            await this.addToOfflineQueue('message', messageData);
            return { offline: true };
        }
        
        try {
            const response = await fetch('/api/mkp2/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
            
        } catch (error) {
            if (!this.isOnline) {
                await this.addToOfflineQueue('message', messageData);
                return { offline: true };
            }
            throw error;
        }
    }

    // Offline data storage
    async storeOfflineData(storeName, data) {
        if (!this.db) return;
        
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        data.timestamp = new Date().toISOString();
        data.status = 'offline';
        
        return await store.add(data);
    }

    async getOfflineData(storeName) {
        if (!this.db) return [];
        
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Update notification
    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <span>Dostępna jest nowa wersja aplikacji!</span>
                <button class="update-btn" onclick="window.location.reload()">Aktualizuj</button>
                <button class="dismiss-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        updateBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(45deg, #8B4513, #CD853F);
            color: #d7cbac;
            padding: 12px;
            z-index: 10000;
            text-align: center;
            font-family: 'Cinzel', serif;
        `;
        
        document.body.insertBefore(updateBanner, document.body.firstChild);
    }

    // Background sync success handler
    handleBackgroundSyncSuccess(payload) {
        this.showMessage(`Synchronizacja zakończona: ${payload.message}`, 'success');
        
        // Update UI if needed
        if (payload.type === 'legend') {
            // Refresh legends list
            if (window.app && window.app.loadLegends) {
                window.app.loadLegends();
            }
        }
    }

    // Utility method for showing messages
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-family: 'Cinzel', serif;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Performance monitoring
    measurePerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Performance metrics:', {
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        firstPaint: performance.getEntriesByType('paint')[0]?.startTime
                    });
                }, 0);
            });
        }
    }
}

// Initialize Enhanced PWA
const enhancedPWA = new EnhancedPWA();

// Export for global access
window.enhancedPWA = enhancedPWA;

