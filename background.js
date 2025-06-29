
// Background script for Instagram Hello Automator
chrome.runtime.onInstalled.addListener(() => {
  console.log('Instagram Hello Automator installed');
  
  // Set default configuration
  chrome.storage.sync.get(['personalDescription', 'isEnabled'], (result) => {
    if (!result.personalDescription) {
      chrome.storage.sync.set({
        personalDescription: "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!",
        isEnabled: true,
        delay: 2000
      });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'helloDetected') {
    console.log('Hello message detected on Instagram');
    
    // Get user configuration
    chrome.storage.sync.get(['personalDescription', 'isEnabled', 'delay'], (result) => {
      if (result.isEnabled) {
        setTimeout(() => {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'sendFollowUp',
            message: result.personalDescription
          });
        }, result.delay || 2000);
      }
    });
  }
  
  sendResponse({status: 'received'});
});
