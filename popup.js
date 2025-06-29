
// Popup script for Instagram Hello Automator
document.addEventListener('DOMContentLoaded', function() {
  const personalDescriptionTextarea = document.getElementById('personalDescription');
  const enableToggle = document.getElementById('enableToggle');
  const delayInput = document.getElementById('delayInput');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  // Load saved settings
  loadSettings();

  // Event listeners
  enableToggle.addEventListener('click', toggleEnable);
  saveBtn.addEventListener('click', saveSettings);

  function loadSettings() {
    chrome.storage.sync.get(['personalDescription', 'isEnabled', 'delay'], function(result) {
      personalDescriptionTextarea.value = result.personalDescription || "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!";
      
      if (result.isEnabled !== false) {
        enableToggle.classList.add('active');
      }
      
      delayInput.value = result.delay || 2;
    });
  }

  function toggleEnable() {
    enableToggle.classList.toggle('active');
  }

  function saveSettings() {
    const personalDescription = personalDescriptionTextarea.value.trim();
    const isEnabled = enableToggle.classList.contains('active');
    const delay = parseInt(delayInput.value) * 1000; // Convert to milliseconds

    if (!personalDescription) {
      showStatus('Please enter a personal description', 'error');
      return;
    }

    const settings = {
      personalDescription: personalDescription,
      isEnabled: isEnabled,
      delay: delay
    };

    chrome.storage.sync.set(settings, function() {
      showStatus('Settings saved successfully!', 'success');
      
      // Notify content scripts of the update
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url.includes('instagram.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'settingsUpdated',
            settings: settings
          });
        }
      });
    });
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type} show`;
    
    setTimeout(() => {
      status.classList.remove('show');
    }, 3000);
  }

  // Character counter for textarea
  personalDescriptionTextarea.addEventListener('input', function() {
    const length = this.value.length;
    const maxLength = 1000;
    
    if (length > maxLength) {
      this.value = this.value.substring(0, maxLength);
    }
  });

  // Auto-resize textarea
  personalDescriptionTextarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
  });
});
