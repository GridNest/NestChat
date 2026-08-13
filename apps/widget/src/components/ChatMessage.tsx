import React from 'react';
import { Message } from '../types';
import { useWidgetStore } from '../store/chatStore';
import { toDirectImageUrl } from './ChatHeader';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { clientConfig, assignedAgent } = useWidgetStore();
  const [imgError, setImgError] = React.useState(false);
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';
  const isBot = message.sender === 'bot';
  const isBotOrAgent = !isUser;

  const rawAvatarSrc = isAgent
    ? (assignedAgent?.avatar || (clientConfig?.config as any)?.avatarUrl || clientConfig?.client?.logo || '')
    : ((clientConfig?.config as any)?.avatarUrl || clientConfig?.theme?.botAvatar || clientConfig?.client?.logo || '');
  const avatarSrc = toDirectImageUrl(rawAvatarSrc);

  React.useEffect(() => {
    setImgError(false);
  }, [avatarSrc, assignedAgent]);

  const agentDisplayName = message.agentName || assignedAgent?.name || 'Agent';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full my-1`}>
      {isAgent && (
        <span className="text-[11px] font-medium text-gray-500 ml-9 mb-1">
          {agentDisplayName}
        </span>
      )}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2 w-full`}>
        {isBotOrAgent && (
          avatarSrc && !imgError ? (
            <img
              src={avatarSrc}
              alt={isAgent ? agentDisplayName : 'Bot'}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1 border border-gray-200 shadow-xs"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mb-1 border border-blue-200">
              {isAgent ? '👤' : '🤖'}
            </div>
          )
        )}
        <div
          className={`max-w-[85%] sm:max-w-[80%] px-3.5 py-2.5 rounded-2xl break-words overflow-wrap-anywhere ${
            isBotOrAgent
              ? 'bg-gray-100 text-gray-800 rounded-bl-xs'
              : 'text-white rounded-br-xs'
          }`}
          style={
            isUser
              ? { backgroundColor: clientConfig?.theme?.primaryColor || '#3B82F6' }
              : undefined
          }
        >
          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
          <p
            className={`text-[10px] sm:text-xs mt-1 ${
              isBotOrAgent ? 'text-gray-400' : 'text-white/80'
            }`}
          >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          </p>
        </div>
      </div>
    </div>
  );
}

