// Background script for Instagram Hello Automator - Always On Version
chrome.runtime.onInstalled.addListener(() => {
  console.log('Instagram Hello Automator installed - Always On Mode');
  
  // Set extension to always be enabled
  chrome.storage.local.get(['personalDescription', 'isEnabled', 'messageHistory'], (result) => {
    const defaultSettings = {
      personalDescription: result.personalDescription || "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!",
      isEnabled: true, // Always enabled
      delay: 2000,
      messageHistory: result.messageHistory || [],
      totalMessagesSent: result.totalMessagesSent || 0,
      lastActive: Date.now()
    };
    
    chrome.storage.local.set(defaultSettings);
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'helloDetected') {
    console.log('Hello message detected on Instagram - Auto-sending response');
    
    // Get user configuration
    chrome.storage.local.get(['personalDescription', 'delay', 'messageHistory', 'totalMessagesSent'], (result) => {
      // Always send since extension is always enabled
      setTimeout(() => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'sendFollowUp',
          message: result.personalDescription
        });
        
        // Store message history
        const newHistory = {
          timestamp: Date.now(),
          recipient: request.recipient || 'Unknown',
          message: result.personalDescription,
          url: sender.tab.url
        };
        
        const updatedHistory = [...(result.messageHistory || []), newHistory];
        const updatedTotal = (result.totalMessagesSent || 0) + 1;
        
        // Keep only last 100 messages
        if (updatedHistory.length > 100) {
          updatedHistory.splice(0, updatedHistory.length - 100);
        }
        
        chrome.storage.local.set({
          messageHistory: updatedHistory,
          totalMessagesSent: updatedTotal,
          lastActive: Date.now()
        });
        
      }, result.delay || 2000);
    });
  }
  
  if (request.action === 'getStats') {
    chrome.storage.local.get(['messageHistory', 'totalMessagesSent', 'lastActive'], (result) => {
      sendResponse({
        totalMessages: result.totalMessagesSent || 0,
        recentMessages: (result.messageHistory || []).slice(-10),
        lastActive: result.lastActive
      });
    });
    return true; // Keep message channel open for async response
  }
  
  sendResponse({status: 'received'});
});

// Auto-activate on Instagram tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('instagram.com')) {
    chrome.tabs.sendMessage(tabId, {
      action: 'extensionActive',
      timestamp: Date.now()
    }).catch(() => {
      // Ignore errors for tabs that don't have content script
    });
  }
});
