export interface Knowledge {
  _id: string;
  clientId: string;
  pageName: string;
  slug: string;
  title: string;
  content: string;
  metaDescription?: string;
  tags: string[];
  language: 'en' | 'hi' | 'both';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeResponse {
  id: string;
  pageName: string;
  slug: string;
  title: string;
  content: string;
  metaDescription?: string;
  tags: string[];
  language: 'en' | 'hi' | 'both';
  isActive: boolean;
}

export interface CreateKnowledgeRequest {
  clientId: string;
  pageName: string;
  slug: string;
  title: string;
  content: string;
  metaDescription?: string;
  tags: string[];
  language?: 'en' | 'hi' | 'both';
}

export interface UpdateKnowledgeRequest {
  pageName?: string;
  slug?: string;
  title?: string;
  content?: string;
  metaDescription?: string;
  tags?: string[];
  language?: 'en' | 'hi' | 'both';
  isActive?: boolean;
}
