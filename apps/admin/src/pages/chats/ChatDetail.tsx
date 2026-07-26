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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Chat Details</h1>
          <p className="text-gray-500">Chat ID: {chat.id}</p>
        </div>
        <Link to="/chats" className="text-blue-600 hover:text-blue-800">Back to Chats</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Chat Info</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Status:</dt>
              <dd>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  chat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>{chat.status}</span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Language:</dt>
              <dd className="font-medium">{chat.language}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Visitor:</dt>
              <dd className="font-medium text-sm truncate max-w-[150px]">{chat.visitorId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Created:</dt>
              <dd className="font-medium text-sm">{new Date(chat.createdAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Messages:</dt>
              <dd className="font-medium">{chat.messages?.length || 0}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Assignment</h2>
          {chat.assignedAgent ? (
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-medium">{chat.assignedAgent}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-3">Unassigned</p>
          )}
          {chat.status === 'active' && !isAssignedToMe && (
            <button onClick={handleAssign} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Assign to Me
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Agent Status</h2>
          <div className="flex gap-2">
            {(['online', 'away', 'offline'] as const).map(status => (
              <button
                key={status}
                onClick={() => handleSetAgentStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-lg capitalize ${
                  agentStatus === status
                    ? status === 'online' ? 'bg-green-600 text-white'
                    : status === 'away' ? 'bg-yellow-600 text-white'
                    : 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >{status}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Messages ({chat.messages?.length || 0})</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-2">
          {chat.messages?.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user' ? 'bg-blue-600 text-white'
                : message.sender === 'agent' ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-xs opacity-75 mb-1">
                  {message.sender === 'agent' ? 'Agent' : message.sender === 'user' ? 'Visitor' : 'Bot'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-200'
                  : message.sender === 'agent' ? 'text-purple-200'
                  : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {chat.status === 'active' && (
          <form onSubmit={handleSendReply} className="flex gap-2 border-t pt-4">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your agent reply..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send as Agent'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}