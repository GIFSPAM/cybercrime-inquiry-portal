import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, LayoutGrid, Info, User, FileText, Loader2, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Combobox from './Combobox';
import { CyberInquiry, Location } from '../types/inquiry';
import { fetchCategories, fetchLocations } from '../services/inquiry';

// Types

interface InquiryFormProps {
  onSubmit: (formData: Omit<CyberInquiry, 'rating' | 'feedback'>) => void;
}

interface CategoryRow {
  id: string;
  name: string;
  description: string;
}

// Helpers
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred.';
}

export default function InquiryForm({ onSubmit }: InquiryFormProps) {
  // Form states
  const [category, setCategory]               = useState('');
  const [location, setLocation]               = useState('');
  const [description, setDescription]         = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [moneyLost, setMoneyLost]             = useState('');

  // UI states
  const [error, setError]               = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown options loaded from services
  const [categories, setCategories]       = useState<CategoryRow[]>([]);
  const [locations, setLocations]         = useState<Location[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch options on mount
  useEffect(() => {
    let active = true;
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const [cats, locs] = await Promise.all([fetchCategories(), fetchLocations()]);
        if (active) {
          setCategories(cats);
          setLocations(locs);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        if (active) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => { active = false; };
  }, []);

  const clearError = () => { if (error) setError(null); };

  // Validation
  const validateForm = (): boolean => {
    if (!category) { setError('Please choose a crime category.'); return false; }
    if (!location)  { setError('Please choose a location.'); return false; }
    if (!description.trim() || description.trim().length < 15) {
      setError('Please write a brief description of what happened (at least 15 characters).');
      return false;
    }
    const phoneVal = complainantPhone.trim();
    if (phoneVal) {
      // Allows +91, 0, or no prefix, followed by 10 digits starting with 6-9 (optional spaces/hyphens stripped)
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneVal.replace(/[\s-]/g, ''))) {
        setError('Please enter a valid 10-digit phone number (optionally prefixed with +91 or 0).');
        return false;
      }
    }
    const moneyVal = moneyLost.trim();
    if (moneyVal) {
      const amount = Number(moneyVal);
      if (isNaN(amount) || amount < 0) {
        setError('Please enter a valid, non-negative financial loss amount.');
        return false;
      }
    }
    setError(null);
    return true;
  };

  // Submit form payload
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        category,
        location,
        description,
        complainantName:  complainantName.trim()  || undefined,
        complainantPhone: complainantPhone.trim() || undefined,
        moneyLost:        moneyLost.trim() ? Number(moneyLost) : undefined,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mapping state lists to dropdown options
  const selectedCategory = categories.find(c => c.id === category);
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const locationOptions = locations.map(l => ({ value: l.id, label: `${l.name} (${l.taluk} Taluk)` }));

  const inputClass =
    'w-full bg-white border border-slate-300 py-3 px-3.5 text-xs sm:text-sm text-slate-800 ' +
    'placeholder-slate-400 focus:outline-none focus:border-kerala-navy focus:ring-2 ' +
    'focus:ring-kerala-navy/10 rounded transition-all';

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="flex flex-col">
      {/* Gold accent bar */}
      <div className="h-1.5 bg-kerala-gold w-full" />

      {/* Form heading */}
      <div className="p-5 sm:p-7 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-base sm:text-lg font-extrabold text-kerala-navy uppercase tracking-tight flex items-center gap-2">
          Official Citizen Inquiry System
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-sans">
          Submit details regarding cyber safety issues. All incidents are processed securely by the state cyber division.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div role="alert" aria-live="polite" className="mx-5 sm:mx-7 mt-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="font-medium text-left">{error}</div>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────── */}
      <form onSubmit={handleFormSubmit} className="p-5 sm:p-7 space-y-6">

        {/* Section 1 — Category & Location */}
        <div className="space-y-4 text-left">
          <label className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-kerala-navy flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-kerala-gold" />
            <span>Category & Location</span>
          </label>

          <div className="grid grid-cols-1 gap-4">
            {/* Category */}
            <div>
              <label htmlFor="primary-classification" className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                Crime Category <span className="text-kerala-red font-bold">*</span>
              </label>
              <Combobox
                id="primary-classification"
                options={categoryOptions}
                value={category}
                onChange={(val) => { setCategory(val); clearError(); }}
                placeholder={loadingOptions ? 'Loading categories...' : '-- Choose Category --'}
                disabled={loadingOptions}
                required
              />
              {loadingOptions && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Fetching categories...</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location-selection" className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                Location <span className="text-kerala-red font-bold">*</span>
              </label>
              <Combobox
                id="location-selection"
                options={locationOptions}
                value={location}
                onChange={(val) => { setLocation(val); clearError(); }}
                placeholder={loadingOptions ? 'Loading locations...' : '-- Choose Location --'}
                disabled={loadingOptions}
                required
              />
              {loadingOptions && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Fetching locations...</span>
                </div>
              )}
            </div>
          </div>

          {/* Category help text (shown when a category is selected) */}
          <AnimatePresence mode="wait">
            {selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3.5 bg-[#FFFDF0] border border-kerala-gold/30 text-xs text-slate-700 rounded shadow-sm"
              >
                <div className="font-sans font-extrabold text-kerala-navy text-[11px] flex items-center gap-1.5 mb-1.5">
                  <Info className="w-4 h-4 text-kerala-gold" />
                  <span>OFFICIAL GUIDELINE DETAILS:</span>
                </div>
                <p className="leading-relaxed font-sans font-medium text-slate-750">
                  {selectedCategory.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 2 — Complainant details (optional) */}
        <div className="space-y-3 text-left">
          <label className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-kerala-navy flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-kerala-gold" />
            <span>
              Complainant details{' '}
              <span className="text-slate-400 font-normal font-sans text-[10px] lowercase">(optional)</span>
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="complainant-name" className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                id="complainant-name"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                placeholder="Citizen Name (optional)"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="complainant-phone" className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                id="complainant-phone"
                value={complainantPhone}
                onChange={(e) => setComplainantPhone(e.target.value)}
                placeholder="e.g., +91 9876543210 (optional)"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 3 — Financial Loss (optional) */}
        <div className="space-y-3 text-left">
          <label className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-kerala-navy flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-kerala-gold" />
            <span>
              Financial Loss{' '}
              <span className="text-slate-400 font-normal font-sans text-[10px] lowercase">(optional)</span>
            </span>
          </label>

          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-xs sm:text-sm">
              ₹
            </span>
            <input
              type="number"
              id="financial-loss"
              value={moneyLost}
              onChange={(e) => { setMoneyLost(e.target.value); clearError(); }}
              placeholder="e.g., 15000 (leave blank if no money was lost)"
              className={`${inputClass} pl-7`}
              min="0"
              step="any"
            />
            <p className="text-[10px] text-slate-400 font-sans mt-1">
              Enter the approximate amount lost in Indian Rupees (INR) if applicable.
            </p>
          </div>
        </div>

        {/* Section 4 — Description */}
        <div className="space-y-3 text-left">
          <label className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-kerala-navy flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-kerala-gold" />
            <span>Description</span>
          </label>

          <div>
            <label htmlFor="narrative-description" className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
              Describe what happened <span className="text-kerala-red font-bold">*</span>
            </label>
            <textarea
              id="narrative-description"
              rows={4}
              value={description}
              onChange={(e) => { setDescription(e.target.value); clearError(); }}
              placeholder="Please detail what happened — messages received, websites visited, suspicious files or settings..."
              className={`${inputClass} p-3.5 font-sans leading-relaxed`}
              maxLength={1500}
              required
            />
            <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-400 mt-1">
              <span>At least 15 characters</span>
              <span>{description.length} / 1500</span>
            </div>
          </div>
        </div>



        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-kerala-navy hover:bg-slate-850 text-white border-2 border-kerala-gold font-extrabold py-3.5 px-6 tracking-wide uppercase text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-kerala-gold" />
            )}
            <span>{isSubmitting ? 'Submitting...' : 'Submit Inquiry'}</span>
          </button>
          <p className="text-center text-[10px] text-slate-400 font-sans mt-3">
            Your feedback is analyzed by the Kerala Police Cyber Cell division. Secure processing.
          </p>
        </div>

      </form>
    </div>
  );
}
