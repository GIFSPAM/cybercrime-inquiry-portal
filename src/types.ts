/** Shape of the inquiry payload submitted by the form and sent to Supabase. */
export interface CyberInquiry {
  category: string;
  location: string;
  description: string;
  rating: number;
  complainantName?: string;
  complainantPhone?: string;
  feedback?: string;
}

/** Shape of a location row returned from the Supabase `locations` table. */
export interface Location {
  id: string;
  name: string;
  taluk: string;
}
