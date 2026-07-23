/**
 * NestChat Widget Loader v1.0
 * 
 * Universal chatbot widget that can be embedded in any website.
 * Usage: <script src="https://chat.gridnestsolution.in/widget.js" data-client-id="YOUR_CLIENT_ID" defer></script>
 */
(function() {
  'use strict';

  const WIDGET_VERSION = '1.0.0';
  const DEFAULT_API_BASE = 'http://localhost:5000/api';
  const WIDGET_CONTAINER_ID = 'nestchat-widget-container';
  const SHADOW_DOM_ID = 'nestchat-shadow-root';
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  let retryCount = 0;
  let widgetInstance = null;

  function getApiBaseUrl() {
    const scripts = document.querySelectorAll('script[data-api-url]');
    if (scripts.length > 0) {
      return scripts[scripts.length - 1].getAttribute('data-api-url');
    }
    const currentScript = document.currentScript;
    if (currentScript) {
      return currentScript.getAttribute('data-api-url');
    }
    return DEFAULT_API_BASE;
  }

  // Get client ID from script tag
  function getClientId() {
    const scripts = document.querySelectorAll('script[data-client-id]');
    if (scripts.length > 0) {
      return scripts[scripts.length - 1].getAttribute('data-client-id');
    }
    // Fallback: check current script
    const currentScript = document.currentScript;
    if (currentScript) {
      return currentScript.getAttribute('data-client-id');
    }
    return null;
  }

  // Get widget version from script tag
  function getWidgetVersion() {
    const scripts = document.querySelectorAll('script[data-widget-version]');
    if (scripts.length > 0) {
      return scripts[scripts.length - 1].getAttribute('data-widget-version');
    }
    return WIDGET_VERSION;
  }

  // Validate domain against allowed domains
  function validateDomain(config) {
    if (!config.allowedDomains || config.allowedDomains.length === 0) {
      return true; // No domain restrictions
    }

    const currentDomain = window.location.hostname;
    const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
    
    // Allow localhost in development
    if (isLocalhost && config.allowLocalhost !== false) {
      return true;
    }

    return config.allowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        // Wildcard subdomain matching
        const baseDomain = domain.slice(2);
        return currentDomain === baseDomain || currentDomain.endsWith('.' + baseDomain);
      }
      return currentDomain === domain;
    });
  }

  // Fetch widget configuration from server
  async function fetchConfig(clientId) {
    const API_BASE = getApiBaseUrl();
    try {
      const response = await fetch(`${API_BASE}/widget-config/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load widget config');
      }

      return data.data;
    } catch (error) {
      console.error('[NestChat] Failed to fetch config:', error);
      throw error;
    }
  }

  // Create shadow DOM for style isolation
  function createShadowDOM() {
    let container = document.getElementById(WIDGET_CONTAINER_ID);
    
    if (!container) {
      container = document.createElement('div');
      container.id = WIDGET_CONTAINER_ID;
      container.style.cssText = 'position: fixed; z-index: 2147483647; pointer-events: none;';
      document.body.appendChild(container);
    }

    // Check if shadow DOM already exists
    const existingShadow = document.getElementById(SHADOW_DOM_ID);
    if (existingShadow) {
      return existingShadow.shadowRoot;
    }

    const shadowHost = document.createElement('div');
    shadowHost.id = SHADOW_DOM_ID;
    shadowHost.style.cssText = 'all: initial; pointer-events: none;';
    container.appendChild(shadowHost);

    return shadowHost.attachShadow({ mode: 'open' });
  }

  // Inject CSS into shadow DOM
  function injectStyles(shadowRoot, theme) {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: ${theme.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'};
      }

      .nestchat-widget {
        position: fixed;
        ${theme.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
        bottom: 20px;
        width: ${theme.width || '380px'};
        height: ${theme.height || '520px'};
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 40px);
        background: ${theme.backgroundColor || '#ffffff'};
        border-radius: ${theme.borderRadius || '16px'};
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        pointer-events: auto;
        z-index: 2147483647;
      }

      .nestchat-widget.open {
        transform: scale(1);
        opacity: 1;
      }

      .nestchat-bubble {
        position: fixed;
        ${theme.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
        bottom: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${theme.primaryColor || '#3B82F6'};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        pointer-events: auto;
        z-index: 2147483647;
      }

      .nestchat-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.25);
      }

      .nestchat-bubble svg {
        width: 28px;
        height: 28px;
        fill: white;
        transition: transform 0.3s ease;
      }

      .nestchat-bubble.active svg {
        transform: rotate(90deg);
      }

      .nestchat-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 18px;
        height: 18px;
        background: #ef4444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: bold;
      }

      .nestchat-header {
        padding: 16px;
        background: ${theme.primaryColor || '#3B82F6'};
        color: white;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .nestchat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .nestchat-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .nestchat-bot-info h3 {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
      }

      .nestchat-bot-info p {
        font-size: 12px;
        opacity: 0.9;
        margin: 0;
      }

      .nestchat-close {
        margin-left: auto;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        opacity: 0.8;
      }

      .nestchat-close:hover {
        opacity: 1;
      }

      .nestchat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .nestchat-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }

      .nestchat-message.bot {
        align-self: flex-start;
        background: #f3f4f6;
        color: #1f2937;
        border-bottom-left-radius: 4px;
      }

      .nestchat-message.user {
        align-self: flex-end;
        background: ${theme.primaryColor || '#3B82F6'};
        color: white;
        border-bottom-right-radius: 4px;
      }

      .nestchat-quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 16px 12px;
      }

      .nestchat-quick-btn {
        padding: 6px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        background: white;
        color: #374151;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .nestchat-quick-btn:hover {
        background: ${theme.primaryColor || '#3B82F6'};
        color: white;
        border-color: ${theme.primaryColor || '#3B82F6'};
      }

      .nestchat-input-area {
        padding: 12px 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        background: white;
      }

      .nestchat-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .nestchat-input:focus {
        border-color: ${theme.primaryColor || '#3B82F6'};
      }

      .nestchat-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${theme.primaryColor || '#3B82F6'};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
      }

      .nestchat-send:hover {
        background: ${theme.secondaryColor || '#2563eb'};
      }

      .nestchat-send svg {
        width: 20px;
        height: 20px;
        fill: white;
      }

      .nestchat-powered {
        text-align: center;
        padding: 8px;
        font-size: 11px;
        color: #9ca3af;
        background: #f9fafb;
      }

      .nestchat-powered a {
        color: ${theme.primaryColor || '#3B82F6'};
        text-decoration: none;
      }

      @media (max-width: 480px) {
        .nestchat-widget {
          width: calc(100vw - 20px);
          height: calc(100vh - 20px);
          max-width: none;
          max-height: none;
          border-radius: 0;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
        }
      }
    `;
    shadowRoot.appendChild(style);
  }

  // Create widget HTML structure
  function createWidgetHTML(config) {
    const theme = config.theme || {};
    const client = config.client || {};
    const widgetConfig = config.config || {};

    return `
      <div class="nestchat-bubble" id="nestchat-bubble">
        ${theme.showNotificationBadge !== false ? '<div class="nestchat-badge" id="nestchat-badge" style="display: none;">1</div>' : ''}
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </div>
      <div class="nestchat-widget" id="nestchat-widget">
        <div class="nestchat-header">
          <div class="nestchat-avatar">
            ${client.logo ? `<img src="${client.logo}" alt="${client.botName}">` : 
              `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`}
          </div>
          <div class="nestchat-bot-info">
            <h3>${client.botName || 'Assistant'}</h3>
            <p>${client.companyName || 'Online'}</p>
          </div>
          <button class="nestchat-close" id="nestchat-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="nestchat-messages" id="nestchat-messages">
          <div class="nestchat-message bot">
            ${widgetConfig.greetingMessage || 'Hello! How can I help you today?'}
          </div>
        </div>
        ${widgetConfig.quickActions && widgetConfig.quickActions.length > 0 ? `
          <div class="nestchat-quick-actions" id="nestchat-quick-actions">
            ${widgetConfig.quickActions.map(action => `
              <button class="nestchat-quick-btn" data-action="${action}">${action}</button>
            `).join('')}
          </div>
        ` : ''}
        <div class="nestchat-input-area">
          <input type="text" class="nestchat-input" id="nestchat-input" placeholder="Type your message..." />
          <button class="nestchat-send" id="nestchat-send">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <div class="nestchat-powered">
          Powered by <a href="https://gridnestsolution.in" target="_blank">NestChat</a>
        </div>
      </div>
    `;
  }

  // Initialize chat functionality
  function initChat(shadowRoot, config) {
    const API_BASE = getApiBaseUrl();
    const widget = shadowRoot.getElementById('nestchat-widget');
    const bubble = shadowRoot.getElementById('nestchat-bubble');
    const closeBtn = shadowRoot.getElementById('nestchat-close');
    const input = shadowRoot.getElementById('nestchat-input');
    const sendBtn = shadowRoot.getElementById('nestchat-send');
    const messagesContainer = shadowRoot.getElementById('nestchat-messages');
    const quickActions = shadowRoot.getElementById('nestchat-quick-actions');
    const badge = shadowRoot.getElementById('nestchat-badge');

    let isOpen = false;
    let conversationId = null;

    // Toggle widget
    function toggleWidget() {
      isOpen = !isOpen;
      widget.classList.toggle('open', isOpen);
      bubble.classList.toggle('active', isOpen);
      
      if (isOpen && badge) {
        badge.style.display = 'none';
      }

      if (isOpen && config.config?.autoOpenDelay) {
        input.focus();
      }
    }

    // Close widget
    function closeWidget() {
      isOpen = false;
      widget.classList.remove('open');
      bubble.classList.remove('active');
    }

    // Add message to chat
    function addMessage(content, sender = 'bot') {
      const messageDiv = document.createElement('div');
      messageDiv.className = `nestchat-message ${sender}`;
      messageDiv.textContent = content;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Send message to server
    async function sendMessage(text) {
      if (!text.trim()) return;

      addMessage(text, 'user');
      input.value = '';

      try {
        const response = await fetch(`${API_BASE}/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: config.client.clientId,
            message: text,
            conversationId: conversationId,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          conversationId = data.data.conversationId;
          setTimeout(() => {
            addMessage(data.data.response || 'I received your message.');
          }, 500);
        } else {
          addMessage(config.config?.fallbackMessage || 'Sorry, something went wrong. Please try again.');
        }
      } catch (error) {
        console.error('[NestChat] Error:', error);
        addMessage(config.config?.fallbackMessage || 'Sorry, I am having trouble connecting. Please try again later.');
      }
    }

    // Event listeners
    bubble.addEventListener('click', toggleWidget);
    closeBtn.addEventListener('click', closeWidget);
    
    sendBtn.addEventListener('click', () => {
      sendMessage(input.value);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage(input.value);
      }
    });

    // Quick action buttons
    if (quickActions) {
      quickActions.querySelectorAll('.nestchat-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action');
          sendMessage(action);
        });
      });
    }

    // Show notification badge after delay
    if (badge && config.config?.showNotificationBadge !== false) {
      setTimeout(() => {
        if (!isOpen) {
          badge.style.display = 'flex';
        }
      }, config.config?.autoOpenDelay || 3000);
    }

    // Auto open if configured
    if (config.config?.autoOpen) {
      setTimeout(() => {
        if (!isOpen) {
          toggleWidget();
        }
      }, config.config?.autoOpenDelay || 1000);
    }
  }

  // Main initialization
  async function init() {
    const clientId = getClientId();
    
    if (!clientId) {
      console.error('[NestChat] No client ID found. Add data-client-id to script tag.');
      return;
    }

    console.log(`[NestChat] Initializing widget for client: ${clientId}`);

    try {
      // Fetch configuration
      const config = await fetchConfig(clientId);

      // Validate domain
      if (!validateDomain(config)) {
        console.error('[NestChat] Domain not authorized for this widget.');
        return;
      }

      // Create shadow DOM
      const shadowRoot = createShadowDOM();

      // Inject styles
      injectStyles(shadowRoot, config.theme || {});

      // Create widget HTML
      shadowRoot.innerHTML += createWidgetHTML(config);

      // Initialize chat
      initChat(shadowRoot, config);

      console.log('[NestChat] Widget initialized successfully');

    } catch (error) {
      console.error('[NestChat] Failed to initialize widget:', error);
      
      // Retry mechanism
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`[NestChat] Retrying in ${RETRY_DELAY}ms (attempt ${retryCount}/${MAX_RETRIES})`);
        setTimeout(init, RETRY_DELAY * retryCount);
      } else {
        console.error('[NestChat] Max retries reached. Widget failed to load.');
      }
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose widget API
  window.NestChat = {
    version: WIDGET_VERSION,
    open: function() {
      const bubble = document.getElementById('nestchat-bubble');
      if (bubble) bubble.click();
    },
    close: function() {
      const closeBtn = document.getElementById('nestchat-close');
      if (closeBtn) closeBtn.click();
    },
    toggle: function() {
      const bubble = document.getElementById('nestchat-bubble');
      if (bubble) bubble.click();
    },
  };

})();
