import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: string;
}

interface ChatDetailData {
  id: string;
  visitorId: string;
  status: string;
  language: string;
  messages: Message[];
  createdAt: string;
  assignedAgent?: string | null;
  clientId?: string;
}

export function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const [chat, setChat] = useState<ChatDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>('offline');
  const { addToast } = useToast();

  useEffect(() => {
    if (id) fetchChat();
    fetchAgentStatus();
  }, [id]);

  const fetchChat = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getChatById(id!);
      setChat(response.data);
    } catch {
      addToast('error', 'Failed to fetch chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const response = await adminApi.getAgentStatus();
      setAgentStatus(response.data?.status || 'offline');
    } catch {
      // Agent not set up yet
    }
  };

  const handleAssign = async () => {
    try {
      await adminApi.assignChatToSelf(id!);
      addToast('success', 'Chat assigned to you');
      fetchChat();
    } catch {
      addToast('error', 'Failed to assign chat');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await adminApi.sendAgentMessage(id!, reply.trim());
      setReply('');
      fetchChat();
    } catch {
      addToast('error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSetAgentStatus = async (status: 'online' | 'offline' | 'away') => {
    try {
      await adminApi.setAgentStatus(status);
      setAgentStatus(status);
      addToast('success', `Status set to ${status}`);
    } catch {
      addToast('error', 'Failed to update status');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!chat) {
    return <div className="text-center py-8">Chat not found</div>;
  }

  const isAssignedToMe = chat.assignedAgent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Chat Details</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-mono mt-0.5">ID: {chat.id}</p>
        </div>
        <Link to="/chats" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors min-h-[44px] flex items-center justify-center self-start sm:self-auto">
          &larr; Back to Chats
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Chat Info</h2>
          <dl className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Status:</dt>
              <dd>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                  chat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>{chat.status}</span>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Language:</dt>
              <dd className="font-semibold text-gray-900 uppercase">{chat.language}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Visitor:</dt>
              <dd className="font-mono text-gray-800 text-xs truncate max-w-[140px]">{chat.visitorId}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Created:</dt>
              <dd className="font-medium text-gray-800">{new Date(chat.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Messages:</dt>
              <dd className="font-bold text-blue-600">{chat.messages?.length || 0}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Assignment</h2>
          {chat.assignedAgent ? (
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-200"></span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900">{chat.assignedAgent}</span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 mb-4">Unassigned</p>
          )}
          {chat.status === 'active' && !isAssignedToMe && (
            <button onClick={handleAssign} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors min-h-[44px]">
              Assign to Me
            </button>
          )}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 sm:col-span-2 lg:col-span-1">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Agent Status</h2>
          <div className="flex flex-wrap gap-2">
            {(['online', 'away', 'offline'] as const).map(status => (
              <button
                key={status}
                onClick={() => handleSetAgentStatus(status)}
                className={`flex-1 min-w-[80px] px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl capitalize transition-all min-h-[44px] ${
                  agentStatus === status
                    ? status === 'online' ? 'bg-green-600 text-white shadow-sm'
                    : status === 'away' ? 'bg-yellow-600 text-white shadow-sm'
                    : 'bg-gray-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >{status}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Messages ({chat.messages?.length || 0})</h2>
        
        <div className="space-y-3.5 max-h-[450px] overflow-y-auto p-3 bg-gray-50/50 rounded-xl border border-gray-100">
          {chat.messages?.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl break-words overflow-wrap-anywhere ${
                message.sender === 'user' ? 'bg-blue-600 text-white rounded-br-xs'
                : message.sender === 'agent' ? 'bg-purple-600 text-white rounded-bl-xs'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-xs shadow-xs'
              }`}>
                <p className="text-[11px] font-bold opacity-80 uppercase tracking-wider mb-1">
                  {message.sender === 'agent' ? 'Agent Intervention' : message.sender === 'user' ? 'Visitor' : 'AI Assistant'}
                </p>
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={`text-[10px] mt-1.5 ${
                  message.sender === 'user' ? 'text-blue-200'
                  : message.sender === 'agent' ? 'text-purple-200'
                  : 'text-gray-400'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {chat.status === 'active' && (
          <form onSubmit={handleSendReply} className="flex flex-col sm:flex-row gap-2.5 border-t border-gray-100 pt-4">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your agent reply..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm min-h-[44px]"
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 min-h-[44px] transition-colors shadow-sm"
            >
              {sending ? 'Sending...' : 'Send as Agent'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}