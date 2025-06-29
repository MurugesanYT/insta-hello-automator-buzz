// Background script - BULLETPROOF VERSION
chrome.runtime.onInstalled.addListener(() => {
    console.log('🚀 BULLETPROOF Instagram Auto-Reply Extension Installed');
    
    // Set robust default settings
    chrome.storage.local.set({
        personalDescription: "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!",
        isEnabled: true,
        totalMessagesSent: 0,
        messageHistory: [],
        autoReplyDelay: 2
    }, () => {
        console.log('✅ Default settings configured');
    });
});

// Aggressively inject into Instagram tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url?.includes('instagram.com')) {
        console.log('📱 Instagram detected:', tab.url);
        
        // Inject immediately when page loads
        if (changeInfo.status === 'complete') {
            setTimeout(() => {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }).then(() => {
                    console.log('✅ Script injected successfully');
                }).catch((error) => {
                    console.log('⚠️ Injection attempt:', error.message);
                });
            }, 1000);
        }
    }
});

// Handle popup messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStats') {
        chrome.storage.local.get(['totalMessagesSent', 'messageHistory'], (result) => {
            sendResponse({
                totalMessages: result.totalMessagesSent || 0,
                recentMessages: (result.messageHistory || []).slice(-20)
            });
        });
        return true;
    }
    
    if (request.action === 'updateSettings') {
        chrome.storage.local.set(request.settings, () => {
            // Notify all Instagram tabs
            chrome.tabs.query({url: "*://*.instagram.com/*"}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingsUpdated'
                    }).catch(() => {});
                });
            });
            sendResponse({ success: true });
        });
        return true;
    }
    
    sendResponse({ status: 'received' });
});

// Keep service worker alive
setInterval(() => {
    console.log('🔄 Service worker heartbeat');
}, 30000);
