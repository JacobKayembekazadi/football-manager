import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animate = true,
}) => {
  const baseClasses = `bg-slate-700/50 ${animate ? 'animate-pulse' : ''}`;

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

// Pre-built skeleton layouts for common use cases
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-card p-6 rounded-xl border border-white/5 ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-3 w-full mb-2" />
    <Skeleton className="h-3 w-5/6 mb-2" />
    <Skeleton className="h-3 w-4/6" />
  </div>
);

export const PlayerCardSkeleton: React.FC = () => (
  <div className="glass-card p-4 rounded-xl border border-white/5">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-8 w-8" variant="rectangular" />
    </div>
    <div className="grid grid-cols-4 gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-6 w-8 mx-auto mb-1" />
          <Skeleton className="h-2 w-6 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const ContentCardSkeleton: React.FC = () => (
  <div className="glass-card p-4 rounded-xl border border-white/5">
    <div className="flex items-start gap-3">
      <Skeleton variant="rectangular" width={60} height={60} />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-3">
      <Skeleton className="h-5 w-16" variant="rectangular" />
      <Skeleton className="h-5 w-20" variant="rectangular" />
    </div>
  </div>
);

export const FixtureSkeleton: React.FC = () => (
  <div className="glass-card p-4 rounded-xl border border-white/5">
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-16" variant="rectangular" />
    </div>
    <div className="flex items-center justify-center gap-4">
      <div className="text-center">
        <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-2" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
      <Skeleton className="h-8 w-12" />
      <div className="text-center">
        <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-2" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <div className="flex items-center gap-4 p-4 border-b border-white/5">
    {[...Array(columns)].map((_, i) => (
      <Skeleton key={i} className="h-4 flex-1" />
    ))}
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="glass-card p-4 rounded-xl border border-white/5">
    <Skeleton className="h-3 w-20 mb-3" />
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-2 w-full" variant="rectangular" />
  </div>
);

// Loading overlay for views
export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm font-mono text-slate-400">{message}</p>
    </div>
  </div>
);

export default Skeleton;
