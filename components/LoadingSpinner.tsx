/**
 * Loading Spinner Component
 * 
 * Reusable loading indicator.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 24, 
  className = '',
  text 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 
        size={size} 
        className="animate-spin text-neon-blue" 
      />
      {text && (
        <p className="text-sm text-slate-400 font-mono">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;





