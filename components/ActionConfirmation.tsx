/**
 * ActionConfirmation Component
 *
 * Displays a confirmation card for AI-proposed actions.
 * Shows action details and allows user to confirm or cancel.
 */

import React from 'react';
import {
  Calendar,
  User,
  Building,
  FileText,
  Trash2,
  Edit3,
  Plus,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { AIAction, ActionType } from '../types/aiActions';

interface ActionConfirmationProps {
  action: AIAction;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}

const ActionConfirmation: React.FC<ActionConfirmationProps> = ({
  action,
  onConfirm,
  onCancel,
  isExecuting,
}) => {
  // Get icon and color based on action type
  const getActionMeta = (type: ActionType) => {
    const isDelete = type.startsWith('DELETE');
    const isUpdate = type.startsWith('UPDATE');

    if (type.includes('FIXTURE')) {
      return {
        icon: isDelete ? Trash2 : isUpdate ? Edit3 : Plus,
        label: type.replace('_', ' '),
        color: isDelete ? 'red' : isUpdate ? 'blue' : 'green',
        bgColor: isDelete ? 'bg-red-500/10' : isUpdate ? 'bg-blue-500/10' : 'bg-green-500/10',
        borderColor: isDelete ? 'border-red-500/30' : isUpdate ? 'border-blue-500/30' : 'border-green-500/30',
        textColor: isDelete ? 'text-red-400' : isUpdate ? 'text-blue-400' : 'text-green-400',
        categoryIcon: Calendar,
      };
    }

    if (type.includes('PLAYER')) {
      return {
        icon: isDelete ? Trash2 : isUpdate ? Edit3 : Plus,
        label: type.replace('_', ' '),
        color: isDelete ? 'red' : isUpdate ? 'amber' : 'purple',
        bgColor: isDelete ? 'bg-red-500/10' : isUpdate ? 'bg-amber-500/10' : 'bg-purple-500/10',
        borderColor: isDelete ? 'border-red-500/30' : isUpdate ? 'border-amber-500/30' : 'border-purple-500/30',
        textColor: isDelete ? 'text-red-400' : isUpdate ? 'text-amber-400' : 'text-purple-400',
        categoryIcon: User,
      };
    }

    if (type.includes('SPONSOR')) {
      return {
        icon: isDelete ? Trash2 : isUpdate ? Edit3 : Plus,
        label: type.replace('_', ' '),
        color: isDelete ? 'red' : isUpdate ? 'cyan' : 'amber',
        bgColor: isDelete ? 'bg-red-500/10' : isUpdate ? 'bg-cyan-500/10' : 'bg-amber-500/10',
        borderColor: isDelete ? 'border-red-500/30' : isUpdate ? 'border-cyan-500/30' : 'border-amber-500/30',
        textColor: isDelete ? 'text-red-400' : isUpdate ? 'text-cyan-400' : 'text-amber-400',
        categoryIcon: Building,
      };
    }

    // Content
    return {
      icon: isUpdate ? Edit3 : Plus,
      label: type.replace('_', ' '),
      color: isUpdate ? 'blue' : 'emerald',
      bgColor: isUpdate ? 'bg-blue-500/10' : 'bg-emerald-500/10',
      borderColor: isUpdate ? 'border-blue-500/30' : 'border-emerald-500/30',
      textColor: isUpdate ? 'text-blue-400' : 'text-emerald-400',
      categoryIcon: FileText,
    };
  };

  const meta = getActionMeta(action.type);
  const ActionIcon = meta.icon;
  const CategoryIcon = meta.categoryIcon;

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  // Render action-specific details
  const renderDetails = () => {
    const data = action.data as any;

    switch (action.type) {
      case 'CREATE_FIXTURE':
        return (
          <div className="space-y-2">
            <DetailRow label="Opponent" value={data.opponent} />
            <DetailRow label="Date & Time" value={formatDate(data.kickoff_time)} />
            <DetailRow label="Venue" value={data.venue} />
            {data.competition && <DetailRow label="Competition" value={data.competition} />}
          </div>
        );

      case 'UPDATE_FIXTURE':
        return (
          <div className="space-y-2">
            {data.opponent && <DetailRow label="Fixture" value={`vs ${data.opponent}`} />}
            {data.result_home !== undefined && data.result_away !== undefined && (
              <DetailRow
                label="Result"
                value={`${data.result_home} - ${data.result_away}`}
                highlight
              />
            )}
            {data.scorers && data.scorers.length > 0 && (
              <DetailRow label="Scorers" value={data.scorers.join(', ')} />
            )}
            {data.man_of_the_match && (
              <DetailRow label="Man of the Match" value={data.man_of_the_match} />
            )}
            {data.status && <DetailRow label="Status" value={data.status} />}
          </div>
        );

      case 'DELETE_FIXTURE':
        return (
          <div className="space-y-2">
            {data.opponent && <DetailRow label="Fixture" value={`vs ${data.opponent}`} />}
            <p className="text-xs text-red-400 mt-2">This action cannot be undone.</p>
          </div>
        );

      case 'CREATE_PLAYER':
        return (
          <div className="space-y-2">
            <DetailRow label="Name" value={data.name} />
            <DetailRow label="Position" value={data.position} />
            <DetailRow label="Number" value={`#${data.number}`} />
            {data.form && <DetailRow label="Form" value={`${data.form}/10`} />}
          </div>
        );

      case 'UPDATE_PLAYER':
        return (
          <div className="space-y-2">
            {data.name && <DetailRow label="Player" value={data.name} />}
            {data.updates?.form !== undefined && (
              <DetailRow label="New Form" value={`${data.updates.form}/10`} />
            )}
            {data.updates?.position && (
              <DetailRow label="New Position" value={data.updates.position} />
            )}
            {data.updates?.number && (
              <DetailRow label="New Number" value={`#${data.updates.number}`} />
            )}
          </div>
        );

      case 'DELETE_PLAYER':
        return (
          <div className="space-y-2">
            {data.name && <DetailRow label="Player" value={data.name} />}
            <p className="text-xs text-red-400 mt-2">This will remove the player from your squad.</p>
          </div>
        );

      case 'CREATE_SPONSOR':
        return (
          <div className="space-y-2">
            <DetailRow label="Name" value={data.name} />
            <DetailRow label="Tier" value={data.tier} />
            <DetailRow label="Sector" value={data.sector} />
            <DetailRow label="Annual Value" value={formatCurrency(data.annual_value)} highlight />
            {data.contract_end_date && (
              <DetailRow label="Contract Until" value={data.contract_end_date} />
            )}
          </div>
        );

      case 'UPDATE_SPONSOR':
        return (
          <div className="space-y-2">
            {data.name && <DetailRow label="Sponsor" value={data.name} />}
            {data.updates?.tier && <DetailRow label="New Tier" value={data.updates.tier} />}
            {data.updates?.annual_value && (
              <DetailRow label="New Value" value={formatCurrency(data.updates.annual_value)} />
            )}
          </div>
        );

      case 'DELETE_SPONSOR':
        return (
          <div className="space-y-2">
            {data.name && <DetailRow label="Sponsor" value={data.name} />}
            <p className="text-xs text-red-400 mt-2">This will end the sponsorship partnership.</p>
          </div>
        );

      case 'CREATE_CONTENT':
        return (
          <div className="space-y-2">
            <DetailRow label="Type" value={data.type} />
            {data.platform && <DetailRow label="Platform" value={data.platform} />}
            <div className="mt-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Preview</span>
              <p className="text-xs text-slate-300 mt-1 line-clamp-3">{data.body}</p>
            </div>
          </div>
        );

      case 'UPDATE_CONTENT':
        return (
          <div className="space-y-2">
            {data.updates?.status && (
              <DetailRow label="New Status" value={data.updates.status} highlight />
            )}
            {data.updates?.body && (
              <div className="mt-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Updated Content</span>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3">{data.updates.body}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <p className="text-sm text-slate-400">{action.summary}</p>
        );
    }
  };

  return (
    <div className={`${meta.bgColor} border ${meta.borderColor} rounded-xl p-4 my-3 animate-slide-up`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${meta.bgColor} flex items-center justify-center`}>
          <CategoryIcon size={16} className={meta.textColor} />
        </div>
        <div className="flex items-center gap-2">
          <ActionIcon size={14} className={meta.textColor} />
          <span className={`text-sm font-bold ${meta.textColor}`}>
            {meta.label}
          </span>
        </div>
        {action.confidence !== 'high' && (
          <span className={`text-[10px] ${meta.bgColor} ${meta.textColor} px-2 py-0.5 rounded flex items-center gap-1`}>
            <AlertTriangle size={10} />
            {action.confidence} confidence
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mb-3" />

      {/* Details */}
      {renderDetails()}

      {/* Summary */}
      {action.summary && (
        <p className="text-xs text-slate-400 mt-3 italic">{action.summary}</p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="flex-1 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <X size={14} />
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className={`flex-1 px-4 py-2.5 ${
            action.type.startsWith('DELETE')
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-green-600 hover:bg-green-500'
          } text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {isExecuting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check size={14} />
              {action.type.startsWith('DELETE') ? 'Delete' : 'Confirm'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Helper component for detail rows
const DetailRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] font-mono text-slate-500 uppercase">{label}</span>
    <span className={`text-sm ${highlight ? 'font-bold text-white' : 'text-slate-300'}`}>
      {value}
    </span>
  </div>
);

export default ActionConfirmation;
