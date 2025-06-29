
// Background script - Guaranteed Working Version
chrome.runtime.onInstalled.addListener(() => {
    console.log('🚀 Instagram Auto-Reply Extension Installed');
    
    // Set default settings
    chrome.storage.local.set({
        personalDescription: "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!",
        isEnabled: true,
        totalMessagesSent: 0,
        messageHistory: []
    }, () => {
        console.log('✅ Default settings saved');
    });
});

// Inject content script into Instagram tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('instagram.com')) {
        console.log('📱 Instagram tab detected, injecting script...');
        
        setTimeout(() => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            }).catch(() => {
                // Ignore injection errors
            });
        }, 2000);
    }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStats') {
        chrome.storage.local.get(['totalMessagesSent', 'messageHistory'], (result) => {
            sendResponse({
                totalMessages: result.totalMessagesSent || 0,
                recentMessages: (result.messageHistory || []).slice(-10)
            });
        });
        return true;
    }
    
    sendResponse({ status: 'received' });
});
