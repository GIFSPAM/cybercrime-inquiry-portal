import { supabase } from '../lib/supabase';
import { CyberInquiry, Location } from '../types/inquiry';

// Insert new inquiry and return reference code
export async function submitInquiry(formData: Omit<CyberInquiry, 'rating' | 'feedback'>): Promise<string> {
  const { data, error } = await supabase
    .from('inquiries')
    .insert([{
      category_id: Number(formData.category),
      location_id: Number(formData.location),
      description: formData.description,
      complainant_name: formData.complainantName || null,
      complainant_phone: formData.complainantPhone || null,
    }])
    .select('reference_id')
    .single();

  if (error) throw error;
  return data?.reference_id || '';
}

// Update rating and feedback
export async function submitFeedback(referenceId: string, rating: number, feedback?: string): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .update({
      rating,
      feedback: feedback?.trim() || null,
    })
    .eq('reference_id', referenceId);

  if (error) throw error;
}

// Fetch inquiry details by reference ID with 7-day expiration check
export async function fetchInquiryByReference(referenceId: string): Promise<CyberInquiry | null> {
  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      category_id,
      location_id,
      description,
      rating,
      complainant_name,
      complainant_phone,
      feedback,
      reference_id,
      created_at,
      categories ( name ),
      locations ( name )
    `)
    .eq('reference_id', referenceId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const createdTime = new Date(data.created_at).getTime();
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - createdTime > thirtyDaysInMs) {
    return null;
  }

  const categoryName = (data.categories as any)?.name || String(data.category_id);
  const locationName = (data.locations as any)?.name || String(data.location_id);

  return {
    category: categoryName,
    location: locationName,
    description: data.description,
    rating: data.rating || undefined,
    complainantName: data.complainant_name || undefined,
    complainantPhone: data.complainant_phone || undefined,
    feedback: data.feedback || undefined,
    referenceId: data.reference_id,
    createdAt: data.created_at,
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
