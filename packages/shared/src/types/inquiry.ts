export interface Inquiry {
  _id: string;
  clientId: string;
  sessionId?: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  state?: string;
  service: string;
  details: string;
  company?: string;
  source: 'chatbot' | 'website' | 'manual';
  status: 'new' | 'contacted' | 'converted' | 'closed';
  externalApiStatus?: 'pending' | 'forwarded' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface InquiryResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  state?: string;
  service: string;
  details: string;
  company?: string;
  source: 'chatbot' | 'website' | 'manual';
  status: 'new' | 'contacted' | 'converted' | 'closed';
  createdAt: Date;
}

export interface CreateInquiryRequest {
  clientId: string;
  sessionId?: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  state?: string;
  service: string;
  details: string;
  company?: string;
}

export interface UpdateInquiryRequest {
  status?: 'new' | 'contacted' | 'converted' | 'closed';
  notes?: string;
}
