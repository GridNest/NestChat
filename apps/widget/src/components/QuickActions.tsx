import React from 'react';
import { QuickAction } from '../types';
import { useWidgetStore } from '../store/chatStore';

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const { handleQuickAction, language, clientConfig } = useWidgetStore();

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action) => {
        const label = language === 'hi' && action.labelHi
          ? action.labelHi
          : action.label;

        return (
          <button
            key={action.id}
            onClick={() => handleQuickAction(action.action)}
            className="px-3 py-1.5 text-sm border rounded-full hover:bg-gray-50 transition-colors"
            style={{
              borderColor: clientConfig?.brandColor || '#3B82F6',
              color: clientConfig?.brandColor || '#3B82F6',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
