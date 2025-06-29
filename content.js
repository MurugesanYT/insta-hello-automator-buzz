
// Content script for Instagram automation
class InstagramAutomator {
  constructor() {
    this.lastMessageSent = '';
    this.isMonitoring = false;
    this.messageObserver = null;
    this.init();
  }

  init() {
    console.log('Instagram Hello Automator: Content script loaded');
    
    // Wait for Instagram to load completely
    setTimeout(() => {
      this.startMonitoring();
    }, 3000);

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'sendFollowUp') {
        this.sendAutomaticMessage(request.message);
      }
      sendResponse({status: 'received'});
    });
  }

  startMonitoring() {
    console.log('Starting Instagram message monitoring...');
    
    // Monitor for new messages in DMs
    this.observeMessageSending();
    this.observePageChanges();
  }

  observeMessageSending() {
    // Look for message input areas
    const messageContainers = document.querySelectorAll('[role="main"]');
    
    messageContainers.forEach(container => {
      // Monitor for new messages being sent
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.checkForHelloMessage(node);
              }
            });
          }
        });
      });

      observer.observe(container, {
        childList: true,
        subtree: true
      });
    });

    // Also monitor send button clicks
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.textContent === 'Send' || target.closest('[role="button"]')?.textContent === 'Send') {
        setTimeout(() => {
          this.checkRecentMessages();
        }, 500);
      }
    });
  }

  checkRecentMessages() {
    // Find the most recent messages in the conversation
    const messages = document.querySelectorAll('[data-testid="message-text"], [dir="auto"]');
    const recentMessages = Array.from(messages).slice(-5); // Check last 5 messages
    
    recentMessages.forEach(messageElement => {
      const messageText = messageElement.textContent?.trim();
      if (messageText === 'Hello' && this.isUserMessage(messageElement)) {
        console.log('Hello message detected!');
        this.handleHelloMessage();
      }
    });
  }

  checkForHelloMessage(element) {
    // Check if the element contains a "Hello" message
    const textElements = element.querySelectorAll('[data-testid="message-text"], [dir="auto"]');
    
    textElements.forEach(textElement => {
      const messageText = textElement.textContent?.trim();
      if (messageText === 'Hello' && this.isUserMessage(textElement)) {
        console.log('Hello message detected in new element!');
        this.handleHelloMessage();
      }
    });
  }

  isUserMessage(messageElement) {
    // Determine if the message is from the current user
    // Instagram typically styles user messages differently
    const messageContainer = messageElement.closest('[role="listitem"], [data-testid="message"]');
    if (!messageContainer) return false;

    // Look for indicators that this is a sent message (user's message)
    const isRightAligned = messageContainer.querySelector('[style*="flex-direction: row-reverse"], [style*="justify-content: flex-end"]');
    const hasSentIndicator = messageContainer.querySelector('[aria-label*="Sent"], [title*="Sent"]');
    
    return isRightAligned || hasSentIndicator || messageContainer.classList.contains('outgoing');
  }

  handleHelloMessage() {
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'helloDetected',
      timestamp: Date.now()
    });
  }

  async sendAutomaticMessage(message) {
    console.log('Attempting to send automatic follow-up message...');
    
    // Find the message input field
    const messageInput = this.findMessageInput();
    if (!messageInput) {
      console.log('Message input not found');
      return;
    }

    // Focus and type the message
    messageInput.focus();
    messageInput.click();
    
    // Clear existing text and set new message
    messageInput.value = '';
    messageInput.textContent = '';
    
    // Simulate typing
    this.typeMessage(messageInput, message);
    
    // Wait a bit then send
    setTimeout(() => {
      this.sendMessage();
    }, 1000);
  }

  findMessageInput() {
    // Various selectors for Instagram message input
    const selectors = [
      '[contenteditable="true"][data-testid="message-input"]',
      '[contenteditable="true"][aria-label*="Message"]',
      '[contenteditable="true"][placeholder*="Message"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[placeholder*="Message"]'
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input) return input;
    }

    return null;
  }

  typeMessage(input, message) {
    // Set the text content
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      input.value = message;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      input.textContent = message;
      input.innerHTML = message;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Trigger change events
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }

  sendMessage() {
    // Find and click send button
    const sendButtons = [
      'button[type="submit"]',
      '[role="button"][aria-label*="Send"]',
      'button:contains("Send")',
      '[data-testid="send-button"]'
    ];

    for (const selector of sendButtons) {
      const button = document.querySelector(selector);
      if (button && (button.textContent.includes('Send') || button.getAttribute('aria-label')?.includes('Send'))) {
        button.click();
        console.log('Automatic message sent!');
        break;
      }
    }
  }

  observePageChanges() {
    // Monitor for navigation changes in Instagram SPA
    const observer = new MutationObserver(() => {
      if (window.location.href.includes('/direct/')) {
        setTimeout(() => {
          this.observeMessageSending();
        }, 2000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize the automator when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new InstagramAutomator();
  });
} else {
  new InstagramAutomator();
}
