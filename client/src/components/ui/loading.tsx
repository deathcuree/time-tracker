import React, { useEffect, useState } from 'react';

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background transition-opacity duration-300 ease-in-out">
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-center opacity-0 animate-fade-in`}>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin-slow mx-auto"></div>
        </div>
      </div>
    </div>
  );
}; 