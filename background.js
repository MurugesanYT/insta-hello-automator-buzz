
// Background script for Instagram Hello Automator - Always On Version
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 Instagram Hello Automator installed - Always On Mode');
  
  // Set extension to always be enabled
  chrome.storage.local.get(['personalDescription', 'isEnabled', 'messageHistory'], (result) => {
    const defaultSettings = {
      personalDescription: result.personalDescription || "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!",
      isEnabled: true,
      delay: 2000,
      messageHistory: result.messageHistory || [],
      totalMessagesSent: result.totalMessagesSent || 0,
      lastActive: Date.now()
    };
    
    chrome.storage.local.set(defaultSettings, () => {
      console.log('✅ Default settings initialized');
    });
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received message:', request);
  
  if (request.action === 'helloDetected') {
    console.log('🎯 Hello message detected - Processing auto-response...');
    
    // Get user configuration
    chrome.storage.local.get(['personalDescription', 'delay', 'messageHistory', 'totalMessagesSent'], (result) => {
      const message = result.personalDescription || "Hi! I'm excited to connect with you!";
      const delay = result.delay || 2000;
      
      console.log('⚡ Sending follow-up message after', delay, 'ms delay');
      console.log('💌 Message:', message);
      
      setTimeout(() => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'sendFollowUp',
          message: message
        }, (response) => {
          console.log('📨 Content script response:', response);
        });
        
        // Store message history
        const newHistory = {
          timestamp: Date.now(),
          recipient: request.recipient || 'Unknown User',
          message: message,
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
        }, () => {
          console.log('💾 Message history updated. Total sent:', updatedTotal);
        });
        
      }, delay);
    });
  }
  
  if (request.action === 'getStats') {
    chrome.storage.local.get(['messageHistory', 'totalMessagesSent', 'lastActive'], (result) => {
      const stats = {
        totalMessages: result.totalMessagesSent || 0,
        recentMessages: (result.messageHistory || []).slice(-10),
        lastActive: result.lastActive
      };
      console.log('📊 Sending stats:', stats);
      sendResponse(stats);
    });
    return true;
  }
  
  sendResponse({status: 'received'});
});

// Auto-activate on Instagram tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('instagram.com')) {
    console.log('🔄 Instagram tab loaded, activating extension...');
    
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: 'extensionActive',
        timestamp: Date.now()
      }).catch((error) => {
        console.log('⚠️ Could not reach content script:', error.message);
      });
    }, 3000);
  }
});

// Inject content script into existing Instagram tabs on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({url: "*://*.instagram.com/*"}, (tabs) => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
      }).catch(() => {
        // Ignore errors for tabs that can't be scripted
      });
    });
  });
});
