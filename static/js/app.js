class ProtocolKolberg {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        console.log("Initializing ProtocolKolberg...");
        this.initCommunication();
        this.initPWAFeatures();
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
