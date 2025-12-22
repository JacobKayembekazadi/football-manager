/**
 * SponsorFormModal
 * 
 * Modal for creating and editing sponsors.
 * Used by SponsorNexus for Add/Edit operations.
 */

import React, { useState, useEffect } from 'react';
import { X, Briefcase, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { Sponsor } from '../types';

interface SponsorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sponsor: Omit<Sponsor, 'id'>) => Promise<void>;
  editingSponsor?: Sponsor | null;
}

const SponsorFormModal: React.FC<SponsorFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSponsor,
}) => {
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [tier, setTier] = useState<'Platinum' | 'Gold' | 'Silver'>('Gold');
  const [value, setValue] = useState('');
  const [contractEnd, setContractEnd] = useState('');
  const [status, setStatus] = useState<'Active' | 'Expiring' | 'Negotiating'>('Active');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editingSponsor) {
      setName(editingSponsor.name);
      setSector(editingSponsor.sector);
      setTier(editingSponsor.tier as 'Platinum' | 'Gold' | 'Silver');
      setValue(editingSponsor.value);
      setContractEnd(editingSponsor.contract_end);
      setStatus(editingSponsor.status as 'Active' | 'Expiring' | 'Negotiating');
    } else {
      resetForm();
    }
  }, [editingSponsor, isOpen]);

  const resetForm = () => {
    setName('');
    setSector('');
    setTier('Gold');
    setValue('');
    setContractEnd('');
    setStatus('Active');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Sponsor name is required');
      return;
    }
    if (!sector.trim()) {
      setError('Sector is required');
      return;
    }
    if (!value.trim()) {
      setError('Contract value is required');
      return;
    }
    if (!contractEnd) {
      setError('Contract end date is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        sector: sector.trim(),
        tier,
        value: value.trim(),
        contract_end: contractEnd,
        status,
        logo_initials: name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        generated_content: undefined,
      });

      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sponsor');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(255,215,0,0.1)] overflow-hidden animate-fade-in">
        {/* Header gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Briefcase className="text-yellow-400" size={20} />
            {editingSponsor ? 'Edit Sponsor' : 'Add New Sponsor'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Sponsor Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Nike, Emirates"
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Sector */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Sector *
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g., Sportswear, Finance, Automotive"
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Tier & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Tier
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as 'Platinum' | 'Gold' | 'Silver')}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-yellow-500/50 focus:outline-none transition-colors"
                >
                  <option value="Platinum">Platinum</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Expiring' | 'Negotiating')}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-yellow-500/50 focus:outline-none transition-colors"
                >
                  <option value="Active">Active</option>
                  <option value="Expiring">Expiring</option>
                  <option value="Negotiating">Negotiating</option>
                </select>
              </div>
            </div>

            {/* Value & Contract End */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Contract Value *
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g., £500k/year"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Contract End *
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={contractEnd}
                    onChange={(e) => setContractEnd(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-yellow-500/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-lg transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-yellow-500 text-black rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(234,179,8,0.35)] transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : editingSponsor ? (
                'Update Sponsor'
              ) : (
                'Add Sponsor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SponsorFormModal;



