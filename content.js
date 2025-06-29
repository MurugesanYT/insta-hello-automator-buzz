
// Enhanced Content script for Instagram automation - Always Active
class InstagramAutomator {
  constructor() {
    this.lastMessageSent = '';
    this.isMonitoring = false;
    this.messageObserver = null;
    this.currentRecipient = '';
    this.processedMessages = new Set();
    this.init();
  }

  init() {
    console.log('Instagram Hello Automator: Always Active Mode Loaded');
    
    // Start monitoring immediately
    this.startMonitoring();
    
    // Re-initialize when navigating in Instagram SPA
    this.observePageChanges();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'sendFollowUp') {
        this.sendAutomaticMessage(request.message);
      }
      if (request.action === 'extensionActive') {
        console.log('Extension confirmed active on Instagram');
        this.startMonitoring();
      }
      sendResponse({status: 'received'});
    });
  }

  startMonitoring() {
    console.log('Instagram Auto-Monitor: ACTIVE');
    
    // Clear existing observers
    if (this.messageObserver) {
      this.messageObserver.disconnect();
    }
    
    // Wait for Instagram to fully load
    setTimeout(() => {
      this.observeMessageSending();
      this.detectCurrentRecipient();
    }, 2000);
  }

  detectCurrentRecipient() {
    // Try to get recipient name from URL or page elements
    const urlMatch = window.location.pathname.match(/\/direct\/t\/(\d+)/);
    if (urlMatch) {
      this.currentRecipient = urlMatch[1];
    }
    
    // Try to get name from header
    const headerName = document.querySelector('header h1, [role="banner"] h1');
    if (headerName) {
      this.currentRecipient = headerName.textContent.trim();
    }
  }

  observeMessageSending() {
    // Monitor the entire message thread area
    const messageThreads = document.querySelectorAll('[role="main"], [data-testid="message-thread"]');
    
    messageThreads.forEach(thread => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check immediately and after a short delay for dynamic content
                this.checkForHelloMessage(node);
                setTimeout(() => this.checkForHelloMessage(node), 500);
              }
            });
          }
        });
      });

      observer.observe(thread, {
        childList: true,
        subtree: true
      });
      
      this.messageObserver = observer;
    });

    // Also monitor send button clicks with enhanced detection
    document.addEventListener('click', (event) => {
      const target = event.target;
      const sendButton = target.closest('button[type="submit"], button[aria-label*="Send"], [role="button"]');
      
      if (sendButton && (sendButton.textContent.includes('Send') || sendButton.getAttribute('aria-label')?.includes('Send'))) {
        console.log('Send button clicked - checking for Hello message');
        setTimeout(() => {
          this.checkRecentMessages();
          this.detectCurrentRecipient();
        }, 800);
      }
    });

    // Monitor keyboard send (Enter key)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.getAttribute('contenteditable') === 'true') {
          setTimeout(() => {
            this.checkRecentMessages();
            this.detectCurrentRecipient();
          }, 800);
        }
      }
    });
  }

  checkRecentMessages() {
    // Enhanced message detection with multiple selectors
    const messageSelectors = [
      '[data-testid="message-text"]',
      '[dir="auto"]',
      '.x1lliihq', // Instagram's text class
      '[role="listitem"] div[dir="auto"]',
      'div[data-testid*="message"] div[dir="auto"]'
    ];

    let allMessages = [];
    messageSelectors.forEach(selector => {
      const messages = document.querySelectorAll(selector);
      allMessages = [...allMessages, ...Array.from(messages)];
    });

    // Get the most recent messages
    const recentMessages = allMessages.slice(-8);
    
    recentMessages.forEach(messageElement => {
      const messageText = messageElement.textContent?.trim();
      const messageId = this.generateMessageId(messageElement);
      
      if (messageText === 'Hello' && 
          this.isUserMessage(messageElement) && 
          !this.processedMessages.has(messageId)) {
        
        console.log('✓ Hello message detected from user - Triggering auto-response');
        this.processedMessages.add(messageId);
        this.handleHelloMessage();
      }
    });
  }

  generateMessageId(element) {
    // Create unique ID for message to prevent duplicate processing
    const text = element.textContent?.trim();
    const timestamp = Date.now();
    const position = Array.from(element.parentNode?.children || []).indexOf(element);
    return `${text}-${position}-${Math.floor(timestamp / 1000)}`;
  }

  checkForHelloMessage(element) {
    const messageSelectors = [
      '[data-testid="message-text"]',
      '[dir="auto"]',
      'div[dir="auto"]'
    ];

    messageSelectors.forEach(selector => {
      const textElements = element.querySelectorAll(selector);
      
      textElements.forEach(textElement => {
        const messageText = textElement.textContent?.trim();
        const messageId = this.generateMessageId(textElement);
        
        if (messageText === 'Hello' && 
            this.isUserMessage(textElement) && 
            !this.processedMessages.has(messageId)) {
          
          console.log('✓ New Hello message detected - Auto-responding');
          this.processedMessages.add(messageId);
          this.handleHelloMessage();
        }
      });
    });
  }

  isUserMessage(messageElement) {
    // Enhanced detection for user's own messages
    const messageContainer = messageElement.closest('[role="listitem"], [data-testid*="message"], div[class*="message"]');
    if (!messageContainer) return false;

    // Multiple indicators for sent messages
    const indicators = [
      messageContainer.querySelector('[style*="flex-direction: row-reverse"]'),
      messageContainer.querySelector('[style*="justify-content: flex-end"]'),
      messageContainer.querySelector('[aria-label*="Sent"]'),
      messageContainer.querySelector('[title*="Sent"]'),
      messageContainer.classList.contains('outgoing'),
      messageContainer.querySelector('svg[aria-label*="Sent"]'),
      // Check parent containers for alignment
      messageContainer.parentElement?.style.justifyContent === 'flex-end',
      messageContainer.style.marginLeft === 'auto'
    ];

    return indicators.some(indicator => indicator);
  }

  handleHelloMessage() {
    console.log('🚀 Sending Hello detection to background script');
    
    chrome.runtime.sendMessage({
      action: 'helloDetected',
      timestamp: Date.now(),
      recipient: this.currentRecipient,
      url: window.location.href
    });
  }

  async sendAutomaticMessage(message) {
    console.log('📤 Sending automatic follow-up message...');
    
    const messageInput = this.findMessageInput();
    if (!messageInput) {
      console.log('❌ Message input not found');
      return;
    }

    // Enhanced message input handling
    messageInput.focus();
    messageInput.click();
    
    // Clear and set message with multiple methods
    if (messageInput.tagName === 'TEXTAREA' || messageInput.tagName === 'INPUT') {
      messageInput.value = message;
    } else {
      messageInput.textContent = message;
      messageInput.innerHTML = message;
    }

    // Trigger all possible events
    ['input', 'change', 'keyup', 'paste'].forEach(eventType => {
      messageInput.dispatchEvent(new Event(eventType, { bubbles: true }));
    });

    // Send the message
    setTimeout(() => {
      this.sendMessage();
    }, 1200);
  }

  findMessageInput() {
    // Comprehensive selectors for Instagram message input
    const selectors = [
      '[aria-label*="Message"]',
      '[placeholder*="Message"]',
      '[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][data-testid*="message"]',
      'textarea[placeholder*="Message"]',
      '[data-testid="message-input"]',
      'div[contenteditable="true"]:not([data-testid*="comment"])'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input && input.offsetParent !== null) { // Check if visible
        return input;
      }
    }

    return null;
  }

  sendMessage() {
    // Enhanced send button detection
    const sendSelectors = [
      'button[type="submit"]',
      '[role="button"][aria-label*="Send"]',
      'button:has(svg[aria-label*="Send"])',
      '[data-testid="send-button"]',
      'button[aria-label*="Send message"]'
    ];

    for (const selector of sendSelectors) {
      try {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          button.click();
          console.log('✅ Automatic message sent successfully!');
          return;
        }
      } catch (e) {
        console.log('Send button selector failed:', selector);
      }
    }

    // Fallback: look for any button with "Send" text
    const allButtons = document.querySelectorAll('button, [role="button"]');
    for (const button of allButtons) {
      if (button.textContent?.includes('Send') || 
          button.getAttribute('aria-label')?.includes('Send')) {
        button.click();
        console.log('✅ Automatic message sent via fallback!');
        break;
      }
    }
  }

  observePageChanges() {
    // Enhanced navigation monitoring for Instagram SPA
    let lastUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('Instagram navigation detected:', lastUrl);
        
        if (window.location.href.includes('/direct/')) {
          setTimeout(() => {
            this.startMonitoring();
            this.detectCurrentRecipient();
          }, 2000);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        if (window.location.href.includes('/direct/')) {
          this.startMonitoring();
        }
      }, 1000);
    });
  }
}

// Enhanced initialization
const initializeAutomator = () => {
  if (window.instagramAutomator) {
    return; // Already initialized
  }
  
  window.instagramAutomator = new InstagramAutomator();
  console.log('Instagram Hello Automator: Ready and Always Active! 🚀');
};

// Multiple initialization methods
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAutomator);
} else {
  initializeAutomator();
}

// Re-initialize on focus (in case Instagram reloads content)
window.addEventListener('focus', () => {
  if (window.location.href.includes('instagram.com') && !window.instagramAutomator) {
    setTimeout(initializeAutomator, 1000);
  }
});
