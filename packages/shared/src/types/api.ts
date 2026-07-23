export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AnalyticsOverview {
  visitors: number;
  chats: number;
  leads: number;
  questions: number;
  unanswered: number;
  avgResponseTime: string;
  satisfactionRate: number;
  trend: {
    visitors: string;
    chats: string;
    leads: string;
  };
}
