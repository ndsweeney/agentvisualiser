import React, { useEffect, useState } from 'react';

const WELCOME_SHOWN_KEY = 'agentfactory_welcome_shown';

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the welcome message has been shown before
    const hasBeenShown = localStorage.getItem(WELCOME_SHOWN_KEY);
    
    if (!hasBeenShown) {
      // Show the modal on first visit
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    // Mark as shown in localStorage
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Black overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal content */}
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Warning icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-5xl">⚠️</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Experimental Workspace
          </h2>

          {/* Message */}
          <p className="text-base sm:text-lg text-gray-700 mb-3 leading-relaxed">
            This workspace is designed for building and visualising agent workflows.
          </p>
          
          <p className="text-base sm:text-lg font-semibold text-yellow-700 mb-8">
            Results are conceptual only
          </p>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 min-h-[56px]"
          >
            I Understand
          </button>
        </div>
      </div>
    </>
  );
};
