export interface UnansweredQuestion {
  _id: string;
  clientId: string;
  question: string;
  sessionId: string;
  visitorId: string;
  count: number;
  firstAsked: Date;
  lastAsked: Date;
  convertedToFaq: boolean;
  faqId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnansweredQuestionResponse {
  id: string;
  question: string;
  count: number;
  firstAsked: Date;
  lastAsked: Date;
  convertedToFaq: boolean;
  faqId?: string;
}

export interface ConvertToFAQRequest {
  category: string;
  answer: string;
  answerHi?: string;
  keywords: string[];
}
