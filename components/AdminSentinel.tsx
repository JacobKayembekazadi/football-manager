
import React, { useState } from 'react';
import { AdminTask, InboxEmail, Club } from '../types';
import { generateAdminEmail, generateSmartReply, generateActionPlan, analyzeEmailSentiment } from '../services/geminiService';
import { sendEmail } from '../services/emailIntegration';
import { saveTaskActionPlan, saveTaskEmailDraft, createTask, deleteTask } from '../services/taskService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import TaskFormModal from './TaskFormModal';
import { ShieldAlert, Mail, Clock, CheckCircle2, AlertTriangle, Send, Loader2, FileText, ChevronRight, Reply, Activity, Layers, HeartPulse, Save, Plus, Trash2, X } from 'lucide-react';

interface AdminSentinelProps {
  club: Club;
  tasks: AdminTask[];
  emails: InboxEmail[];
  onRefetchTasks?: () => Promise<void>;
}

const AdminSentinel: React.FC<AdminSentinelProps> = ({ club, tasks, emails, onRefetchTasks }) => {
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [taskDraft, setTaskDraft] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [replyDraft, setReplyDraft] = useState('');
  const [sentiment, setSentiment] = useState<{score: number, mood: string} | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzingTask, setIsAnalyzingTask] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // CRUD State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const handleCreateTask = async (task: Omit<AdminTask, 'id'>) => {
    await createTask(club.id, task);
    if (onRefetchTasks) await onRefetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setDeletingTaskId(taskId);
    try {
      await deleteTask(taskId);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setTaskDraft('');
        setActionPlan('');
      }
      if (onRefetchTasks) await onRefetchTasks();
    } finally {
      setDeletingTaskId(null);
    }
  };

  // --- Task Handlers ---

  const handleDraftTaskEmail = async (task: AdminTask) => {
      setIsProcessing(true);
      setSelectedTask(task);
      setTaskDraft('');
      setActionPlan('');
      
      const draft = await generateAdminEmail(club, task);
      setTaskDraft(draft);
      setIsProcessing(false);
  };

  const handleGeneratePlan = async (task: AdminTask) => {
      setIsAnalyzingTask(true);
      setSelectedTask(task);
      setTaskDraft(''); // clear email draft if any to focus on plan
      
      const plan = await generateActionPlan(club, task);
      setActionPlan(plan);
      
      // Persist to database if configured
      if (isSupabaseConfigured()) {
        try {
          await saveTaskActionPlan(task.id, plan);
        } catch (err) {
          console.error('Failed to save action plan:', err);
        }
      }
      
      setIsAnalyzingTask(false);
  }
  
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  const handleSaveEmailDraft = async () => {
    if (!selectedTask || !taskDraft) return;
    setIsSavingDraft(true);
    try {
      if (isSupabaseConfigured()) {
        await saveTaskEmailDraft(selectedTask.id, taskDraft);
      }
    } catch (err) {
      console.error('Failed to save email draft:', err);
    }
    setIsSavingDraft(false);
  }

  // --- Email Handlers ---

  const handleSelectEmail = async (email: InboxEmail) => {
      setSelectedEmail(email);
      setReplyDraft('');
      setSmartReplies([]);
      setSentiment(null);
      setIsProcessing(true);
      
      // Parallel execution for speed
      const [replies, sent] = await Promise.all([
          generateSmartReply(email),
          analyzeEmailSentiment(email)
      ]);
      
      setSmartReplies(replies);
      setSentiment(sent);
      setIsProcessing(false);
  };

  const handleSelectReply = (reply: string) => {
      setReplyDraft(reply);
  };

  // Mock Compliance Stats
  const complianceScore = 92;
  const financialHealth = 88;
  const facilityStatus = 100;

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
        
        {/* Compliance HUD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-4 rounded-xl border border-orange-500/20 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">League Compliance</span>
                    <div className="text-2xl font-display font-bold text-white">{complianceScore}%</div>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                       <circle cx="32" cy="32" r="28" stroke="#f97316" strokeWidth="4" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * complianceScore) / 100} />
                    </svg>
                    <ShieldAlert size={16} className="absolute text-orange-500" />
                </div>
            </div>
            
            <div className="glass-card p-4 rounded-xl border border-neon-blue/20 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Financial Audit</span>
                    <div className="text-2xl font-display font-bold text-white">{financialHealth}%</div>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                       <circle cx="32" cy="32" r="28" stroke="#00f3ff" strokeWidth="4" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * financialHealth) / 100} />
                    </svg>
                    <Activity size={16} className="absolute text-neon-blue" />
                </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-neon-green/20 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Facility Status</span>
                    <div className="text-2xl font-display font-bold text-white text-neon-green">OK</div>
                </div>
                 <div className="relative w-16 h-16 flex items-center justify-center">
                     <div className="absolute inset-0 border-2 border-neon-green rounded-full animate-pulse opacity-20"></div>
                     <CheckCircle2 size={24} className="text-neon-green" />
                </div>
            </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
            
            {/* LEFT: Deadline Sentinel */}
            <div className="lg:w-1/2 flex flex-col gap-4 glass-panel rounded-xl border border-orange-500/20 overflow-hidden">
                <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-orange-500" size={20} />
                        DEADLINE <span className="text-orange-500">SENTINEL</span>
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{tasks.length} Active Protocols</span>
                        <button 
                            onClick={() => setIsTaskModalOpen(true)}
                            data-tour="add-task-btn"
                            className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/50 text-orange-400 px-3 py-1.5 rounded-lg font-display font-bold uppercase text-[10px] hover:bg-orange-500/20 transition-all"
                        >
                            <Plus size={12} /> Add Task
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {/* Empty State */}
                    {tasks.length === 0 && (
                        <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 font-mono text-sm mb-4">No tasks yet</p>
                            <button 
                                onClick={() => setIsTaskModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-orange-500 text-black px-5 py-2 rounded-lg font-display font-bold uppercase text-xs hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all"
                            >
                                <Plus size={14} /> Create Your First Task
                            </button>
                        </div>
                    )}
                    {tasks.map(task => (
                        <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                    task.priority === 'High' ? 'text-red-400 border-red-400/50 bg-red-400/10' : 'text-blue-400 border-blue-400/50 bg-blue-400/10'
                                }`}>
                                    {task.priority} Priority
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                                        <Clock size={12} /> {task.deadline}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        disabled={deletingTaskId === task.id}
                                        className="p-1 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        title="Delete task"
                                    >
                                        {deletingTaskId === task.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">{task.title}</h3>
                            
                            {selectedTask?.id === task.id && actionPlan && (
                                <div className="mb-4 p-3 bg-black/40 rounded border border-orange-500/20 animate-slide-up">
                                    <h4 className="text-[10px] font-bold text-orange-400 uppercase mb-2 flex items-center gap-1"><Layers size={10} /> AI Action Plan</h4>
                                    <div className="text-xs text-slate-300 font-mono leading-relaxed" dangerouslySetInnerHTML={{__html: actionPlan}}></div>
                                </div>
                            )}

                            <div className="flex gap-2 mt-auto">
                                <button 
                                    onClick={() => handleGeneratePlan(task)}
                                    disabled={isAnalyzingTask}
                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-slate-300 hover:text-white bg-black/40 border border-white/10 px-2 py-2 rounded hover:bg-white/10 transition-colors"
                                >
                                    {isAnalyzingTask && selectedTask?.id === task.id ? <Loader2 size={12} className="animate-spin" /> : <Layers size={12} />}
                                    Generate Plan
                                </button>
                                <button 
                                    onClick={() => handleDraftTaskEmail(task)}
                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-slate-300 hover:text-white bg-black/40 border border-white/10 px-2 py-2 rounded hover:bg-white/10 transition-colors"
                                >
                                    <FileText size={12} /> Draft Comms
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedTask && taskDraft && !actionPlan && (
                    <div className="p-4 border-t border-orange-500/30 bg-orange-500/5 animate-slide-up max-h-64 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-orange-400 uppercase">Draft: {selectedTask.type} Dept</span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleSaveEmailDraft}
                                    disabled={isSavingDraft}
                                    className="text-neon-green hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase"
                                >
                                    {isSavingDraft ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    Save
                                </button>
                                <button onClick={() => setTaskDraft('')} className="text-slate-500 hover:text-white"><CheckCircle2 size={16} /></button>
                            </div>
                        </div>
                        <textarea 
                            value={taskDraft}
                            onChange={(e) => setTaskDraft(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-xs text-slate-300 font-mono h-32 resize-none focus:border-orange-500 outline-none"
                        />
                    </div>
                )}
            </div>

            {/* RIGHT: Intel Inbox */}
            <div className="lg:w-1/2 flex flex-col gap-4 glass-panel rounded-xl border border-neon-blue/20 overflow-hidden">
                <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <Mail className="text-neon-blue" size={20} />
                        INTEL <span className="text-neon-blue">INBOX</span>
                    </h2>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Encrypted Uplink</span>
                </div>

                 {/* Email List (Collapsed) or View (Expanded) */}
                 {!selectedEmail ? (
                     <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-2">
                         {emails.map(email => (
                             <div 
                                key={email.id} 
                                onClick={() => handleSelectEmail(email)}
                                className={`p-4 rounded-lg border border-white/5 hover:border-neon-blue/30 transition-colors cursor-pointer group ${!email.is_read ? 'bg-neon-blue/5 border-neon-blue/20' : 'bg-white/[0.02]'}`}
                             >
                                 <div className="flex justify-between items-start mb-1">
                                     <span className={`text-xs font-bold ${!email.is_read ? 'text-white' : 'text-slate-400'}`}>{email.from}</span>
                                     <span className="text-[10px] font-mono text-slate-500">{new Date(email.received_at).toLocaleDateString()}</span>
                                 </div>
                                 <h4 className={`text-sm mb-1 truncate ${!email.is_read ? 'text-neon-blue font-bold' : 'text-slate-300'}`}>{email.subject}</h4>
                                 <p className="text-xs text-slate-500 truncate font-mono">{email.preview}</p>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col animate-fade-in relative">
                         {/* Email Header */}
                         <div className="p-4 border-b border-white/10 bg-black/20">
                             <button onClick={() => setSelectedEmail(null)} className="text-xs text-neon-blue hover:text-white mb-4 flex items-center gap-1">
                                 &larr; RETURN TO INBOX
                             </button>
                             <div className="flex justify-between items-start">
                                 <div className="flex-1 mr-4">
                                     <h3 className="text-lg font-bold text-white mb-1">{selectedEmail.subject}</h3>
                                     <p className="text-xs text-slate-400 font-mono">From: {selectedEmail.from} &lt;{selectedEmail.from_email}&gt;</p>
                                 </div>
                                 <div className="flex flex-col items-end gap-2">
                                     <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-white uppercase">{selectedEmail.category}</span>
                                     
                                     {/* Sentiment Analysis Badge */}
                                     {sentiment && (
                                         <div className={`flex items-center gap-2 px-2 py-1 rounded border ${sentiment.score > 60 ? 'bg-green-500/10 border-green-500/30 text-green-400' : sentiment.score < 40 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                                             <HeartPulse size={12} />
                                             <span className="text-[10px] font-bold uppercase">{sentiment.mood} ({sentiment.score}%)</span>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                         
                         {/* Body */}
                         <div className="p-6 flex-1 overflow-y-auto bg-black/10">
                             <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">{selectedEmail.body}</p>
                         </div>

                         {/* Smart Reply Area */}
                         <div className="p-4 border-t border-white/10 bg-black/40">
                             {isProcessing ? (
                                 <div className="flex items-center gap-2 text-neon-blue text-xs font-mono py-4">
                                     <Loader2 size={14} className="animate-spin" /> DECRYPTING CONTEXT & GENERATING REPLIES...
                                 </div>
                             ) : (
                                 <div className="space-y-4">
                                     {!replyDraft && (
                                         <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                             {smartReplies.map((reply, i) => (
                                                 <button 
                                                    key={i}
                                                    onClick={() => handleSelectReply(reply)}
                                                    className="flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full border border-neon-blue/30 text-neon-blue hover:bg-neon-blue hover:text-black transition-all text-xs font-bold uppercase"
                                                 >
                                                     Option {i + 1}
                                                 </button>
                                             ))}
                                         </div>
                                     )}
                                     
                                     {replyDraft && (
                                         <div className="relative animate-slide-up">
                                             <textarea 
                                                 value={replyDraft}
                                                 onChange={(e) => setReplyDraft(e.target.value)}
                                                 className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-sm text-white font-mono h-32 resize-none focus:border-neon-blue outline-none"
                                             />
                                             <div className="absolute bottom-3 right-3 flex gap-2">
                                                 <button onClick={() => setReplyDraft('')} className="p-2 text-slate-500 hover:text-white transition-colors">
                                                     <X size={16} />
                                                 </button>
                                                 <button 
                                                     onClick={async () => {
                                                         if (!selectedEmail || !replyDraft) return;
                                                         setIsSendingEmail(true);
                                                         try {
                                                             await sendEmail(
                                                                 selectedEmail.id,
                                                                 replyDraft,
                                                                 selectedEmail.from_email
                                                             );
                                                             setReplyDraft('');
                                                             alert('Email sent successfully!');
                                                         } catch (error) {
                                                             console.error('Error sending email:', error);
                                                             alert('Failed to send email. Please try again.');
                                                         } finally {
                                                             setIsSendingEmail(false);
                                                         }
                                                     }}
                                                     disabled={isSendingEmail || !replyDraft}
                                                     className="p-2 bg-neon-blue text-black rounded-full hover:bg-white transition-colors disabled:opacity-50"
                                                 >
                                                     {isSendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                 </button>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             )}
                         </div>
                     </div>
                 )}
            </div>
        </div>

        {/* Task Form Modal */}
        <TaskFormModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onSave={handleCreateTask}
        />
    </div>
  );
};

export default AdminSentinel;
