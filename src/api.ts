import { supabase } from './supabaseClient';
import { CyberInquiry, Location } from './types';

/* ── Translation helpers ───────────────────────────────── */

/** Convert a numeric DB id to the string format used by the frontend. */
const stringifyId = (id: number): string => String(id);

/** Convert a frontend string id back to the numeric format used by the DB. */
const parseId = (id: string): number => Number(id);

/* ── API functions ─────────────────────────────────────── */

/** Insert a new inquiry row into the Supabase `inquiries` table. */
export async function submitInquiry(formData: CyberInquiry): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .insert([{
      category_id: parseId(formData.category),
      location_id: parseId(formData.location),
      description: formData.description,
      rating: formData.rating,
      complainant_name: formData.complainantName || null,
      complainant_phone: formData.complainantPhone || null,
      feedback: formData.feedback || null,
    }]);

  if (error) throw new Error(error.message);
}

/** Fetch all categories from the Supabase `categories` table (alphabetical). */
export async function fetchCategories(): Promise<{ id: string; name: string; description: string }[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(c => ({ ...c, id: stringifyId(c.id) }));
}

/** Fetch all locations from the Supabase `locations` table (alphabetical). */
export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, taluk')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(l => ({ ...l, id: stringifyId(l.id) }));
}
