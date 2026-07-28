import React from 'react';
import { QuickAction } from '../types';
import { useWidgetStore } from '../store/chatStore';

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const { handleQuickAction, language, clientConfig } = useWidgetStore();

  return (
    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto pr-1">
      {actions.map((action) => {
        const label = language === 'hi' && action.labelHi
          ? action.labelHi
          : action.label;

        const primaryColor = clientConfig?.theme?.primaryColor || '#3B82F6';

        return (
          <button
            key={action.id}
            onClick={() => handleQuickAction(action.action)}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium border rounded-full hover:bg-gray-50 active:scale-95 transition-all min-h-[36px] flex items-center justify-center text-center break-words max-w-full"
            style={{
              borderColor: primaryColor,
              color: primaryColor,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

