import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface ChatDetail {
  id: string;
  visitorId: string;
  status: string;
  language: string;
  messages: Message[];
  createdAt: string;
}

export function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const [chat, setChat] = useState<ChatDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChat();
    }
  }, [id]);

  const fetchChat = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getChatById(id!);
      setChat(response.data);
    } catch (error) {
      console.error('Failed to fetch chat:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!chat) {
    return <div className="text-center py-8">Chat not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Chat Details</h1>
          <p className="text-gray-500">Chat ID: {chat.id}</p>
        </div>
        <Link to="/chats" className="text-blue-600 hover:text-blue-800">
          Back to Chats
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Chat Info</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Status:</dt>
              <dd>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  chat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {chat.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Language:</dt>
              <dd className="font-medium">{chat.language}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Visitor:</dt>
              <dd className="font-medium">{chat.visitorId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Created:</dt>
              <dd className="font-medium">{new Date(chat.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Messages ({chat.messages?.length || 0})</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {chat.messages?.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
