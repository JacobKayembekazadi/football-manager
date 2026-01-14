
import React from 'react';
import { ContentItem, Fixture } from '../types';
import { Copy, Check, Edit2, Twitter, Instagram, Globe, Cpu, Image } from 'lucide-react';

interface ContentCardProps {
  item: ContentItem;
  fixture?: Fixture;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, fixture }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigator.clipboard.writeText(item.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = () => {
      switch(item.type) {
          case 'SOCIAL': return <Twitter size={14} />;
          case 'REPORT': return <Globe size={14} />;
          case 'GRAPHIC_COPY': return <Image size={14} />;
          default: return <Edit2 size={14} />;
      }
  };

  const getStatusColor = () => {
      if (item.status === 'DRAFT') return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      if (item.status === 'PUBLISHED') return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      return 'bg-green-500/20 text-green-500 border-green-500/50';
  };

  const getTypeColor = () => {
      if (item.type === 'PREVIEW') return 'text-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.3)]';
      if (item.type === 'REPORT') return 'text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]';
      if (item.type === 'GRAPHIC_COPY') return 'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
      return 'text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300 group flex flex-col h-full relative hover:scale-[1.01]">
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/5 to-white/0 h-[200%] w-full animate-scanline opacity-0 group-hover:opacity-20 pointer-events-none"></div>

      <div className="border-b border-white/5 bg-black/20 px-4 py-3 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-md border border-white/10 bg-black/40 ${getTypeColor()}`}>
            {getIcon()}
          </div>
          <div className="flex flex-col">
              <span className="text-xs font-display font-bold text-slate-200 tracking-wider uppercase">
                {item.type.replace('_', ' ')}
              </span>
              {fixture && (
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                   ID: {fixture.id.split('-')[1]} // VS {fixture.opponent.substring(0, 3).toUpperCase()}
                </span>
              )}
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor()} uppercase tracking-widest`}>
            {item.status}
        </div>
      </div>
      
      <div className="p-5 flex-1 bg-gradient-to-b from-white/5 to-transparent relative z-10">
        <div className="font-mono text-sm text-slate-300 whitespace-pre-line leading-relaxed opacity-90 line-clamp-6">
          {item.body}
        </div>
      </div>

      <div className="bg-black/40 px-4 py-3 flex justify-between items-center border-t border-white/5 relative z-10">
        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Cpu size={10} />
            GEN: {new Date(item.created_at).toLocaleTimeString()}
        </span>
        <button 
            onClick={handleCopy}
            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase transition-all
                ${copied
                    ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }
            `}
        >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Data'}
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
