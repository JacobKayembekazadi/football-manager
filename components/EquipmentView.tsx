/**
 * EquipmentView Component (Grassroots Model)
 *
 * Simplified equipment management focused on real grassroots club needs:
 * - Kit Register: Who has what shirt number and sizes
 * - Match Day Bag: Checklist for each fixture
 * - Club Equipment: Shared inventory
 * - Laundry: Simple wash tracking
 * - Kit Requests: Player needs
 */

import React, { useState, useEffect } from 'react';
import {
  Shirt,
  Package,
  ClipboardCheck,
  Droplets,
  AlertCircle,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  User,
  Search,
} from 'lucide-react';
import {
  Club,
  Player,
  Fixture,
  PlayerKitAssignment,
  ClubEquipment,
  MatchDayChecklist,
  KitRequest,
  LaundryBatch,
  KitCondition,
} from '../types';
import {
  getDemoKitAssignments,
  saveDemoKitAssignment,
  deleteDemoKitAssignment,
  getDemoClubEquipment,
  saveDemoClubEquipment,
  deleteDemoClubEquipment,
  getDemoMatchDayChecklist,
  toggleDemoChecklistItem,
  addDemoChecklistItem,
  getDemoKitRequests,
  saveDemoKitRequest,
  deleteDemoKitRequest,
  getDemoLaundryBatches,
  createDemoLaundryBatch,
  updateDemoLaundryStatus,
  deleteDemoLaundryBatch,
  generateDemoId,
} from '../services/demoStorageService';

interface EquipmentViewProps {
  club: Club;
  fixtures?: Fixture[];
}

type Tab = 'kit-register' | 'matchday-bag' | 'inventory' | 'laundry' | 'requests';

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
const SHORTS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
const SOCKS_SIZES = ['S', 'M', 'L'] as const;
const KIT_CONDITIONS: { value: KitCondition; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'text-green-400' },
  { value: 'good', label: 'Good', color: 'text-blue-400' },
  { value: 'worn', label: 'Worn', color: 'text-amber-400' },
  { value: 'needs_replacing', label: 'Needs Replacing', color: 'text-red-400' },
];

