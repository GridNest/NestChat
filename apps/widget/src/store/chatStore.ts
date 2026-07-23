import { create } from 'zustand';
import { WidgetState, Message, WidgetConfig } from '../types';
import { createApiClient } from '../services/api';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface WidgetStore extends WidgetState {
  setConfig: (config: WidgetConfig) => void;
  toggleWidget: () => void;
  openWidget: () => void;
  closeWidget: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  addMessage: (message: Message) => void;
  setTyping: (typing: boolean) => void;
  setCurrentView: (view: 'chat' | 'inquiry') => void;
  setInquiryStep: (step: string) => void;
  setInquiryData: (data: Record<string, string>) => void;
  initializeChat: (clientId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  handleQuickAction: (action: string) => void;
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  isOpen: false,
  language: 'en',
  messages: [],
  isTyping: false,
  currentView: 'chat',
  clientConfig: null,
  sessionId: generateId(),
  chatId: null,
  inquiryStep: '',
  inquiryData: {},

  setConfig: (config) => set({ clientConfig: config, language: config.defaultLanguage }),
  
  toggleWidget: () => set((state) => ({ isOpen: !state.isOpen })),
  
  openWidget: () => set({ isOpen: true }),
  
  closeWidget: () => set({ isOpen: false }),
  
  setLanguage: (lang) => set({ language: lang }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  setTyping: (typing) => set({ isTyping: typing }),
  
  setCurrentView: (view) => set({ currentView: view }),
  
  setInquiryStep: (step) => set({ inquiryStep: step }),
  
  setInquiryData: (data) => set({ inquiryData: data }),

  initializeChat: async (clientId: string) => {
    try {
      const api = createApiClient(clientId);
      const config = await api.getConfig();
      set({ clientConfig: config });

      const visitorId = localStorage.getItem('nestchat_visitor_id') || generateId();
      localStorage.setItem('nestchat_visitor_id', visitorId);

      const response = await api.startChat(
        get().sessionId,
        visitorId,
        get().language
      );

      set({
        chatId: response.chatId,
        messages: [response.welcomeMessage],
      });
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  },

  sendMessage: async (content: string) => {
    const { chatId, sessionId, language, clientConfig } = get();
    if (!chatId || !clientConfig) return;

    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      content,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isTyping: true,
    }));

    try {
      const clientId = clientConfig.clientName;
      const api = createApiClient(clientId);
      const response = await api.sendMessage(chatId, sessionId, content, language);

      set((state) => ({
        messages: [...state.messages, response.botMessage],
        isTyping: false,
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ isTyping: false });
    }
  },

  handleQuickAction: (action) => {
    const { clientConfig } = get();
    if (!clientConfig) return;

    const actionObj = clientConfig.quickActions.find((a) => a.action === action);
    if (actionObj) {
      const label = get().language === 'hi' && actionObj.labelHi
        ? actionObj.labelHi
        : actionObj.label;
      get().sendMessage(label);
    }
  },
}));
