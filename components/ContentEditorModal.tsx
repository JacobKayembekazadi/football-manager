
import React, { useState } from 'react';
import { ContentItem, Club } from '../types';
import { rewriteContent } from '../services/geminiService';
import { updateContentItem, deleteContentItem } from '../services/contentService';
import { useToast } from './Toast';
import { X, Save, Sparkles, Loader2, Check, Copy, Wand2, Trash2 } from 'lucide-react';

interface ContentEditorModalProps {
  item: ContentItem;
  club: Club;
  onSave: (updatedItem: ContentItem) => void;
  onClose: () => void;
  onDelete?: (contentId: string) => Promise<void>;
}

const ContentEditorModal: React.FC<ContentEditorModalProps> = ({ item, club, onSave, onClose, onDelete }) => {
  const toast = useToast();
  const [editedBody, setEditedBody] = useState(item.body);
  const [status, setStatus] = useState(item.status);
  const [instruction, setInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(item.id);
      } else {
        await deleteContentItem(item.id);
      }
      toast.success('Content deleted successfully.');
      onClose();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRewrite = async () => {
    if (!instruction) return;
    setIsRewriting(true);
    const newText = await rewriteContent(club, editedBody, instruction);
    setEditedBody(newText);
    setIsRewriting(false);
    setInstruction('');
  };

  const handleSave = async () => {
    try {
      const updatedItem = await updateContentItem(item.id, {
        body: editedBody,
        status,
      });
      onSave(updatedItem);
      toast.success('Content saved successfully.');
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content. Please try again.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-editor-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} aria-hidden="true"></div>

      <div className="relative w-full max-w-4xl bg-[#0a0a0a] rounded-2xl border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-white/5 border border-white/10 text-blue-400" aria-hidden="true">
                    <Wand2 size={20} />
                </div>
                <div>
                    <h3 id="content-editor-title" className="font-display font-bold text-white text-lg">HOLO-EDITOR v2.0</h3>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{item.type} // {item.platform}</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close editor"><X size={20} /></button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Editor Pane */}
            <div className="flex-1 flex flex-col p-6 border-r border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Content Payload</label>
                    <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${status === 'APPROVED' ? 'text-green-500 border-green-500/50 bg-green-500/10' : status === 'PUBLISHED' ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' : 'text-amber-400 border-amber-400/50 bg-amber-400/10'}`}>
                             {status}
                         </span>
                         <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
                            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                         </button>
                    </div>
                </div>
                <textarea 
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-200 font-sans leading-relaxed resize-none focus:border-blue-500 outline-none transition-colors custom-scrollbar"
                />
            </div>

            {/* AI Control Pane */}
            <div className="w-full md:w-80 bg-black/40 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h4 className="text-xs font-bold text-purple-500 uppercase mb-4 flex items-center gap-2">
                        <Sparkles size={14} /> AI Remix Engine
                    </h4>
                    
                    <div className="space-y-3">
                         <button 
                            onClick={() => { setInstruction("Make it shorter and punchier"); handleRewrite(); }}
                            className="w-full py-2 px-3 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 text-left transition-colors"
                         >
                            "Make it shorter & punchier"
                         </button>
                         <button 
                             onClick={() => { setInstruction("Make it more exciting/hype"); handleRewrite(); }}
                             className="w-full py-2 px-3 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 text-left transition-colors"
                         >
                            "Max Hype / Excitement"
                         </button>
                         <button 
                             onClick={() => { setInstruction("Make it formal and professional"); handleRewrite(); }}
                             className="w-full py-2 px-3 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 text-left transition-colors"
                         >
                            "Formal / Professional"
                         </button>
                    </div>

                    <div className="mt-4">
                        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Custom Instruction</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                placeholder="e.g. Add more emojis..."
                                className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleRewrite()}
                            />
                            <button 
                                onClick={handleRewrite}
                                disabled={isRewriting || !instruction}
                                className="bg-purple-500/20 text-purple-500 border border-purple-500/50 rounded px-3 hover:bg-purple-500/40 disabled:opacity-50"
                            >
                                {isRewriting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-end gap-3">
                     <label className="text-[10px] font-mono text-slate-500 uppercase">Workflow Actions</label>
                     <div className="grid grid-cols-2 gap-3">
                         <button 
                            onClick={() => setStatus('DRAFT')}
                            className={`py-2 rounded border text-xs font-bold uppercase transition-colors ${status === 'DRAFT' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                         >
                             Revert Draft
                         </button>
                         <button 
                             onClick={() => setStatus('APPROVED')}
                             className={`py-2 rounded border text-xs font-bold uppercase transition-colors ${status === 'APPROVED' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                         >
                             Approve
                         </button>
                     </div>
                     <button 
                         onClick={() => setStatus('PUBLISHED')}
                         className={`w-full py-2 rounded border text-xs font-bold uppercase transition-colors ${status === 'PUBLISHED' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                     >
                         Mark Published
                     </button>
                </div>
            </div>

        </div>

        <div className="p-6 border-t border-white/10 bg-black/50 flex justify-between">
            <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="px-4 py-2 rounded text-xs font-bold uppercase text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
            </button>
            <div className="flex gap-4">
                <button onClick={onClose} className="px-6 py-2 rounded text-xs font-bold uppercase hover:bg-white/10 text-slate-300 transition-colors">
                    Cancel
                </button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-500 text-black rounded font-bold uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-cyan-300 transition-all flex items-center gap-2">
                    <Save size={16} /> Save Changes
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ContentEditorModal;
