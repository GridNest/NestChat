import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface SearchResult {
  type: 'client' | 'knowledge' | 'faq' | 'chat' | 'inquiry';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await adminApi.globalSearch(query);
        setResults(response.data || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setQuery('');
    setIsOpen(false);
  };

  const typeIcons: Record<string, string> = {
    client: '👥',
    knowledge: '📚',
    faq: '❓',
    chat: '💬',
    inquiry: '📋',
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-3 sm:pl-10 sm:pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto z-50 min-w-[280px] sm:min-w-full">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No results found</div>
          ) : (
            <div className="py-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/60 flex items-center gap-3 min-h-[44px] transition-colors"
                >
                  <span className="text-lg flex-shrink-0">{typeIcons[result.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">{result.title}</div>
                    <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-blue-600 bg-blue-50 font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0">{result.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

