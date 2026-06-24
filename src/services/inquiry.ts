import { supabase } from '../lib/supabase';
import { CyberInquiry, Location } from '../types/inquiry';

// Insert new inquiry and return reference code
export async function submitInquiry(formData: Omit<CyberInquiry, 'rating' | 'feedback'>): Promise<string> {
  const { data, error } = await supabase
    .rpc('create_inquiry', {
      p_category_id: Number(formData.category),
      p_location_id: Number(formData.location),
      p_description: formData.description,
      p_complainant_name: formData.complainantName || null,
      p_complainant_phone: formData.complainantPhone || null,
      p_money_lost: formData.moneyLost !== undefined ? formData.moneyLost : null,
    });

  if (error) throw error;
  return data || '';
}

// Update rating and feedback securely via database function
export async function submitFeedback(referenceId: string, rating: number, feedback?: string): Promise<void> {
  const { error } = await supabase
    .rpc('submit_inquiry_feedback', {
      p_reference_id: referenceId,
      p_rating: rating,
      p_feedback: feedback?.trim() || null,
    });

  if (error) throw error;
}

// Fetch inquiry details by reference ID with 30-day expiration check securely via database function
export async function fetchInquiryByReference(referenceId: string): Promise<CyberInquiry | null> {
  const { data, error } = await supabase
    .rpc('get_inquiry_by_reference', {
      p_reference_id: referenceId,
    })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const caseData = data as {
    category_id: number;
    location_id: number;
    description: string;
    rating: number | null;
    complainant_name: string | null;
    complainant_phone: string | null;
    feedback: string | null;
    reference_id: string;
    created_at: string;
    category_name: string;
    location_name: string;
    money_lost: number | null;
  };

  const createdTime = new Date(caseData.created_at).getTime();
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - createdTime > thirtyDaysInMs) {
    return null;
  }

  return {
    category: caseData.category_name,
    location: caseData.location_name,
    description: caseData.description,
    rating: caseData.rating || undefined,
    complainantName: caseData.complainant_name || undefined,
    complainantPhone: caseData.complainant_phone || undefined,
    feedback: caseData.feedback || undefined,
    referenceId: caseData.reference_id,
    createdAt: caseData.created_at,
    moneyLost: caseData.money_lost !== null ? caseData.money_lost : undefined,
  };
}

// Fetch alphabetical categories
export async function fetchCategories(): Promise<{ id: string; name: string; description: string }[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(c => ({ ...c, id: String(c.id) }));
}

// Fetch alphabetical locations
export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, taluk')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(l => ({ ...l, id: String(l.id) }));
}
