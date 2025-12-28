/**
 * Demo Data Banner
 * 
 * Displays a banner when demo data is active, with option to clear it.
 */

import React, { useState } from 'react';
import { X, AlertCircle, Trash2 } from 'lucide-react';
import { clearDemoData } from '../services/mockDataService';
import { handleError } from '../utils/errorHandler';

interface DemoDataBannerProps {
  clubId: string;
  onDataCleared: () => Promise<void>;
  onDismiss?: () => void;
}

const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ 
  clubId, 
  onDataCleared,
  onDismiss 
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleClear = async () => {
    if (!confirm(
      'Are you sure you want to clear all demo data? This will remove all sample fixtures, players, content, and sponsors. This action cannot be undone.'
    )) {
      return;
    }

    setIsClearing(true);
    try {
      await clearDemoData(clubId, false); // Don't delete the club, just the data
      await onDataCleared();
      setIsDismissed(true);
    } catch (error) {
      handleError(error, 'Failed to clear demo data');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-purple-900/40 border border-cyan-500/30 rounded-lg p-4 mb-6 relative">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-cyan-300 font-semibold mb-1">Demo Data Active</h3>
          <p className="text-slate-300 text-sm mb-3">
            You're viewing sample data to help you explore PitchSide AI. 
            Once you're ready to start using your own data, clear the demo data below.
          </p>
          <button
            onClick={handleClear}
            disabled={isClearing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {isClearing ? 'Clearing...' : 'Clear Demo Data'}
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DemoDataBanner;

