
// Instagram Auto-Reply Extension - Guaranteed Working Version
(function() {
    'use strict';
    
    let isActive = false;
    let personalMessage = '';
    let lastProcessedMessage = '';
    let messageCount = 0;
    
    console.log('🚀 Instagram Auto-Reply Extension Loading...');
    
    // Initialize extension
    function init() {
        loadSettings();
        startMessageMonitoring();
        showActiveIndicator();
        console.log('✅ Extension initialized and active');
    }
    
    // Load settings from storage
    function loadSettings() {
        chrome.storage.local.get(['personalDescription'], (result) => {
            personalMessage = result.personalDescription || "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!";
            console.log('📝 Loaded message:', personalMessage);
        });
    }
    
    // Show visual indicator that extension is active
    function showActiveIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'auto-reply-active';
        indicator.innerHTML = '🤖 AUTO-REPLY ON';
        indicator.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: #00ff00 !important;
            color: #000 !important;
            padding: 8px 15px !important;
            border-radius: 25px !important;
            font-weight: bold !important;
            font-size: 12px !important;
            z-index: 999999 !important;
            box-shadow: 0 4px 15px rgba(0,255,0,0.3) !important;
            animation: pulse 2s infinite !important;
        `;
        
        document.body.appendChild(indicator);
        
        // Remove after 8 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 8000);
    }
    
    // Start monitoring for messages
    function startMessageMonitoring() {
        console.log('👁️ Starting message monitoring...');
        
        // Monitor for new messages every 2 seconds
        setInterval(() => {
            if (window.location.href.includes('/direct/')) {
                checkForHelloMessage();
            }
        }, 2000);
        
        // Also monitor for send button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('button') && window.location.href.includes('/direct/')) {
                setTimeout(() => checkForHelloMessage(), 3000);
            }
        }, true);
        
        // Monitor for Enter key presses
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && window.location.href.includes('/direct/')) {
                setTimeout(() => checkForHelloMessage(), 3000);
            }
        }, true);
    }
    
    // Check for Hello messages
    function checkForHelloMessage() {
        console.log('🔍 Checking for Hello messages...');
        
        // Find all message elements
        const messageElements = document.querySelectorAll('div[dir="auto"]');
        
        for (let i = messageElements.length - 1; i >= Math.max(0, messageElements.length - 10); i--) {
            const element = messageElements[i];
            const text = element.textContent?.trim();
            
            if (text === 'Hello' || text === 'hello' || text === 'Hi' || text === 'hi') {
                console.log('💬 Found message:', text);
                
                // Check if this is our own message (sent by us)
                if (isOurMessage(element) && text !== lastProcessedMessage) {
                    console.log('🎯 This is our Hello message! Sending auto-reply...');
                    lastProcessedMessage = text;
                    sendAutoReply();
                    return;
                }
            }
        }
    }
    
    // Check if message is sent by us
    function isOurMessage(element) {
        let parent = element;
        for (let i = 0; i < 15; i++) {
            if (!parent) break;
            
            const style = window.getComputedStyle(parent);
            const classes = parent.className || '';
            
            // Multiple checks for outgoing messages
            if (style.justifyContent === 'flex-end' ||
                style.marginLeft === 'auto' ||
                style.textAlign === 'right' ||
                classes.includes('outgoing') ||
                parent.querySelector('[data-testid*="outgoing"]') ||
                parent.style.marginLeft && parent.style.marginLeft !== '0px') {
                return true;
            }
            
            parent = parent.parentElement;
        }
        return false;
    }
    
    // Send automatic reply
    function sendAutoReply() {
        console.log('📤 Sending automatic reply...');
        
        setTimeout(() => {
            const messageInput = findMessageInput();
            if (messageInput) {
                console.log('✅ Found message input, typing message...');
                
                // Clear and set message
                messageInput.focus();
                messageInput.click();
                
                if (messageInput.tagName === 'TEXTAREA') {
                    messageInput.value = personalMessage;
                } else {
                    messageInput.textContent = personalMessage;
                    messageInput.innerHTML = personalMessage;
                }
                
                // Trigger input events
                messageInput.dispatchEvent(new Event('input', { bubbles: true }));
                messageInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                console.log('💌 Message typed, sending...');
                
                // Send the message
                setTimeout(() => {
                    const sendButton = findSendButton();
                    if (sendButton) {
                        sendButton.click();
                        messageCount++;
                        
                        // Store in local storage
                        const messageData = {
                            timestamp: Date.now(),
                            message: personalMessage,
                            count: messageCount
                        };
                        
                        chrome.storage.local.get(['messageHistory'], (result) => {
                            const history = result.messageHistory || [];
                            history.push(messageData);
                            chrome.storage.local.set({ 
                                messageHistory: history,
                                totalMessagesSent: messageCount 
                            });
                        });
                        
                        console.log('🎉 AUTO-REPLY SENT SUCCESSFULLY!');
                        showSuccessNotification();
                    } else {
                        console.error('❌ Send button not found');
                    }
                }, 1000);
            } else {
                console.error('❌ Message input not found');
            }
        }, 2000);
    }
    
    // Find message input
    function findMessageInput() {
        const selectors = [
            'div[contenteditable="true"][role="textbox"]',
            'textarea[placeholder*="message" i]',
            'div[contenteditable="true"][aria-label*="message" i]',
            '[data-testid="message-input"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
                return element;
            }
        }
        
        return null;
    }
    
    // Find send button
    function findSendButton() {
        const selectors = [
            'button[type="submit"]',
            'button[aria-label*="send" i]',
            '[role="button"][aria-label*="send" i]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
                return element;
            }
        }
        
        // Fallback: find any button with Send text
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            if (button.textContent?.toLowerCase().includes('send') && button.offsetParent !== null) {
                return button;
            }
        }
        
        return null;
    }
    
    // Show success notification
    function showSuccessNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = '✅ AUTO-REPLY SENT!';
        notification.style.cssText = `
            position: fixed !important;
            top: 80px !important;
            right: 20px !important;
            background: #4CAF50 !important;
            color: white !important;
            padding: 12px 20px !important;
            border-radius: 25px !important;
            font-weight: bold !important;
            font-size: 14px !important;
            z-index: 999999 !important;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4) !important;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
    
    // Listen for settings updates
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'settingsUpdated') {
            loadSettings();
        }
        sendResponse({ status: 'received' });
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Re-initialize on Instagram navigation
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            if (currentUrl.includes('/direct/')) {
                console.log('🔄 Instagram navigation detected, re-initializing...');
                setTimeout(init, 3000);
            }
        }
    }, 2000);
    
})();
