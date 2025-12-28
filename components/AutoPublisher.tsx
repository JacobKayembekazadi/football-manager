import React, { useState } from 'react';
import { ContentItem, ContentGenStatus } from '../types';
import { Copy, Check, Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

interface AutoPublisherProps {
  contentItems: ContentItem[];
  onContentUpdate?: (item: ContentItem) => Promise<void>;
}

const AutoPublisher: React.FC<AutoPublisherProps> = ({ 
  contentItems,
  onContentUpdate 
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<ContentGenStatus>('idle');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const approvedItems = contentItems.filter(item => item.status === 'APPROVED');

  const handleCopy = async (item: ContentItem) => {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleSelect = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleBulkDownload = async () => {
    if (selectedItems.size === 0) return;
    
    setDownloadStatus('generating');
    try {
      const zip = new JSZip();
      
      for (const itemId of selectedItems) {
        const item = contentItems.find(c => c.id === itemId);
        if (item) {
          const fileName = `${item.type}-${item.id.slice(0, 8)}.txt`;
          zip.file(fileName, item.body);
        }
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-assets-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }
  };

  if (approvedItems.length === 0) {
    return (
      <div className="glass-card p-6 rounded-xl border border-white/5">
        <h3 className="text-lg font-display font-bold text-white mb-2">Auto-Publisher</h3>
        <p className="text-sm text-slate-400 font-mono">No approved content ready to publish.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold text-white">Auto-Publisher</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {approvedItems.length} approved asset{approvedItems.length !== 1 ? 's' : ''} ready to publish
          </p>
        </div>
        {selectedItems.size > 0 && (
          <button
            onClick={handleBulkDownload}
            disabled={downloadStatus === 'generating'}
            className="px-4 py-2 bg-neon-green/10 border border-neon-green/50 text-neon-green rounded-lg font-bold uppercase text-xs hover:bg-neon-green/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {downloadStatus === 'generating' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={14} />
                Download {selectedItems.size} Selected
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {approvedItems.map(item => (
          <div
            key={item.id}
            className="bg-white/5 p-4 rounded border border-white/10 hover:border-neon-green/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-neon-green uppercase px-2 py-0.5 bg-neon-green/10 rounded border border-neon-green/30">
                    {item.type}
                  </span>
                  {item.platform && (
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {item.platform}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white line-clamp-2">{item.body.substring(0, 100)}...</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSelect(item.id)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedItems.has(item.id)
                      ? 'bg-neon-green border-neon-green'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  {selectedItems.has(item.id) && <Check size={10} className="text-black" />}
                </button>
                <button
                  onClick={() => handleCopy(item)}
                  className="p-2 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                  title="Copy to clipboard"
                >
                  {copiedId === item.id ? (
                    <Check size={16} className="text-neon-green" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutoPublisher;




