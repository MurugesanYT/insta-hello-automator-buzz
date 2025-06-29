
// Popup script - Guaranteed Working Version
document.addEventListener('DOMContentLoaded', function() {
    const personalDescriptionTextarea = document.getElementById('personalDescription');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');
    const charCount = document.getElementById('charCount');
    const totalMessages = document.getElementById('totalMessages');
    const todayMessages = document.getElementById('todayMessages');
    const recentHistory = document.getElementById('recentHistory');

    // Load settings on popup open
    loadSettings();
    loadStats();

    // Event listeners
    saveBtn.addEventListener('click', saveSettings);
    personalDescriptionTextarea.addEventListener('input', updateCharCount);

    function loadSettings() {
        chrome.storage.local.get(['personalDescription'], function(result) {
            personalDescriptionTextarea.value = result.personalDescription || 
                "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!";
            updateCharCount();
        });
    }

    function loadStats() {
        chrome.runtime.sendMessage({action: 'getStats'}, function(response) {
            if (response) {
                totalMessages.textContent = response.totalMessages || 0;
                
                // Calculate today's messages
                const today = new Date().toDateString();
                const todayCount = (response.recentMessages || []).filter(msg => 
                    new Date(msg.timestamp).toDateString() === today
                ).length;
                todayMessages.textContent = todayCount;
                
                // Display recent activity
                displayRecentActivity(response.recentMessages || []);
            }
        });
    }

    function displayRecentActivity(messages) {
        if (!messages || messages.length === 0) {
            recentHistory.innerHTML = '<div class="history-item">Ready to send auto-replies!</div>';
            return;
        }

        recentHistory.innerHTML = messages.reverse().slice(0, 5).map(msg => {
            const date = new Date(msg.timestamp);
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const dateStr = date.toLocaleDateString();
            
            return `
                <div class="history-item">
                    <div class="timestamp">${timeStr} - ${dateStr}</div>
                    <div>Auto-reply sent successfully</div>
                </div>
            `;
        }).join('');
    }

    function updateCharCount() {
        const length = personalDescriptionTextarea.value.length;
        charCount.textContent = `${length}/500`;
        
        if (length > 450) {
            charCount.style.color = '#ff6b6b';
        } else {
            charCount.style.color = '#FFD700';
        }
    }

    function saveSettings() {
        const personalDescription = personalDescriptionTextarea.value.trim();

        if (!personalDescription) {
            showStatus('Please enter a personal description', 'error');
            return;
        }

        if (personalDescription.length > 500) {
            showStatus('Message too long (max 500 characters)', 'error');
            return;
        }

        chrome.storage.local.set({
            personalDescription: personalDescription,
            isEnabled: true
        }, function() {
            showStatus('Settings saved! Extension is active 🚀', 'success');
            
            // Notify all Instagram tabs
            chrome.tabs.query({url: "*://*.instagram.com/*"}, function(tabs) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingsUpdated'
                    }).catch(() => {
                        // Ignore errors
                    });
                });
            });

            // Refresh stats
            setTimeout(loadStats, 1000);
        });
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type} show`;
        
        setTimeout(() => {
            status.classList.remove('show');
        }, 3000);
    }

    // Auto-refresh stats every 10 seconds
    setInterval(loadStats, 10000);
});
