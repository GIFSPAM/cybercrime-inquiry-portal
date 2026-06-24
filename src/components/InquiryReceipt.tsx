import React, { useState } from 'react';
import { CheckCircle, Copy, Check, Share2, FileText, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CyberInquiry } from '../types/inquiry';
import StarRating from './StarRating';
import { submitFeedback } from '../services/inquiry';

interface InquiryReceiptProps {
  referenceId: string;
  caseDetails?: CyberInquiry | null;
  onReset: () => void;
}

export default function InquiryReceipt({ referenceId, caseDetails, onReset }: InquiryReceiptProps) {
  const hasExistingRating = !!(caseDetails?.rating && caseDetails.rating > 0);

  // Feedback form states
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(hasExistingRating);
  const [submittedJustNow, setSubmittedJustNow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Copy states
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Helper to copy text to clipboard
  const handleCopyId = () => {
    navigator.clipboard.writeText(referenceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${referenceId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Submit feedback
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage('Please select a star rating first.');
      return;
    }
    try {
      setIsSubmittingFeedback(true);
      setErrorMessage(null);
      await submitFeedback(referenceId, rating, feedbackText);
      setFeedbackSubmitted(true);
      setSubmittedJustNow(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Shared input class string for consistency
  const inputClass =
    'w-full bg-white border border-slate-350 py-3 px-3.5 text-xs sm:text-sm text-slate-800 ' +
    'placeholder-slate-400 focus:outline-none focus:border-kerala-navy focus:ring-2 ' +
    'focus:ring-kerala-navy/10 rounded transition-all';

  return (
    <div className="relative flex flex-col w-full">
      {/* Gold Accent Bar */}
      <div className="h-1.5 bg-kerala-gold w-full absolute top-0 left-0" />

      {/* Main Container */}
      <div className="p-5 sm:p-8 space-y-6">
        
        {/* Success Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-4">
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full flex items-center justify-center border-2 border-emerald-100 shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-kerala-navy uppercase tracking-tight">
            Submission Received
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed font-sans">
            Your inquiry has been successfully logged by the State Cyber Cell Division. Please record the reference code below to track or update this case.
          </p>
        </div>

        {/* Reference ID Monospace Card */}
        <div className="border border-kerala-gold/30 bg-amber-50/20 p-5 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
               CASE REFERENCE Number:
            </span>
            <span className="text-lg sm:text-xl font-mono font-extrabold text-kerala-navy tracking-wide">
              {referenceId}
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Copy Reference ID */}
            <button
              onClick={handleCopyId}
              className="flex-grow sm:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold px-3 py-2 text-xs rounded transition-all cursor-pointer active:scale-95"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            {/* Shareable Link */}
            <button
              onClick={handleCopyLink}
              className="flex-grow sm:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold px-3 py-2 text-xs rounded transition-all cursor-pointer active:scale-95"
              title="Copy link to easily access this case from other devices"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Case Preview (If Details are Provided) */}
        {caseDetails && (
          <div className="border border-slate-200 bg-slate-50/50 p-4 rounded text-left space-y-2">
            <h3 className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-kerala-navy flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
              <FileText className="w-3.5 h-3.5 text-kerala-gold" />
              <span>Inquiry Summary Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase font-mono">Category</span>
                <span className="font-semibold text-slate-800">
                  {caseDetails.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase font-mono">Location</span>
                <span className="font-semibold text-slate-800">{caseDetails.location}</span>
              </div>

              {caseDetails.moneyLost !== undefined && caseDetails.moneyLost !== null && (
                <div className="col-span-2 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase font-mono">Financial Loss Reported</span>
                    <span className="font-extrabold text-sm text-rose-600 font-mono">
                      ₹ {caseDetails.moneyLost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-rose-50 text-rose-700 text-[10px] font-bold uppercase font-mono px-2.5 py-1 rounded-full border border-rose-100 flex items-center gap-1 select-none">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                    Financial Impact Case
                  </div>
                </div>
              )}

              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase font-mono">Narrative Brief</span>
                <p className="text-slate-650 leading-relaxed truncate-2-lines text-xs font-sans mt-0.5">
                  {caseDetails.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Star Rating & Feedback Form (Progression Section) */}
        <div className="border border-slate-200 rounded overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-3.5 text-left flex items-center justify-between">
            <span className="text-xs font-extrabold text-kerala-navy uppercase tracking-tight flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-kerala-gold fill-current" />
              <span>FEEDBACK: </span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Step 2 of 2</span>
          </div>

          <div className="p-4 sm:p-5">
            <AnimatePresence mode="wait">
              {!feedbackSubmitted ? (
                <motion.form
                  key="feedback-inputs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleFeedbackSubmit}
                  className="space-y-4"
                >
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-150 text-rose-800 text-xs text-left rounded">
                      {errorMessage}
                    </div>
                  )}

                  {/* Inline Star Rating Selector */}
                  <StarRating
                    rating={rating}
                    onChange={(val) => { setRating(val); setErrorMessage(null); }}
                  />

                  {/* Suggestions Textarea */}
                  <div className="space-y-2 text-left">
                    <label htmlFor="receipt-feedback" className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 font-sans">
                      Comments or Suggestions about our service
                    </label>
                    <textarea
                      id="receipt-feedback"
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Help us improve this application. Share comments about your portal experience..."
                      className={inputClass}
                      maxLength={1000}
                    />
                  </div>

                  {/* Submit Feedback Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback || rating === 0}
                    className="w-full bg-kerala-navy hover:bg-slate-850 text-white font-extrabold py-3 px-4 tracking-wide uppercase text-xs transition-all flex items-center justify-center gap-2 cursor-pointer rounded disabled:opacity-40 disabled:cursor-not-allowed border border-kerala-gold/30 active:scale-[0.99]"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 className="w-4 h-4 animate-spin text-kerala-gold" />
                    ) : (
                      <Check className="w-4 h-4 text-kerala-gold" />
                    )}
                    <span>{isSubmittingFeedback ? 'Saving Feedback...' : 'Submit Feedback'}</span>
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="feedback-success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 px-4 text-center space-y-3"
                >
                  <div className="text-kerala-gold text-2xl font-black tracking-wider">
                    {'★'.repeat(rating || caseDetails?.rating || 5) + '☆'.repeat(5 - (rating || caseDetails?.rating || 5))}
                  </div>
                  <h4 className="text-sm font-black text-kerala-navy uppercase tracking-wider">
                    {submittedJustNow ? 'Thank You for Your Feedback!' : 'Feedback Already Logged'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-sans">
                    {submittedJustNow
                      ? 'We will use your feedback to improve our service.'
                      : 'You have already submitted feedback for this inquiry. We appreciate your response.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Primary Action Row - Reset / Submit another */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onReset}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 px-6 tracking-wide uppercase text-xs transition-all cursor-pointer rounded text-center active:scale-[0.99]"
          >
            New Inquiry
          </button>
        </div>

      </div>
    </div>
  );
}
