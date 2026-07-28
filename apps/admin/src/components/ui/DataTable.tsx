import React from 'react';

interface Column<T> {
  key: string;
  label: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-t border-gray-100 bg-gray-50"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
      <div className="overflow-x-auto w-full scrollbar-thin">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center gap-1.5 min-h-[24px]">
                    <span>{column.label}</span>
                    {column.sortable && sortBy === column.key && (
                      <span className="text-blue-600 font-bold text-sm">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className={`transition-colors hover:bg-blue-50/40 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 sm:px-6 py-3.5 text-sm text-gray-700 ${column.className || ''}`}>
                      {column.render
                        ? column.render(item)
                        : (item as any)[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

