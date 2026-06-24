export interface CyberInquiry {
  category: string;
  location: string;
  description: string;
  rating?: number;
  complainantName?: string;
  complainantPhone?: string;
  feedback?: string;
  referenceId?: string;
  moneyLost?: number;
  createdAt?: string;
}

export interface Location {
  id: string;
  name: string;
  taluk: string;
}
