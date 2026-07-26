export interface Translation {
  _id: string;
  clientId: string;
  language: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationResponse {
  id: string;
  clientId: string;
  language: string;
  key: string;
  value: string;
}

export interface CreateTranslationRequest {
  clientId: string;
  language: string;
  key: string;
  value: string;
}

export interface UpdateTranslationRequest {
  value?: string;
}

export interface TranslationsMap {
  [language: string]: {
    [key: string]: string;
  };
}

export interface BulkUpdateTranslationsRequest {
  clientId: string;
  translations: Array<{
    language: string;
    key: string;
    value: string;
  }>;
}