const EquipmentView: React.FC<EquipmentViewProps> = ({ club, fixtures = [] }) => {
  const players = club.players;
  const clubId = club.id;
  const [activeTab, setActiveTab] = useState<Tab>('kit-register');

  // Kit Register state
  const [kitAssignments, setKitAssignments] = useState<PlayerKitAssignment[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Match Day state
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');
  const [checklist, setChecklist] = useState<MatchDayChecklist | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Club Equipment state
  const [equipment, setEquipment] = useState<ClubEquipment[]>([]);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    category: 'training' as ClubEquipment['category'],
    quantity: 1,
    condition: 'good' as ClubEquipment['condition'],
  });

  // Kit Requests state
  const [kitRequests, setKitRequests] = useState<KitRequest[]>([]);
  const [showAddRequest, setShowAddRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    player_id: '',
    request_type: 'replacement' as KitRequest['request_type'],
    item_needed: 'full_kit' as KitRequest['item_needed'],
    size_needed: '',
    reason: '',
  });

  // Laundry state
  const [laundryBatches, setLaundryBatches] = useState<LaundryBatch[]>([]);
  const [showAddLaundry, setShowAddLaundry] = useState(false);
  const [newLaundryCount, setNewLaundryCount] = useState(11);

  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED');

  // Load data
  useEffect(() => {
    setKitAssignments(getDemoKitAssignments(clubId));
    setEquipment(getDemoClubEquipment(clubId));
    setKitRequests(getDemoKitRequests(clubId));
    setLaundryBatches(getDemoLaundryBatches(clubId));

    // Set first upcoming fixture as default
    if (upcomingFixtures.length > 0 && !selectedFixtureId) {
      setSelectedFixtureId(upcomingFixtures[0].id);
    }
  }, [clubId]);

  // Load checklist when fixture changes
  useEffect(() => {
    if (selectedFixtureId) {
      setChecklist(getDemoMatchDayChecklist(clubId, selectedFixtureId));
    }
  }, [selectedFixtureId, clubId]);

  // Get kit assignment for a player
  const getPlayerKit = (playerId: string): PlayerKitAssignment | undefined => {
    return kitAssignments.find(k => k.player_id === playerId);
  };

  // Save kit assignment
  const saveKitAssignment = (playerId: string, data: Partial<PlayerKitAssignment>) => {
    const existing = getPlayerKit(playerId);
    const assignment: PlayerKitAssignment = {
      id: existing?.id || generateDemoId(),
      club_id: clubId,
      player_id: playerId,
      shirt_number: data.shirt_number ?? existing?.shirt_number ?? 0,
      shirt_size: data.shirt_size ?? existing?.shirt_size ?? 'M',
      shorts_size: data.shorts_size ?? existing?.shorts_size ?? 'M',
      socks_size: data.socks_size ?? existing?.socks_size ?? 'M',
      kit_condition: data.kit_condition ?? existing?.kit_condition ?? 'good',
      has_training_kit: data.has_training_kit ?? existing?.has_training_kit ?? false,
      notes: data.notes ?? existing?.notes,
    };

    const saved = saveDemoKitAssignment(assignment);
    setKitAssignments(prev => {
      const idx = prev.findIndex(k => k.player_id === playerId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
    setEditingPlayerId(null);
  };

  // Toggle checklist item
  const handleToggleChecklistItem = (itemId: string) => {
    if (!selectedFixtureId) return;
    const updated = toggleDemoChecklistItem(clubId, selectedFixtureId, itemId);
    setChecklist(updated);
  };

  // Add checklist item
  const handleAddChecklistItem = () => {
    if (!selectedFixtureId || !newChecklistItem.trim()) return;
    const updated = addDemoChecklistItem(clubId, selectedFixtureId, newChecklistItem.trim());
    setChecklist(updated);
    setNewChecklistItem('');
  };

  // Filter players by search
  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.number.toString().includes(searchTerm)
  );

  // Tab content
  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'kit-register', label: 'Kit Register', icon: <Shirt size={18} /> },
    { id: 'matchday-bag', label: 'Match Day Bag', icon: <ClipboardCheck size={18} /> },
    { id: 'inventory', label: 'Club Equipment', icon: <Package size={18} /> },
    { id: 'laundry', label: 'Laundry', icon: <Droplets size={18} />, count: laundryBatches.filter(l => l.status !== 'ready').length },
    { id: 'requests', label: 'Kit Requests', icon: <AlertCircle size={18} />, count: kitRequests.filter(r => r.status === 'pending').length },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package className="text-green-500" />
            Equipment
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kit assignments, match day bags, and club equipment
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-shrink-0 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.id
                ? 'bg-green-500 text-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === tab.id ? 'bg-black/20' : 'bg-amber-500/20 text-amber-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Kit Register */}
        {activeTab === 'kit-register' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or number..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{players.length}</p>
                <p className="text-xs text-slate-400">Total Players</p>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-400">{kitAssignments.length}</p>
                <p className="text-xs text-slate-400">Kit Assigned</p>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-400">
                  {kitAssignments.filter(k => k.kit_condition === 'worn').length}
                </p>
                <p className="text-xs text-slate-400">Worn Kit</p>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-400">
                  {kitAssignments.filter(k => k.kit_condition === 'needs_replacing').length}
                </p>
                <p className="text-xs text-slate-400">Needs Replacing</p>
              </div>
            </div>

            {/* Player Kit Table */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-bold text-slate-400 uppercase p-4">Player</th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase p-4">#</th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase p-4 hidden md:table-cell">Shirt</th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase p-4 hidden md:table-cell">Shorts</th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase p-4">Condition</th>
                    <th className="text-right text-xs font-bold text-slate-400 uppercase p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map(player => {
                    const kit = getPlayerKit(player.id);
                    const isEditing = editingPlayerId === player.id;

                    return (
                      <tr key={player.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                              {player.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{player.name}</p>
                              <p className="text-xs text-slate-500">{player.position}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="number"
                              defaultValue={kit?.shirt_number ?? player.number}
                              min="1"
                              max="99"
                              className="w-16 px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-sm"
                              onChange={e => saveKitAssignment(player.id, { shirt_number: parseInt(e.target.value) || 0 })}
                            />
                          ) : (
                            <span className="text-lg font-bold text-white">{kit?.shirt_number ?? player.number}</span>
                          )}
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          {isEditing ? (
                            <select
                              defaultValue={kit?.shirt_size ?? 'M'}
                              className="px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-sm"
                              onChange={e => saveKitAssignment(player.id, { shirt_size: e.target.value as any })}
                            >
                              {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span className="text-sm text-slate-300">{kit?.shirt_size ?? '-'}</span>
                          )}
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          {isEditing ? (
                            <select
                              defaultValue={kit?.shorts_size ?? 'M'}
                              className="px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-sm"
                              onChange={e => saveKitAssignment(player.id, { shorts_size: e.target.value as any })}
                            >
                              {SHORTS_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span className="text-sm text-slate-300">{kit?.shorts_size ?? '-'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <select
                              defaultValue={kit?.kit_condition ?? 'good'}
                              className="px-2 py-1 bg-slate-700 border border-white/10 rounded text-white text-sm"
                              onChange={e => saveKitAssignment(player.id, { kit_condition: e.target.value as KitCondition })}
                            >
                              {KIT_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                          ) : (
                            <span className={`text-sm ${KIT_CONDITIONS.find(c => c.value === (kit?.kit_condition ?? 'good'))?.color}`}>
                              {KIT_CONDITIONS.find(c => c.value === (kit?.kit_condition ?? 'good'))?.label ?? '-'}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <button
                              onClick={() => setEditingPlayerId(null)}
                              className="p-2 bg-green-500 text-black rounded hover:bg-green-400"
                            >
                              <Check size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingPlayerId(player.id)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Match Day Bag */}
        {activeTab === 'matchday-bag' && (
          <div className="space-y-4">
            {/* Fixture Selector */}
            <div className="flex items-center gap-4">
              <select
                value={selectedFixtureId}
                onChange={e => setSelectedFixtureId(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500"
              >
                <option value="">Select a fixture...</option>
                {upcomingFixtures.map(f => (
                  <option key={f.id} value={f.id}>
                    vs {f.opponent} - {new Date(f.kickoff_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </option>
                ))}
              </select>
            </div>

            {selectedFixtureId && checklist ? (
              <>
                {/* Progress */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Bag Packed</span>
                    <span className="text-sm font-bold text-white">
                      {checklist.items.filter(i => i.is_checked).length}/{checklist.items.length}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(checklist.items.filter(i => i.is_checked).length / checklist.items.length) * 100}%` }}
                    />
                  </div>
                  {checklist.completed_at && (
                    <p className="text-xs text-green-400 mt-2">
                      Completed {new Date(checklist.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Checklist */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-2">
                  {checklist.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                        ${item.is_checked ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-800 hover:bg-slate-700'}
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded border-2 flex items-center justify-center
                        ${item.is_checked ? 'bg-green-500 border-green-500' : 'border-slate-500'}
                      `}>
                        {item.is_checked && <Check size={14} className="text-black" />}
                      </div>
                      <span className={`text-sm ${item.is_checked ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}

                  {/* Add Item */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={e => setNewChecklistItem(e.target.value)}
                      placeholder="Add item to bag..."
                      className="flex-1 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                      onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                    />
                    <button
                      onClick={handleAddChecklistItem}
                      disabled={!newChecklistItem.trim()}
                      className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg disabled:opacity-50"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ClipboardCheck size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a fixture to see the match day bag checklist</p>
              </div>
            )}
          </div>
        )}

        {/* Club Equipment */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Add Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddEquipment(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400"
              >
                <Plus size={18} />
                Add Equipment
              </button>
            </div>

            {/* Equipment by Category */}
            {['matchday', 'training', 'medical', 'other'].map(category => {
              const categoryItems = equipment.filter(e => e.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                    <h3 className="text-sm font-bold text-white uppercase">
                      {category === 'matchday' ? 'Match Day' : category}
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {categoryItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className={`text-xs ${item.condition === 'good' ? 'text-green-400' : item.condition === 'fair' ? 'text-amber-400' : 'text-red-400'}`}>
                            {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)} condition
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => {
                              deleteDemoClubEquipment(item.id);
                              setEquipment(prev => prev.filter(e => e.id !== item.id));
                            }}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Laundry */}
        {activeTab === 'laundry' && (
          <div className="space-y-4">
            {/* Add Batch Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddLaundry(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400"
              >
                <Plus size={18} />
                Log Dirty Kit
              </button>
            </div>

            {/* Laundry Batches */}
            {laundryBatches.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Droplets size={48} className="mx-auto mb-4 opacity-50" />
                <p>No laundry batches</p>
                <p className="text-xs mt-1">Log dirty kit after matches to track washing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {laundryBatches.map(batch => (
                  <div key={batch.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`
                            px-2 py-0.5 rounded text-xs font-bold
                            ${batch.status === 'dirty' ? 'bg-amber-500/20 text-amber-400' :
                              batch.status === 'washing' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'}
                          `}>
                            {batch.status === 'dirty' ? 'NEEDS WASHING' :
                             batch.status === 'washing' ? 'IN WASH' : 'READY'}
                          </span>
                          <span className="text-sm text-white font-medium">
                            {batch.kit_count} kits
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {batch.status === 'ready'
                            ? `Returned ${new Date(batch.returned_at!).toLocaleDateString()}`
                            : batch.status === 'washing'
                              ? `Sent ${new Date(batch.sent_at!).toLocaleDateString()}`
                              : `Created ${new Date(batch.created_at).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {batch.status === 'dirty' && (
                          <button
                            onClick={() => {
                              const updated = updateDemoLaundryStatus(batch.id, 'washing');
                              if (updated) setLaundryBatches(prev => prev.map(b => b.id === batch.id ? updated : b));
                            }}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded hover:bg-blue-500/30"
                          >
                            Mark Washing
                          </button>
                        )}
                        {batch.status === 'washing' && (
                          <button
                            onClick={() => {
                              const updated = updateDemoLaundryStatus(batch.id, 'ready');
                              if (updated) setLaundryBatches(prev => prev.map(b => b.id === batch.id ? updated : b));
                            }}
                            className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded hover:bg-green-500/30"
                          >
                            Mark Ready
                          </button>
                        )}
                        <button
                          onClick={() => {
                            deleteDemoLaundryBatch(batch.id);
                            setLaundryBatches(prev => prev.filter(b => b.id !== batch.id));
                          }}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kit Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Add Request Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddRequest(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400"
              >
                <Plus size={18} />
                New Request
              </button>
            </div>

            {/* Requests */}
            {kitRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No kit requests</p>
                <p className="text-xs mt-1">Log requests when players need new kit</p>
              </div>
            ) : (
              <div className="space-y-3">
                {kitRequests.map(request => {
                  const player = players.find(p => p.id === request.player_id);
                  return (
                    <div key={request.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{player?.name ?? 'Unknown'}</span>
                            <span className={`
                              px-2 py-0.5 rounded text-xs font-bold
                              ${request.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                request.status === 'ordered' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-green-500/20 text-green-400'}
                            `}>
                              {request.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            {request.request_type === 'new_kit' ? 'New kit' :
                             request.request_type === 'replacement' ? 'Replacement' : 'Size change'} - {' '}
                            {request.item_needed.replace('_', ' ')}
                            {request.size_needed && ` (${request.size_needed})`}
                          </p>
                          {request.reason && (
                            <p className="text-xs text-slate-500 mt-1">{request.reason}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => {
                                const updated = saveDemoKitRequest({ ...request, status: 'ordered' });
                                setKitRequests(prev => prev.map(r => r.id === request.id ? updated : r));
                              }}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded"
                            >
                              Mark Ordered
                            </button>
                          )}
                          {request.status === 'ordered' && (
                            <button
                              onClick={() => {
                                const updated = saveDemoKitRequest({ ...request, status: 'fulfilled' });
                                setKitRequests(prev => prev.map(r => r.id === request.id ? updated : r));
                              }}
                              className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded"
                            >
                              Mark Fulfilled
                            </button>
                          )}
                          <button
                            onClick={() => {
                              deleteDemoKitRequest(request.id);
                              setKitRequests(prev => prev.filter(r => r.id !== request.id));
                            }}
                            className="p-1 text-slate-400 hover:text-red-400"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Equipment Modal */}
      {showAddEquipment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Add Equipment</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newEquipment.name}
                onChange={e => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Equipment name"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              />
              <select
                value={newEquipment.category}
                onChange={e => setNewEquipment(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                <option value="matchday">Match Day</option>
                <option value="training">Training</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                value={newEquipment.quantity}
                onChange={e => setNewEquipment(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                placeholder="Quantity"
                min="1"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              />
              <select
                value={newEquipment.condition}
                onChange={e => setNewEquipment(prev => ({ ...prev, condition: e.target.value as any }))}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddEquipment(false)}
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const item = saveDemoClubEquipment({
                    id: generateDemoId(),
                    club_id: clubId,
                    ...newEquipment,
                  });
                  setEquipment(prev => [...prev, item]);
                  setShowAddEquipment(false);
                  setNewEquipment({ name: '', category: 'training', quantity: 1, condition: 'good' });
                }}
                disabled={!newEquipment.name.trim()}
                className="flex-1 px-4 py-2 bg-green-500 text-black font-bold rounded-lg disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Laundry Modal */}
      {showAddLaundry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Log Dirty Kit</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase block mb-2">Number of Kits</label>
                <input
                  type="number"
                  value={newLaundryCount}
                  onChange={e => setNewLaundryCount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="30"
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddLaundry(false)}
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const batch = createDemoLaundryBatch(clubId, newLaundryCount);
                  setLaundryBatches(prev => [...prev, batch]);
                  setShowAddLaundry(false);
                  setNewLaundryCount(11);
                }}
                className="flex-1 px-4 py-2 bg-green-500 text-black font-bold rounded-lg"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Request Modal */}
      {showAddRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">New Kit Request</h3>
            <div className="space-y-4">
              <select
                value={newRequest.player_id}
                onChange={e => setNewRequest(prev => ({ ...prev, player_id: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select player...</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                value={newRequest.request_type}
                onChange={e => setNewRequest(prev => ({ ...prev, request_type: e.target.value as any }))}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                <option value="new_kit">New Kit (new player)</option>
                <option value="replacement">Replacement (worn/damaged)</option>
                <option value="size_change">Size Change</option>
              </select>
              <select
                value={newRequest.item_needed}
                onChange={e => setNewRequest(prev => ({ ...prev, item_needed: e.target.value as any }))}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                <option value="full_kit">Full Kit</option>
                <option value="shirt">Shirt Only</option>
                <option value="shorts">Shorts Only</option>
                <option value="socks">Socks Only</option>
                <option value="training_kit">Training Kit</option>
              </select>
              <input
                type="text"
                value={newRequest.size_needed}
                onChange={e => setNewRequest(prev => ({ ...prev, size_needed: e.target.value }))}
                placeholder="Size needed (e.g., L, XL)"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              />
              <textarea
                value={newRequest.reason}
                onChange={e => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason (optional)"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white resize-none h-20"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddRequest(false)}
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const request = saveDemoKitRequest({
                    id: generateDemoId(),
                    club_id: clubId,
                    ...newRequest,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                  });
                  setKitRequests(prev => [...prev, request]);
                  setShowAddRequest(false);
                  setNewRequest({ player_id: '', request_type: 'replacement', item_needed: 'full_kit', size_needed: '', reason: '' });
                }}
                disabled={!newRequest.player_id}
                className="flex-1 px-4 py-2 bg-green-500 text-black font-bold rounded-lg disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentView;
