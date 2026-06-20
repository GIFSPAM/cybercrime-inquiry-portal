import React from 'react';

export default function Header() {
  return (
    <header className="bg-kerala-navy text-white border-b-2 border-kerala-gold py-3.5 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Kerala_State_Police_Logo.png" 
            alt="Kerala Police Logo" 
            className="w-12 h-12 object-contain flex-shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase text-kerala-gold">
              Kerala Police
            </h1>
            <p className="text-[10px] text-white/90 uppercase tracking-widest font-mono font-semibold">
              Cyber Inquiry Portal
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
