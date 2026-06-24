import React from 'react';

export default function Header() {
  return (
    <header className="bg-white text-white  py-3.5 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Kerala_State_Police_Logo.png" 
            alt="Kerala Police Logo" 
            className="w-25 h-20 object-contain flex-shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-[20px] font-extrabold tracking-wider uppercase text-kerala-navy">
              Cyber Crime Police<br/>palakkad
            </h1>
            <p className="text-[15px] text-kerala-navy uppercase tracking-widest font-mono font-semibold">
            kerala
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-4 bg-[linear-gradient(115deg,#2e2567_0%,#2e2567_70%,#e52429_70%)]"></div>
    </header>
  );
}
