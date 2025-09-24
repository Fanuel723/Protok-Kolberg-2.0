// n8n Integration for Protokół Kolberg 2.0 PWA

document.addEventListener('DOMContentLoaded', () => {
    // This script runs after the main app.js and overrides functions to add n8n webhook calls.
    // It waits for the main `app` object to be initialized.
    if (window.app && typeof window.app.init === 'function') {
        console.log('Integrating n8n workflows with Protokół Kolberg 2.0 PWA...');

        // --- 1. Override Offline Queue Processing to call n8n Webhook ---
        // The original function is assumed to exist on the `app` object.
        window.app.executeQueuedAction = async function(item) {
            // TODO: Replace this placeholder with your actual n8n webhook URL for offline sync.
            const n8nWebhookUrl = 'https://YOUR_N8N_INSTANCE/webhook/offline-sync';
            console.log('Sending offline action to n8n webhook:', item);

            // The n8n workflow needs the push subscription to notify the user upon completion.
            const swRegistration = await navigator.serviceWorker.ready;
            const subscription = await swRegistration.pushManager.getSubscription();
            const payload = {
                ...item,
                subscription: subscription ? subscription.toJSON() : null
            };

            try {
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    throw new Error(`n8n webhook call failed with status: ${response.status}`);
                }
                console.log('Offline action successfully synced via n8n.');
                return await response.json();
            } catch (error) {
                console.error('Failed to sync offline action via n8n. The item will be retried.', error);
                throw error; // Re-throwing the error prevents the item from being removed from the queue.
            }
        };

        // --- 2. Override Push Notification Initialization to call n8n Webhook ---

        // This function will be called to subscribe the user and send the subscription to n8n.
        window.app.subscribeUserToPush = async function() {
            try {
                const swRegistration = await navigator.serviceWorker.ready;
                // TODO: Replace this placeholder with your VAPID public key.
                const applicationServerKey = 'YOUR_VAPID_PUBLIC_KEY';

                const subscription = await swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                });
                console.log('User is subscribed:', subscription);

                // TODO: Replace this placeholder with your actual n8n webhook URL for user registration.
                const n8nWebhookUrl = 'https://YOUR_N8N_INSTANCE/webhook/user-registration';
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription),
                });
                if (!response.ok) throw new Error('Failed to send subscription to n8n.');

                this.showMessage('Successfully subscribed to notifications!', 'success');
            } catch (error) {
                console.error('Failed to subscribe the user:', error);
                this.showMessage('Failed to subscribe to notifications. Please ensure you have granted permission.', 'error');
            }
        };

        // The original initPushNotifications is replaced to add a UI button for subscribing.
        window.app.initPushNotifications = function() {
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                const li = document.createElement('li');
                const button = document.createElement('button');
                button.id = 'enable-push';
                button.textContent = 'Enable Notifications';
                button.style.cssText = "background: var(--witcher-gold); color: var(--witcher-dark); border: none; padding: 5px 10px; cursor: pointer; font-family: var(--font-secondary); border-radius: 4px;";

                button.addEventListener('click', () => this.subscribeUserToPush());

                li.appendChild(button);
                navMenu.appendChild(li);
            }
        };

        // Since we are overriding initPushNotifications, we need to call it again.
        window.app.initPushNotifications();

        console.log('n8n integration logic has been applied.');
    } else {
        console.error('Main application object (window.app) not found. n8n integration failed.');
    }
});