import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function InquiryReceipt() {
  return (
    <div className="relative flex flex-col items-center justify-center text-center p-8 sm:p-12 space-y-6">
      <div className="h-1.5 bg-kerala-gold w-full absolute top-0 left-0" />

      <div className="bg-slate-50 text-emerald-600 p-5 rounded-full flex items-center justify-center border-2 border-emerald-100 shadow-sm mt-4">
        <CheckCircle className="w-14 h-14" />
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-kerala-navy uppercase tracking-tight">
        Submitted Successfully
      </h2>

      <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-sans">
        Your inquiry regarding cyber safety has been logged and received securely
        by the State Cyber Cell Division. Thank you for your submission.
      </p>
    </div>
  );
}
