import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import Header from './components/Header';
import InquiryForm from './components/InquiryForm';
import InquiryReceipt from './components/InquiryReceipt';
import { CyberInquiry } from './types/inquiry';
import { submitInquiry, fetchInquiryByReference } from './services/inquiry';

export default function App() {
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'lookup'>('new');
  
  // Reference state
  const [referenceId, setReferenceId] = useState('');
  const [caseDetails, setCaseDetails] = useState<CyberInquiry | null>(null);
  
  // Loading & error states
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [recentRef, setRecentRef] = useState<string | null>(null);

  // Check URL parameter and localStorage on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      loadCase(ref, 'url');
    } else {
      const saved = localStorage.getItem('recent_inquiry_ref');
      if (saved) {
        setRecentRef(saved);
        loadCase(saved, 'localstorage');
      }
    }
  }, []);

  // Unified case loader helper
  const loadCase = async (refCode: string, source: 'url' | 'localstorage' | 'manual' = 'manual') => {
    const trimmed = refCode.trim();
    if (!trimmed) return;
    
    setIsSearching(true);
    setLookupError(null);
    
    try {
      const details = await fetchInquiryByReference(trimmed);
      if (details) {
        setCaseDetails(details);
        setReferenceId(trimmed);
        setSubmitted(true);
        
        // Synchronize URL query parameter if not already set
        const currentRef = new URLSearchParams(window.location.search).get('ref');
        if (currentRef !== trimmed) {
          const newUrl = `${window.location.origin}${window.location.pathname}?ref=${trimmed}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
      } else {
        if (source === 'url') {
          window.history.replaceState({}, '', window.location.pathname);
          setLookupError('This inquiry link has expired or is invalid.');
        } else if (source === 'localstorage') {
          localStorage.removeItem('recent_inquiry_ref');
          setRecentRef(null);
        } else {
          setLookupError('Reference ID has expired or is invalid.');
        }
      }
    } catch (err: unknown) {
      if (source === 'localstorage') {
        // Silently ignore mounting connection errors to avoid flashing transient errors
      } else {
        setLookupError(
          source === 'url'
            ? 'Unable to load reference from link.'
            : err instanceof Error ? err.message : 'Lookup failed due to a network error.'
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Submission handler
  const handleFormSubmit = async (formData: Omit<CyberInquiry, 'rating' | 'feedback'>) => {
    setIsSearching(true);
    try {
      const refCode = await submitInquiry(formData);
      localStorage.setItem('recent_inquiry_ref', refCode);
      setRecentRef(refCode);
      
      // Fetch details and transition view using unified loader
      await loadCase(refCode);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Submission succeeded, but failed to fetch details.');
      setIsSearching(false);
    }
  };

  // Reset/Back to home handler
  const handleReset = () => {
    // Clear localStorage to allow fresh submissions and prevent auto-redirect loop on next access
    localStorage.removeItem('recent_inquiry_ref');
    setRecentRef(null);

    setSubmitted(false);
    setReferenceId('');
    setCaseDetails(null);
    setActiveTab('new');
    setLookupError(null);
    
    // Remove query parameter from URL
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-kerala-gray font-sans text-slate-800 antialiased flex flex-col justify-between selection:bg-kerala-gold/20 selection:text-kerala-navy">
      <Header />

      <main className="flex-grow flex items-center justify-center py-6 sm:py-10 px-4 mt-8">
        <div className="w-full max-w-xl bg-white border border-slate-200 shadow-sm rounded overflow-hidden flex flex-col">
          
          {isSearching ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-kerala-gold animate-spin" />
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Retrieving case information...
              </span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="inquiry-main"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col"
                >
                  {/* Navigation Tabs */}
                  <div className="grid grid-cols-2 border-b border-slate-200 text-center font-bold text-xs uppercase tracking-wider font-mono">
                    <button
                      onClick={() => { setActiveTab('new'); setLookupError(null); }}
                      className={`py-3.5 transition-all border-b-2 cursor-pointer ${
                        activeTab === 'new'
                          ? 'border-kerala-navy text-kerala-navy font-extrabold bg-slate-50/30'
                          : 'border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/10'
                      }`}
                    >
                      File Incident Report
                    </button>
                    <button
                      onClick={() => { setActiveTab('lookup'); setLookupError(null); }}
                      className={`py-3.5 transition-all border-b-2 cursor-pointer ${
                        activeTab === 'lookup'
                          ? 'border-kerala-navy text-kerala-navy font-extrabold bg-slate-50/30'
                          : 'border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/10'
                      }`}
                    >
                      Follow-up / Feedback
                    </button>
                  </div>

                  {/* Local Storage Recall Banner */}
                  {activeTab === 'new' && recentRef && (
                    <div className="mx-5 sm:mx-7 mt-5 p-3.5 bg-amber-50/40 border border-kerala-gold/30 text-xs rounded text-left flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-kerala-navy uppercase text-[10px] tracking-wider block font-mono">
                          Recent Report Logged
                        </span>
                        <p className="text-slate-500 font-sans mt-0.5">
                          Inquiry ID: <span className="font-mono text-slate-700 font-extrabold">{recentRef}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => loadCase(recentRef)}
                        className="bg-kerala-navy hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 text-[10px] tracking-wide uppercase transition-all rounded cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        View Receipt
                      </button>
                    </div>
                  )}

                  {/* Tab 1: New Inquiry Form */}
                  {activeTab === 'new' && (
                    <InquiryForm onSubmit={handleFormSubmit} />
                  )}

                  {/* Tab 2: Manual Lookup Form */}
                  {activeTab === 'lookup' && (
                    <div className="p-5 sm:p-7 space-y-6">
                      <div className="text-left space-y-1.5">
                        <h2 className="text-base sm:text-lg font-extrabold text-kerala-navy uppercase tracking-tight">
                          Retrieve Case Record
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed font-sans">
                          Enter the official reference code generated during your previous submission. This allows you to review details and leave suggestions.
                        </p>
                      </div>

                      {lookupError && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left rounded">
                          {lookupError}
                        </div>
                      )}

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = (e.currentTarget.elements.namedItem('lookup-code') as HTMLInputElement).value;
                          loadCase(val);
                        }}
                        className="space-y-4 text-left"
                      >
                        <div>
                          <label htmlFor="lookup-code" className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                            Case Reference Code <span className="text-kerala-red font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            id="lookup-code"
                            name="lookup-code"
                            placeholder="e.g. 1-24062026"
                            className="w-full bg-white border border-slate-350 py-3 px-3.5 text-xs sm:text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:border-kerala-navy focus:ring-2 focus:ring-kerala-navy/10 rounded transition-all font-mono"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-kerala-navy hover:bg-slate-850 text-white font-extrabold py-3.5 px-6 tracking-wide uppercase text-xs transition-all flex items-center justify-center gap-2 cursor-pointer rounded border-2 border-kerala-gold active:scale-[0.99]"
                        >
                          Lookup Case
                        </button>
                      </form>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="submission-receipt"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col text-left"
                >
                  <InquiryReceipt
                    referenceId={referenceId}
                    caseDetails={caseDetails}
                    onReset={handleReset}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
