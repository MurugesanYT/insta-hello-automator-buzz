
// Enhanced Popup script for Instagram Hello Automator - Always Active
document.addEventListener('DOMContentLoaded', function() {
  const personalDescriptionTextarea = document.getElementById('personalDescription');
  const delayInput = document.getElementById('delayInput');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  const charCount = document.getElementById('charCount');
  const totalMessages = document.getElementById('totalMessages');
  const todayMessages = document.getElementById('todayMessages');
  const recentHistory = document.getElementById('recentHistory');

  // Load settings and stats on popup open
  loadSettings();
  loadStats();

  // Event listeners
  saveBtn.addEventListener('click', saveSettings);
  personalDescriptionTextarea.addEventListener('input', updateCharCount);

  function loadSettings() {
    chrome.storage.local.get(['personalDescription', 'delay'], function(result) {
      personalDescriptionTextarea.value = result.personalDescription || 
        "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!";
      
      delayInput.value = (result.delay || 2000) / 1000; // Convert to seconds
      updateCharCount();
    });
  }

  function loadStats() {
    // Get stats from background script
    chrome.runtime.sendMessage({action: 'getStats'}, function(response) {
      if (response) {
        totalMessages.textContent = response.totalMessages || 0;
        
        // Calculate today's messages
        const today = new Date().toDateString();
        const todayCount = (response.recentMessages || []).filter(msg => 
          new Date(msg.timestamp).toDateString() === today
        ).length;
        todayMessages.textContent = todayCount;
        
        // Display recent messages
        displayRecentActivity(response.recentMessages || []);
      }
    });

    // Also get from local storage as backup
    chrome.storage.local.get(['totalMessagesSent', 'messageHistory'], function(result) {
      if (result.totalMessagesSent) {
        totalMessages.textContent = result.totalMessagesSent;
      }
      
      if (result.messageHistory) {
        const today = new Date().toDateString();
        const todayCount = result.messageHistory.filter(msg => 
          new Date(msg.timestamp).toDateString() === today
        ).length;
        todayMessages.textContent = todayCount;
        
        displayRecentActivity(result.messageHistory.slice(-5));
      }
    });
  }

  function displayRecentActivity(messages) {
    if (!messages || messages.length === 0) {
      recentHistory.innerHTML = '<div class="history-item">No messages sent yet</div>';
      return;
    }

    recentHistory.innerHTML = messages.reverse().map(msg => {
      const date = new Date(msg.timestamp);
      const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const dateStr = date.toLocaleDateString();
      
      return `
        <div class="history-item">
          <div class="timestamp">${timeStr} - ${dateStr}</div>
          <div>Sent to: ${msg.recipient || 'Instagram User'}</div>
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
    const delay = parseInt(delayInput.value) * 1000; // Convert to milliseconds

    if (!personalDescription) {
      showStatus('Please enter a personal description', 'error');
      return;
    }

    if (personalDescription.length > 500) {
      showStatus('Message too long (max 500 characters)', 'error');
      return;
    }

    const settings = {
      personalDescription: personalDescription,
      isEnabled: true, // Always enabled
      delay: delay
    };

    chrome.storage.local.set(settings, function() {
      showStatus('Settings saved successfully! 🚀', 'success');
      
      // Notify content scripts of the update
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'settingsUpdated',
            settings: settings
          }).catch(() => {
            // Ignore errors for inactive tabs
          });
        }
      });

      // Refresh stats after save
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

  // Auto-refresh stats every 30 seconds
  setInterval(loadStats, 30000);

  // Refresh stats when popup becomes visible
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      loadStats();
    }
  });

  // Auto-resize textarea
  personalDescriptionTextarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
  });

  // Add some visual feedback when typing
  personalDescriptionTextarea.addEventListener('focus', function() {
    this.style.borderColor = 'rgba(255,255,255,0.4)';
  });

  personalDescriptionTextarea.addEventListener('blur', function() {
    this.style.borderColor = 'rgba(255,255,255,0.1)';
  });

  // Validate delay input
  delayInput.addEventListener('input', function() {
    const value = parseInt(this.value);
    if (value < 1) this.value = 1;
    if (value > 10) this.value = 10;
  });
});
