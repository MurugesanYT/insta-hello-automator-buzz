
// Instagram Auto-Reply Extension - BULLETPROOF VERSION
(function() {
    'use strict';
    
    console.log('🚀 BULLETPROOF Instagram Auto-Reply Loading...');
    
    let personalMessage = '';
    let isProcessing = false;
    let messagesSent = 0;
    let observer = null;
    
    // Load settings immediately
    function loadSettings() {
        chrome.storage.local.get(['personalDescription'], (result) => {
            personalMessage = result.personalDescription || "Hi! I'm excited to connect with you. I'm passionate about building meaningful connections and would love to learn more about what you do. Looking forward to our conversation!";
            console.log('✅ Message loaded:', personalMessage);
        });
    }
    
    // Initialize everything
    function init() {
        loadSettings();
        setupMessageObserver();
        startContinuousMonitoring();
        showStatus('🤖 AUTO-REPLY ACTIVE');
        console.log('✅ Extension fully initialized');
    }
    
    // Show status indicator
    function showStatus(message) {
        const existing = document.getElementById('auto-reply-status');
        if (existing) existing.remove();
        
        const status = document.createElement('div');
        status.id = 'auto-reply-status';
        status.textContent = message;
        status.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: #00ff00 !important;
            color: #000 !important;
            padding: 10px 20px !important;
            border-radius: 25px !important;
            font-weight: bold !important;
            font-size: 14px !important;
            z-index: 999999 !important;
            box-shadow: 0 4px 15px rgba(0,255,0,0.5) !important;
        `;
        document.body.appendChild(status);
        
        setTimeout(() => status.remove(), 5000);
    }
    
    // Setup mutation observer for real-time message detection
    function setupMessageObserver() {
        if (observer) observer.disconnect();
        
        observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    setTimeout(() => checkForHelloAndRespond(), 500);
                }
            });
        });
        
        const targetNode = document.body;
        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // Continuous monitoring every 2 seconds
    function startContinuousMonitoring() {
        setInterval(() => {
            if (window.location.href.includes('/direct/')) {
                checkForHelloAndRespond();
            }
        }, 2000);
    }
    
    // Main function to check for Hello and respond
    function checkForHelloAndRespond() {
        if (isProcessing) return;
        
        console.log('🔍 Checking for Hello messages...');
        
        // Find all possible message containers
        const messageSelectors = [
            'div[dir="auto"]',
            '[data-testid*="message"]',
            '.x1n2onr6',
            'div[role="gridcell"] div',
            'span[dir="auto"]'
        ];
        
        let allMessages = [];
        messageSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            allMessages = [...allMessages, ...Array.from(elements)];
        });
        
        // Check recent messages (last 10)
        const recentMessages = allMessages.slice(-10);
        
        for (let element of recentMessages) {
            const text = element.textContent?.trim().toLowerCase();
            
            if (text === 'hello' || text === 'hi' || text === 'hey') {
                console.log('💬 Found message:', text);
                
                if (isOurMessage(element)) {
                    console.log('🎯 This is OUR message! Sending auto-reply...');
                    sendAutoReply();
                    return;
                }
            }
        }
    }
    
    // Check if message is from us (multiple methods)
    function isOurMessage(element) {
        let parent = element;
        
        // Check up to 20 parent levels
        for (let i = 0; i < 20; i++) {
            if (!parent) break;
            
            const computedStyle = window.getComputedStyle(parent);
            const classList = Array.from(parent.classList || []);
            
            // Multiple indicators for our messages
            if (
                computedStyle.justifyContent === 'flex-end' ||
                computedStyle.marginLeft === 'auto' ||
                computedStyle.textAlign === 'right' ||
                parent.style.marginLeft && parent.style.marginLeft !== '0px' ||
                classList.some(cls => cls.includes('right') || cls.includes('end') || cls.includes('sent')) ||
                parent.querySelector('[aria-label*="You sent"]') ||
                parent.querySelector('[data-testid*="outgoing"]')
            ) {
                return true;
            }
            
            parent = parent.parentElement;
        }
        
        return false;
    }
    
    // Send automatic reply with multiple fallback methods
    function sendAutoReply() {
        if (isProcessing) return;
        isProcessing = true;
        
        console.log('📤 Starting auto-reply process...');
        showStatus('📝 TYPING MESSAGE...');
        
        setTimeout(() => {
            const input = findMessageInput();
            if (input) {
                console.log('✅ Input found, typing message...');
                typeMessage(input);
            } else {
                console.error('❌ No input found');
                isProcessing = false;
            }
        }, 1500);
    }
    
    // Find message input with multiple methods
    function findMessageInput() {
        const inputSelectors = [
            'div[contenteditable="true"][role="textbox"]',
            'textarea[placeholder*="message" i]',
            'div[contenteditable="true"][aria-label*="message" i]',
            'div[contenteditable="true"][data-testid*="message"]',
            'div[contenteditable="true"]',
            'textarea',
            '[role="textbox"]'
        ];
        
        for (let selector of inputSelectors) {
            const elements = document.querySelectorAll(selector);
            for (let element of elements) {
                if (element.offsetParent !== null && !element.disabled) {
                    return element;
                }
            }
        }
        
        return null;
    }
    
    // Type message with multiple methods
    function typeMessage(input) {
        try {
            // Method 1: Focus and clear
            input.focus();
            input.click();
            
            // Method 2: Set value/content
            if (input.tagName === 'TEXTAREA') {
                input.value = personalMessage;
            } else {
                input.textContent = personalMessage;
                input.innerHTML = personalMessage;
            }
            
            // Method 3: Dispatch events
            const events = ['input', 'change', 'keyup', 'paste'];
            events.forEach(eventType => {
                input.dispatchEvent(new Event(eventType, { bubbles: true }));
                input.dispatchEvent(new InputEvent(eventType, { bubbles: true, data: personalMessage }));
            });
            
            console.log('💌 Message typed successfully');
            showStatus('📤 SENDING MESSAGE...');
            
            // Send after delay
            setTimeout(() => sendMessage(), 1000);
            
        } catch (error) {
            console.error('❌ Error typing message:', error);
            isProcessing = false;
        }
    }
    
    // Send message with multiple methods
    function sendMessage() {
        try {
            const sendButton = findSendButton();
            
            if (sendButton) {
                sendButton.click();
                messagesSent++;
                
                // Store in local storage
                const messageData = {
                    timestamp: Date.now(),
                    message: personalMessage,
                    count: messagesSent
                };
                
                chrome.storage.local.get(['messageHistory', 'totalMessagesSent'], (result) => {
                    const history = result.messageHistory || [];
                    history.push(messageData);
                    chrome.storage.local.set({
                        messageHistory: history,
                        totalMessagesSent: messagesSent
                    });
                });
                
                console.log('🎉 MESSAGE SENT SUCCESSFULLY!');
                showStatus('✅ MESSAGE SENT!');
                
            } else {
                // Fallback: Try Enter key
                const input = findMessageInput();
                if (input) {
                    input.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        which: 13,
                        keyCode: 13,
                        bubbles: true
                    }));
                }
                console.log('🔄 Tried sending with Enter key');
            }
            
        } catch (error) {
            console.error('❌ Error sending message:', error);
        } finally {
            isProcessing = false;
        }
    }
    
    // Find send button with multiple methods
    function findSendButton() {
        const buttonSelectors = [
            'button[type="submit"]',
            'button[aria-label*="send" i]',
            'button[aria-label*="Send" i]',
            '[role="button"][aria-label*="send" i]',
            'button:contains("Send")',
            'div[role="button"][aria-label*="Send"]'
        ];
        
        for (let selector of buttonSelectors) {
            const elements = document.querySelectorAll(selector);
            for (let element of elements) {
                if (element.offsetParent !== null && !element.disabled) {
                    return element;
                }
            }
        }
        
        // Fallback: Find buttons with "Send" text
        const allButtons = document.querySelectorAll('button, div[role="button"]');
        for (let button of allButtons) {
            if (button.textContent?.toLowerCase().includes('send') && 
                button.offsetParent !== null) {
                return button;
            }
        }
        
        return null;
    }
    
    // Listen for settings updates
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'settingsUpdated') {
            loadSettings();
            showStatus('⚙️ SETTINGS UPDATED');
        }
        sendResponse({ status: 'received' });
    });
    
    // Monitor URL changes
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            console.log('🔄 URL changed, reinitializing...');
            setTimeout(init, 2000);
        }
    }, 1000);
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }
    
    console.log('🚀 BULLETPROOF Extension loaded and ready!');
    
})();
