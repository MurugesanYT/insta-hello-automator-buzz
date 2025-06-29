
// Enhanced Content script for Instagram automation - Always Active
class InstagramAutomator {
  constructor() {
    this.lastMessageSent = '';
    this.isMonitoring = false;
    this.messageObserver = null;
    this.currentRecipient = '';
    this.processedMessages = new Set();
    this.personalDescription = '';
    this.delay = 2000;
    this.init();
  }

  async init() {
    console.log('🚀 Instagram Hello Automator: INITIALIZING...');
    
    // Load settings first
    await this.loadSettings();
    
    // Start monitoring immediately
    this.startMonitoring();
    
    // Re-initialize when navigating in Instagram SPA
    this.observePageChanges();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📨 Message received:', request);
      
      if (request.action === 'sendFollowUp') {
        console.log('⚡ Sending follow-up message:', request.message);
        this.sendAutomaticMessage(request.message);
      }
      if (request.action === 'extensionActive') {
        console.log('✅ Extension confirmed active on Instagram');
        this.startMonitoring();
      }
      if (request.action === 'settingsUpdated') {
        this.loadSettings();
      }
      sendResponse({status: 'received'});
    });
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['personalDescription', 'delay'], (result) => {
        this.personalDescription = result.personalDescription || "Hi! I'm excited to connect with you!";
        this.delay = result.delay || 2000;
        console.log('⚙️ Settings loaded:', { personalDescription: this.personalDescription, delay: this.delay });
        resolve();
      });
    });
  }

  startMonitoring() {
    console.log('👀 Instagram Auto-Monitor: STARTING...');
    
    // Clear existing observers
    if (this.messageObserver) {
      this.messageObserver.disconnect();
    }
    
    // Wait for Instagram to fully load
    setTimeout(() => {
      this.observeMessageSending();
      this.detectCurrentRecipient();
      this.addVisualIndicator();
    }, 3000);
  }

  addVisualIndicator() {
    // Add a visual indicator that the extension is active
    if (document.getElementById('ig-automator-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'ig-automator-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #00ff00;
      color: #000;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    indicator.textContent = '🤖 Auto-Reply Active';
    document.body.appendChild(indicator);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 5000);
  }

  detectCurrentRecipient() {
    // Try to get recipient name from URL or page elements
    const urlMatch = window.location.pathname.match(/\/direct\/t\/(\d+)/);
    if (urlMatch) {
      this.currentRecipient = urlMatch[1];
    }
    
    // Try to get name from header
    const headerName = document.querySelector('header h1, [role="banner"] h1, [data-testid="conversation-header"] span');
    if (headerName) {
      this.currentRecipient = headerName.textContent.trim();
    }
    
    console.log('👤 Current recipient:', this.currentRecipient);
  }

  observeMessageSending() {
    console.log('🔍 Setting up message observers...');
    
    // Monitor the entire document for new messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for new messages
              setTimeout(() => this.scanForHelloMessages(), 1000);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.messageObserver = observer;

    // Also monitor send button clicks and Enter key
    this.monitorUserActions();
    
    // Scan existing messages
    setTimeout(() => this.scanForHelloMessages(), 2000);
  }

  monitorUserActions() {
    // Monitor any click events on send buttons
    document.addEventListener('click', (event) => {
      const target = event.target;
      const sendButton = target.closest('button, [role="button"]');
      
      if (sendButton && this.isSendButton(sendButton)) {
        console.log('📤 Send button clicked - scanning for Hello...');
        setTimeout(() => {
          this.scanForHelloMessages();
          this.detectCurrentRecipient();
        }, 1500);
      }
    }, true);

    // Monitor keyboard events
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const activeElement = document.activeElement;
        if (this.isMessageInput(activeElement)) {
          console.log('⌨️ Enter pressed in message input - scanning for Hello...');
          setTimeout(() => {
            this.scanForHelloMessages();
            this.detectCurrentRecipient();
          }, 1500);
        }
      }
    }, true);
  }

  isSendButton(element) {
    const text = element.textContent?.toLowerCase() || '';
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    
    return text.includes('send') || 
           ariaLabel.includes('send') || 
           element.querySelector('svg[aria-label*="Send"]') !== null;
  }

  isMessageInput(element) {
    if (!element) return false;
    
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const placeholder = element.getAttribute('placeholder')?.toLowerCase() || '';
    const contentEditable = element.getAttribute('contenteditable') === 'true';
    
    return contentEditable && 
           (ariaLabel.includes('message') || placeholder.includes('message')) ||
           element.tagName === 'TEXTAREA' && placeholder.includes('message');
  }

  scanForHelloMessages() {
    console.log('🔎 Scanning for Hello messages...');
    
    // Multiple selectors for Instagram messages
    const messageSelectors = [
      '[data-testid="message-text"]',
      '[dir="auto"]:not([role="textbox"])',
      'div[dir="auto"]:not([contenteditable])',
      '[role="listitem"] div[dir="auto"]',
      'span[dir="auto"]'
    ];

    let foundMessages = [];
    
    messageSelectors.forEach(selector => {
      const messages = document.querySelectorAll(selector);
      foundMessages = [...foundMessages, ...Array.from(messages)];
    });

    console.log(`📋 Found ${foundMessages.length} potential message elements`);

    // Check the most recent messages first
    const recentMessages = foundMessages.slice(-20);
    
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const messageElement = recentMessages[i];
      const messageText = messageElement.textContent?.trim();
      
      console.log(`💬 Checking message: "${messageText}"`);
      
      if (messageText === 'Hello') {
        const messageId = this.generateMessageId(messageElement);
        
        if (this.isUserMessage(messageElement) && !this.processedMessages.has(messageId)) {
          console.log('🎯 HELLO MESSAGE DETECTED FROM USER! Processing...');
          this.processedMessages.add(messageId);
          this.handleHelloMessage();
          return; // Only process one at a time
        }
      }
    }
  }

  generateMessageId(element) {
    const text = element.textContent?.trim();
    const timestamp = Date.now();
    const position = Array.from(element.parentNode?.children || []).indexOf(element);
    return `${text}-${position}-${Math.floor(timestamp / 5000)}`; // 5 second window
  }

  isUserMessage(messageElement) {
    console.log('🔍 Checking if message is from user...');
    
    // Get the message container
    let container = messageElement;
    for (let i = 0; i < 10; i++) {
      container = container.parentElement;
      if (!container) break;
      
      // Check various indicators for sent/outgoing messages
      const containerStyle = window.getComputedStyle(container);
      const containerClasses = container.className || '';
      
      // Multiple ways to detect user's own messages
      const indicators = [
        containerStyle.justifyContent === 'flex-end',
        containerStyle.marginLeft === 'auto',
        containerStyle.textAlign === 'right',
        containerClasses.includes('outgoing'),
        container.querySelector('[aria-label*="Sent"]') !== null,
        container.querySelector('svg[aria-label*="Sent"]') !== null,
        // Check if message is on the right side
        container.style.marginLeft && container.style.marginLeft !== '0px',
        // Check for specific Instagram classes or attributes
        container.querySelector('[data-testid*="outgoing"]') !== null
      ];
      
      const isUserMsg = indicators.some(indicator => indicator);
      if (isUserMsg) {
        console.log('✅ Confirmed: This is a user message');
        return true;
      }
    }
    
    console.log('❌ This appears to be a received message');
    return false;
  }

  handleHelloMessage() {
    console.log('🚀 Processing Hello message - sending to background script...');
    
    chrome.runtime.sendMessage({
      action: 'helloDetected',
      timestamp: Date.now(),
      recipient: this.currentRecipient,
      url: window.location.href
    }, (response) => {
      console.log('📨 Background script response:', response);
    });
  }

  async sendAutomaticMessage(message) {
    console.log('📤 Starting automatic message send process...');
    console.log('💌 Message to send:', message);
    
    const messageInput = this.findMessageInput();
    if (!messageInput) {
      console.error('❌ Message input not found!');
      return;
    }

    console.log('✅ Message input found:', messageInput);

    // Focus and clear the input
    messageInput.focus();
    messageInput.click();
    
    // Clear existing content
    if (messageInput.value !== undefined) {
      messageInput.value = '';
    }
    if (messageInput.textContent !== undefined) {
      messageInput.textContent = '';
      messageInput.innerHTML = '';
    }

    // Set the message
    if (messageInput.tagName === 'TEXTAREA' || messageInput.tagName === 'INPUT') {
      messageInput.value = message;
    } else {
      messageInput.textContent = message;
      messageInput.innerHTML = message;
    }

    // Trigger events to make Instagram recognize the input
    const events = ['input', 'change', 'keyup', 'keydown', 'paste'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      messageInput.dispatchEvent(event);
    });

    console.log('⚡ Message set, waiting before sending...');
    
    // Wait and then send
    setTimeout(() => {
      this.clickSendButton();
    }, 1500);
  }

  findMessageInput() {
    console.log('🔍 Looking for message input...');
    
    const selectors = [
      '[aria-label*="Message"]',
      '[placeholder*="Message"]',
      '[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][aria-label*="Message"]',
      'textarea[placeholder*="Message"]',
      '[data-testid="message-input"]',
      'div[contenteditable="true"]:not([aria-label*="comment"])'
    ];

    for (const selector of selectors) {
      const inputs = document.querySelectorAll(selector);
      for (const input of inputs) {
        if (input.offsetParent !== null) { // Check if visible
          console.log('✅ Found message input with selector:', selector);
          return input;
        }
      }
    }

    console.log('❌ No message input found');
    return null;
  }

  clickSendButton() {
    console.log('🔍 Looking for send button...');
    
    const sendSelectors = [
      'button[type="submit"]',
      '[role="button"][aria-label*="Send"]',
      'button[aria-label*="Send"]',
      '[data-testid="send-button"]',
      'button:has(svg[aria-label*="Send"])'
    ];

    for (const selector of sendSelectors) {
      try {
        const buttons = document.querySelectorAll(selector);
        for (const button of buttons) {
          if (button.offsetParent !== null) { // Check if visible
            console.log('✅ Found send button, clicking...');
            button.click();
            console.log('🎉 AUTOMATIC MESSAGE SENT SUCCESSFULLY!');
            return;
          }
        }
      } catch (e) {
        console.log('⚠️ Send button selector failed:', selector, e);
      }
    }

    // Fallback: look for any button with "Send" text
    const allButtons = document.querySelectorAll('button, [role="button"]');
    for (const button of allButtons) {
      const buttonText = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      
      if ((buttonText.includes('send') || ariaLabel.includes('send')) && button.offsetParent !== null) {
        console.log('✅ Found send button via fallback, clicking...');
        button.click();
        console.log('🎉 AUTOMATIC MESSAGE SENT VIA FALLBACK!');
        return;
      }
    }

    console.error('❌ No send button found!');
  }

  observePageChanges() {
    let lastUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('🔄 Instagram navigation detected:', lastUrl);
        
        if (window.location.href.includes('/direct/')) {
          setTimeout(() => {
            this.startMonitoring();
            this.detectCurrentRecipient();
          }, 3000);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('popstate', () => {
      setTimeout(() => {
        if (window.location.href.includes('/direct/')) {
          this.startMonitoring();
        }
      }, 2000);
    });
  }
}

// Initialize the automator
const initializeAutomator = () => {
  if (window.instagramAutomator) {
    return;
  }
  
  console.log('🚀 INITIALIZING INSTAGRAM HELLO AUTOMATOR...');
  window.instagramAutomator = new InstagramAutomator();
};

// Multiple initialization methods
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAutomator);
} else {
  initializeAutomator();
}

// Re-initialize on focus
window.addEventListener('focus', () => {
  if (window.location.href.includes('instagram.com') && !window.instagramAutomator) {
    setTimeout(initializeAutomator, 2000);
  }
});

// Force re-initialize every 30 seconds if not working
setInterval(() => {
  if (window.location.href.includes('/direct/') && !window.instagramAutomator) {
    console.log('🔄 Force re-initializing automator...');
    initializeAutomator();
  }
}, 30000);
