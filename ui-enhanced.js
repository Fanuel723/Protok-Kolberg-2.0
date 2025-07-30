            else if (text.includes('add') || text.includes('dodaj')) icon = 'add';
            
            const iconElement = document.createElement('i');
            iconElement.className = 'material-icons';
            iconElement.textContent = icon;
            iconElement.style.marginRight = '0.5rem';
            
            button.insertBefore(iconElement, button.firstChild);
        });
    }

    // Accessibility Enhancements
    initAccessibility() {
        // Add ARIA labels
        this.addAriaLabels();
        
        // Keyboard navigation
        this.initKeyboardNavigation();
        
        // Focus management
        this.initFocusManagement();
    }

    addAriaLabels() {
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label')) {
                const text = button.textContent.trim();
                if (text) {
                    button.setAttribute('aria-label', text);
                }
            }
        });
    }

    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Tab navigation enhancement
            if (e.key === 'Tab') {
                const focusableElements = document.querySelectorAll(
                    'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
                );
                
                focusableElements.forEach(el => {
                    el.addEventListener('focus', () => {
                        el.classList.add('focus-visible');
                    });
                    
                    el.addEventListener('blur', () => {
                        el.classList.remove('focus-visible');
                    });
                });
            }
        });
    }

    initFocusManagement() {
        // Skip links for screen readers
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Przejdź do głównej treści';
        skipLink.className = 'sr-only';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--witcher-dark);
            color: var(--witcher-gold);
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
            border: 1px solid var(--witcher-gold);
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Utility Methods
    viewLegend(id) {
        const content = `
            <div class="legend-viewer">
                <p>Ładowanie legendy ${id}...</p>
                <div class="witcher-loading"></div>
            </div>
        `;
        
        this.createModal('legend-viewer', 'Podgląd Legendy', content);
        this.openModal('legend-viewer');
        
        // Simulate loading
        setTimeout(() => {
            const modal = document.getElementById('modal-legend-viewer');
            if (modal) {
                const viewer = modal.querySelector('.legend-viewer');
                viewer.innerHTML = `
                    <h3>Legenda o Mistycznym Lesie</h3>
                    <p>W dawnych czasach, gdy lasy były gęstsze, a rzeki czystsze, żyli w naszych ziemiach różni ludzie i stworzenia...</p>
                    <div class="legend-meta">
                        <span class="legend-tag">folklor</span>
                        <span class="legend-tag">las</span>
                        <span class="legend-tag">duchy</span>
                    </div>
                `;
            }
        }, 1500);
    }

    editLegend(id) {
        const content = `
            <form class="legend-form">
                <div class="form-group">
                    <label for="legend-title">Tytuł legendy:</label>
                    <input type="text" id="legend-title" class="witcher-input" value="Legenda o Mistycznym Lesie">
                </div>
                <div class="form-group">
                    <label for="legend-content">Treść legendy:</label>
                    <textarea id="legend-content" class="witcher-textarea">W dawnych czasach, gdy lasy były gęstsze...</textarea>
                </div>
                <div class="form-group">
                    <label for="legend-tags">Tagi (oddzielone przecinkami):</label>
                    <input type="text" id="legend-tags" class="witcher-input" value="folklor, las, duchy">
                </div>
                <div class="form-actions">
                    <button type="button" class="witcher-btn" onclick="enhancedUI.saveLegend('${id}')">
                        <i class="material-icons">save</i>
                        Zapisz
                    </button>
                    <button type="button" class="witcher-btn secondary" onclick="enhancedUI.closeModal('legend-editor')">
                        <i class="material-icons">cancel</i>
                        Anuluj
                    </button>
                </div>
            </form>
        `;
        
        this.createModal('legend-editor', 'Edycja Legendy', content);
        this.openModal('legend-editor');
    }

    saveLegend(id) {
        this.showNotification('Legenda została zapisana pomyślnie!', 'success');
        this.closeModal('legend-editor');
        
        // Refresh masonry layout if needed
        if (this.masonry) {
            this.masonry.layout();
        }
    }
}

// Initialize Enhanced UI
const enhancedUI = new EnhancedUI();

// Export for global access
window.enhancedUI = enhancedUI;

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-family: var(--font-primary);
        color: var(--witcher-gold);
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(215, 203, 172, 0.3);
    }
    
    .legend-viewer {
        text-align: center;
    }
    
    .legend-viewer h3 {
        font-family: var(--font-primary);
        color: var(--witcher-gold);
        margin-bottom: 1rem;
    }
    
    .legend-viewer p {
        line-height: 1.6;
        margin-bottom: 1rem;
    }
`;
document.head.appendChild(style);

