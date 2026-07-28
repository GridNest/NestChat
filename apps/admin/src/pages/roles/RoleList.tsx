import React, { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

export function RoleList() {
  const [roles] = useState<Role[]>([
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access across all clients and administrative settings',
      permissions: ['All Permissions'],
      userCount: 2,
      isSystem: true,
    },
    {
      id: '2',
      name: 'Client Admin',
      description: 'Manage client widget settings, knowledge base, FAQs, and agent chats',
      permissions: ['Manage Knowledge', 'Manage FAQs', 'Manage Chats', 'View Analytics'],
      userCount: 15,
      isSystem: true,
    },
    {
      id: '3',
      name: 'Support Agent',
      description: 'Live chat intervention and answering visitor inquiries',
      permissions: ['Manage Chats', 'View Inquiries'],
      userCount: 28,
      isSystem: false,
    },
    {
      id: '4',
      name: 'Analyst',
      description: 'View-only access to analytics, audit logs, and performance reports',
      permissions: ['View Analytics', 'View Reports'],
      userCount: 5,
      isSystem: false,
    },
  ]);

  const columns = [
    {
      key: 'name',
      label: 'Role Name',
      sortable: true,
      render: (item: Role) => (
        <div>
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            <span>{item.name}</span>
            {item.isSystem && (
              <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                System
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{item.description}</div>
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (item: Role) => (
        <div className="flex flex-wrap gap-1 max-w-sm">
          {item.permissions.map((p, idx) => (
            <span key={idx} className="px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700 rounded-md">
              {p}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'userCount',
      label: 'Assigned Users',
      render: (item: Role) => (
        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
          {item.userCount} users
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Roles & Permissions</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage user access control roles and privilege scopes</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        emptyMessage="No roles defined"
      />
    </div>
  );
}
