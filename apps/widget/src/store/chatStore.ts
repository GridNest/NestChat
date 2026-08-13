import { create } from 'zustand';
import { WidgetState, Message, ServerWidgetConfig } from '../types';
import { createApiClient } from '../services/api';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface WidgetStore extends WidgetState {
  setConfig: (config: ServerWidgetConfig) => void;
  toggleWidget: () => void;
  openWidget: () => void;
  closeWidget: () => void;
  setLanguage: (lang: string) => void;
  addMessage: (message: Message) => void;
  setTyping: (typing: boolean) => void;
  setCurrentView: (view: 'chat' | 'inquiry') => void;
  setInquiryStep: (step: string) => void;
  setInquiryData: (data: Record<string, string>) => void;
  initializeChat: (clientId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  syncChatHistory: () => Promise<void>;
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
  assignedAgent: null,

  setConfig: (config) => set({ clientConfig: config, language: config.language }),

  toggleWidget: () => {
    const nextOpen = !get().isOpen;
    set({ isOpen: nextOpen });
    if (nextOpen) {
      get().syncChatHistory();
    }
  },

  openWidget: () => {
    set({ isOpen: true });
    get().syncChatHistory();
  },

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
      set({ clientConfig: config, language: config.language });

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
      get().syncChatHistory();
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  },

  syncChatHistory: async () => {
    const { sessionId, clientConfig } = get();
    if (!sessionId || !clientConfig) return;
    try {
      const api = createApiClient(clientConfig.client.clientId);
      const historyData: any = await api.getHistory(sessionId);
      if (historyData) {
        const remoteMessages: any[] = Array.isArray(historyData) ? historyData : (historyData.messages || []);
        const assignedAgent = historyData.assignedAgent || null;
        if (remoteMessages && remoteMessages.length > 0) {
          const parsedMessages: Message[] = remoteMessages.map((m: any) => ({
            id: m.id || generateId(),
            sender: m.sender,
            content: m.content,
            timestamp: new Date(m.timestamp),
            agentName: m.metadata?.agentName || (m.sender === 'agent' ? assignedAgent?.name : undefined),
          }));
          set({ messages: parsedMessages, assignedAgent });
        } else if (assignedAgent) {
          set({ assignedAgent });
        }
      }
    } catch (_) {}
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
      const api = createApiClient(clientConfig.client.clientId);
      const response = await api.sendMessage(chatId, sessionId, content, language);

      if (response && response.botMessage) {
        set((state) => ({
          messages: [...state.messages, response.botMessage],
          isTyping: false,
        }));
      } else {
        set({ isTyping: false });
      }
      get().syncChatHistory();
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ isTyping: false });
    }
  },

  handleQuickAction: (action) => {
    const { clientConfig } = get();
    if (!clientConfig) return;

    const actionObj = clientConfig.config.quickActions.find((a) => a === action);
    if (actionObj) {
      get().sendMessage(actionObj);
    }
  },
}));