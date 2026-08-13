import React from 'react';
import { useWidgetStore } from '../store/chatStore';
import { LANGUAGES } from '@nestchat/shared';

const LANG_BY_CODE = Object.fromEntries(Object.entries(LANGUAGES).map(([k, v]) => [k, v]));

/**
 * Converts various image URL formats to a directly embeddable URL.
 * Handles Google Drive share links → direct download links.
 */
export function toDirectImageUrl(url?: string): string {
  if (!url) return '';
  // Google Drive: https://drive.google.com/file/d/FILE_ID/view?...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  // Google Drive: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }
  return url;
}

export function ChatHeader() {
  const { clientConfig, closeWidget, language, setLanguage, assignedAgent } = useWidgetStore();
  const [imgError, setImgError] = React.useState(false);

  if (!clientConfig) return null;

  const allowedLanguages = clientConfig.config.allowedLanguages || [];
  const primaryColor = clientConfig.theme.primaryColor || '#3B82F6';

  // Avatar priority: assignedAgent.avatar > config.avatarUrl > theme.botAvatar > client.logo
  const rawAvatarUrl =
    assignedAgent?.avatar ||
    (clientConfig.config as any)?.avatarUrl ||
    clientConfig.theme?.botAvatar ||
    clientConfig.client?.logo ||
    '';
  const avatarUrl = toDirectImageUrl(rawAvatarUrl);

  React.useEffect(() => {
    setImgError(false);
  }, [avatarUrl, assignedAgent]);

  const companyName = clientConfig.client?.name || clientConfig.client?.companyName || 'Support';
  const headerTitle = assignedAgent
    ? `${assignedAgent.name} from ${companyName.toLowerCase()}`
    : (clientConfig.client?.botName || 'Assistant');

  return (
    <div
      className="p-4 text-white flex items-center justify-between shadow-sm relative"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={headerTitle}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30 shadow-xs"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow-xs border border-white/20">
              {assignedAgent ? '👤' : '🤖'}
            </div>
          )}
          {assignedAgent && (
            <span className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5 shadow-xs animate-pulse" title="Human Agent Online" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-sm sm:text-base leading-snug flex items-center gap-1.5">
            {headerTitle}
          </h3>
          <p className="text-[11px] opacity-90 leading-tight flex items-center gap-1">
            {assignedAgent ? (
              <>
                <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full inline-block" />
                <span>Online</span>
              </>
            ) : (
              <span>{companyName}</span>
            )}
          </p>
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
