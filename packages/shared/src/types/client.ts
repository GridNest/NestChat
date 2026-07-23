export interface Client {
  _id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  website?: string;
  industry?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientResponse {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  website?: string;
  industry?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  company: string;
  phone?: string;
  website?: string;
  industry?: string;
}

export interface UpdateClientRequest {
  name?: string;
  company?: string;
  phone?: string;
  website?: string;
  industry?: string;
  isActive?: boolean;
}
