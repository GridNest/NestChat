import React from 'react';
import { useWidgetStore } from '../store/chatStore';
import { LANGUAGES } from '@nestchat/shared';

const LANG_BY_CODE = Object.fromEntries(Object.entries(LANGUAGES).map(([k, v]) => [k, v]));

/**
 * Converts various image URL formats to a directly embeddable URL.
 * Handles Google Drive share links → direct download links.
 */
function toDirectImageUrl(url?: string): string {
  if (!url) return '';
  // Google Drive: https://drive.google.com/file/d/FILE_ID/view?...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }
  // Google Drive: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }
  return url;
}

export function ChatHeader() {
  const { clientConfig, closeWidget, language, setLanguage } = useWidgetStore();

  if (!clientConfig) return null;

  const allowedLanguages = clientConfig.config.allowedLanguages || [];
  const primaryColor = clientConfig.theme.primaryColor || '#3B82F6';

  // Avatar priority: theme.botAvatar > config.avatarUrl > client.logo
  const rawAvatarUrl =
    clientConfig.theme.botAvatar ||
    (clientConfig.config as any)?.avatarUrl ||
    clientConfig.client?.logo ||
    '';
  const avatarUrl = toDirectImageUrl(rawAvatarUrl);

  return (
    <div
      className="p-4 text-white flex items-center justify-between"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={clientConfig.client?.botName || 'Chatbot'}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow-sm border border-white/20">
            🤖
          </div>
        )}
        <div>
          <h3 className="font-semibold text-sm sm:text-base leading-snug">{clientConfig.client?.botName || 'Assistant'}</h3>
          <p className="text-[11px] opacity-90 leading-tight">{clientConfig.client?.name || clientConfig.client?.companyName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {allowedLanguages.length > 1 && (
          <div className="flex gap-1">
            {allowedLanguages.map((lang) => {
              const langInfo = (LANGUAGES as Record<string, { code: string; name: string; nativeName: string }>)[lang];
              return (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 text-xs rounded ${
                    language === lang
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                  title={langInfo?.name || lang.toUpperCase()}
                >
                  {lang.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}
        
        <button
          onClick={closeWidget}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
