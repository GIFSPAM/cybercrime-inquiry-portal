import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import InquiryForm from './components/InquiryForm';
import InquiryReceipt from './components/InquiryReceipt';
import { CyberInquiry } from './types';
import { submitInquiry } from './api';

export default function App() {
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = async (formData: CyberInquiry) => {
    await submitInquiry(formData);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-kerala-gray font-sans text-slate-800 antialiased flex flex-col justify-between selection:bg-kerala-gold/20 selection:text-kerala-navy">
      <Header />

      <main className="flex-grow flex items-center justify-center py-6 sm:py-10 px-4">
        <div className="w-full max-w-xl bg-white border border-slate-200 shadow-sm rounded overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="inquiry-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col"
              >
                <InquiryForm onSubmit={handleFormSubmit} />
              </motion.div>
            ) : (
              <motion.div
                key="submission-receipt"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col text-left"
              >
                <InquiryReceipt />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
