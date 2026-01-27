import React, { useState, useEffect, ReactNode } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  borderColor?: string;
  children: ReactNode;
  /** Unique ID for accordion behavior */
  sectionId?: string;
  /** Currently expanded section ID (for accordion - only one open at a time on mobile) */
  expandedSection?: string | null;
  /** Callback when section is toggled */
  onToggle?: (sectionId: string, isExpanded: boolean) => void;
  /** Force expanded state (overrides internal state) */
  forceExpanded?: boolean;
  /** Default expanded on mobile (default: false) */
  defaultExpandedMobile?: boolean;
  /** Default expanded on desktop (default: true) */
  defaultExpandedDesktop?: boolean;
  /** Additional className for the container */
  className?: string;
}

/**
 * CollapsibleSection - Responsive collapsible panel
 *
 * - Collapsed by default on mobile (<768px)
 * - Expanded by default on desktop
 * - Supports accordion behavior when used with expandedSection prop
 * - Uses existing animation classes from index.css
 */
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  titleHighlight,
  subtitle,
  icon: Icon,
  iconColor = 'text-green-500',
  borderColor = 'border-green-500/20',
  children,
  sectionId,
  expandedSection,
  onToggle,
  forceExpanded,
  defaultExpandedMobile = false,
  defaultExpandedDesktop = true,
  className = '',
}) => {
  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(true);

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Set initial state based on screen size
      setInternalExpanded(mobile ? defaultExpandedMobile : defaultExpandedDesktop);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [defaultExpandedMobile, defaultExpandedDesktop]);

  // Determine if section is expanded
  const isExpanded = forceExpanded !== undefined
    ? forceExpanded
    : (expandedSection !== undefined && sectionId)
      ? expandedSection === sectionId
      : internalExpanded;

  const handleToggle = () => {
    if (forceExpanded !== undefined) return; // Controlled externally, don't toggle

    if (sectionId && onToggle) {
      // Accordion mode - notify parent
      onToggle(sectionId, !isExpanded);
    } else {
      // Standalone mode - toggle internally
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className={`glass-card rounded-2xl overflow-hidden flex flex-col ${borderColor} border ${className}`}>
      {/* Header - always visible, clickable on mobile */}
      <button
        onClick={handleToggle}
        className={`w-full p-4 md:p-6 border-b border-white/5 bg-black/40 flex items-center justify-between text-left transition-colors ${
          isMobile ? 'hover:bg-white/5 active:bg-white/10 cursor-pointer' : 'cursor-default'
        }`}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${sectionId || 'default'}`}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-display font-bold text-white flex items-center gap-2 md:gap-3">
            <Icon className={`${iconColor} flex-shrink-0 ${iconColor.includes('purple') ? 'animate-pulse' : ''}`} size={20} />
            <span className="truncate">
              {title} {titleHighlight && <span className={iconColor}>{titleHighlight}</span>}
            </span>
          </h2>
          {subtitle && (
            <p className="text-slate-400 font-mono text-xs mt-1 truncate">{subtitle}</p>
          )}
        </div>

        {/* Chevron indicator - only visible on mobile */}
        <div className={`md:hidden ml-2 flex-shrink-0 transition-transform duration-300 ${
          isExpanded ? 'rotate-180' : 'rotate-0'
        }`}>
          <ChevronDown className="text-slate-400" size={20} />
        </div>
      </button>

      {/* Collapsible content */}
      <div
        id={`section-content-${sectionId || 'default'}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded
            ? 'max-h-[2000px] opacity-100'
            : 'max-h-0 opacity-0 md:max-h-[2000px] md:opacity-100'
        }`}
      >
        <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
