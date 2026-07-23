export interface FAQ {
  _id: string;
  clientId: string;
  category: string;
  question: string;
  answer: string;
  answerHi?: string;
  keywords: string[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FAQResponse {
  id: string;
  category: string;
  question: string;
  answer: string;
  answerHi?: string;
  keywords: string[];
  priority: number;
  isActive: boolean;
}

export interface CreateFAQRequest {
  clientId: string;
  category: string;
  question: string;
  answer: string;
  answerHi?: string;
  keywords: string[];
  priority?: number;
}

export interface UpdateFAQRequest {
  category?: string;
  question?: string;
  answer?: string;
  answerHi?: string;
  keywords?: string[];
  priority?: number;
  isActive?: boolean;
}
