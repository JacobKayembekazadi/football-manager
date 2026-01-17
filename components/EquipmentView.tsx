/**
 * EquipmentView Component
 *
 * Full equipment management: inventory, issue/return, laundry tracking.
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Shirt,
  Activity,
  Heart,
  Box,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  Droplets,
  Check,
} from 'lucide-react';
import {
  EquipmentItem,
  EquipmentCategory,
  EquipmentCondition,
  Player,
  Club,
} from '../types';
import {
  getEquipmentItems,
  createEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem,
  getInventorySummary,
  getActiveAssignments,
  issueEquipment,
  returnEquipment,
  getActiveLaundry,
  sendToLaundry,
  returnFromLaundry,
  EquipmentAssignmentWithDetails,
} from '../services/equipmentService';

interface EquipmentViewProps {
  club: Club;
}

const categoryConfig: Record<
  EquipmentCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  kit: { label: 'Kit', icon: <Shirt size={16} />, color: 'text-blue-400' },
  training: { label: 'Training', icon: <Activity size={16} />, color: 'text-green-400' },
  medical: { label: 'Medical', icon: <Heart size={16} />, color: 'text-red-400' },
  other: { label: 'Other', icon: <Box size={16} />, color: 'text-slate-400' },
};

type Tab = 'inventory' | 'issued' | 'laundry';

const EquipmentView: React.FC<EquipmentViewProps> = ({ club }) => {
  const players = club.players;
  const clubId = club.id;
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignmentWithDetails[]>([]);
  const [laundry, setLaundry] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total_items: 0,
    total_quantity: 0,
    available: 0,
    issued: 0,
    low_stock: 0,
    in_laundry: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<EquipmentCategory | 'all'>('all');

  // Modals
  const [showAddItem, setShowAddItem] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showLaundryModal, setShowLaundryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

  // Form state
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'kit' as EquipmentCategory,
    size: '',
    quantity_total: 1,
    min_stock: 0,
    condition: 'good' as EquipmentCondition,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [clubId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, summaryData, assignmentsData, laundryData] = await Promise.all([
        getEquipmentItems(clubId),
        getInventorySummary(clubId),
        getActiveAssignments(clubId),
        getActiveLaundry(clubId),
      ]);
      setItems(itemsData);
      setSummary(summaryData);
      setAssignments(assignmentsData);
      setLaundry(laundryData);
    } catch (error) {
      console.error('Error loading equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const created = await createEquipmentItem(clubId, {
        ...newItem,
        quantity_available: newItem.quantity_total,
      });
      setItems(prev => [...prev, created]);
      setShowAddItem(false);
      setNewItem({
        name: '',
        category: 'kit',
        size: '',
        quantity_total: 1,
        min_stock: 0,
        condition: 'good',
        notes: '',
      });
      loadData(); // Refresh summary
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteEquipmentItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleIssue = async () => {
    if (!selectedItem || !selectedPlayer) return;
    try {
      await issueEquipment(clubId, selectedItem.id, selectedPlayer);
      setShowIssueModal(false);
      setSelectedItem(null);
      setSelectedPlayer('');
      loadData();
    } catch (error) {
      console.error('Error issuing equipment:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleReturn = async (assignmentId: string) => {
    try {
      await returnEquipment(assignmentId);
      loadData();
    } catch (error) {
      console.error('Error returning equipment:', error);
    }
  };

  const handleReturnLaundry = async (laundryId: string) => {
    try {
      await returnFromLaundry(laundryId);
      loadData();
    } catch (error) {
      console.error('Error returning laundry:', error);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory =
      filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(i => i.quantity_available <= i.min_stock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Equipment</h2>
          <p className="text-slate-400 text-sm mt-1">
            Kit inventory, assignments, and laundry tracking
          </p>
        </div>
        <button
          onClick={() => setShowAddItem(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Total Items</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.total_items}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">In Stock</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{summary.available}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Issued</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{summary.issued}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">In Laundry</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{summary.in_laundry}</p>
        </div>
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 col-span-2">
          <p className="text-xs text-slate-500 uppercase">Low Stock Alerts</p>
          <p className={`text-2xl font-bold mt-1 ${summary.low_stock > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {summary.low_stock}
          </p>
        </div>
      </div>

      {/* Low Stock Warning */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle size={16} />
            <span className="font-semibold">Low Stock Alert</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <span
                key={item.id}
                className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded"
              >
                {item.name} ({item.quantity_available} left)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/10 w-fit">
        {(['inventory', 'issued', 'laundry'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-green-500 text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value as any)}
                  className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={categoryConfig[item.category].color}>
                          {categoryConfig[item.category].icon}
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {categoryConfig[item.category].label}
                            {item.size && ` • ${item.size}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-white">
                          {item.quantity_available}
                        </span>
                        <span className="text-slate-500 text-sm">
                          /{item.quantity_total}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowIssueModal(true);
                        }}
                        disabled={item.quantity_available === 0}
                        className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                      >
                        Issue <ArrowRight size={12} className="inline ml-1" />
                      </button>
                    </div>

                    {item.quantity_available <= item.min_stock && (
                      <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle size={12} /> Low stock
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No equipment items found</p>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="mt-4 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-500 text-sm rounded-lg hover:bg-green-500/20 transition-colors"
                  >
                    Add your first item
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Issued Tab */}
          {activeTab === 'issued' && (
            <div className="space-y-3">
              {assignments.length > 0 ? (
                assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between bg-slate-800/50 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                        {assignment.player?.number || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {assignment.player?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {assignment.item?.name} × {assignment.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        {new Date(assignment.issued_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleReturn(assignment.id)}
                        className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-500 text-xs rounded-lg hover:bg-green-500/20 transition-colors"
                      >
                        <ArrowLeft size={12} className="inline mr-1" /> Return
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No equipment currently issued</p>
                </div>
              )}
            </div>
          )}

          {/* Laundry Tab */}
          {activeTab === 'laundry' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowLaundryModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors"
              >
                <Droplets size={16} /> Send to Laundry
              </button>

              {laundry.length > 0 ? (
                <div className="space-y-3">
                  {laundry.map(batch => (
                    <div
                      key={batch.id}
                      className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-purple-400">
                          <Droplets size={16} />
                          <span className="font-medium">Laundry Batch</span>
                        </div>
                        <button
                          onClick={() => handleReturnLaundry(batch.id)}
                          className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-500 text-xs rounded-lg hover:bg-green-500/20 transition-colors"
                        >
                          <Check size={12} className="inline mr-1" /> Mark Returned
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">
                        Sent: {new Date(batch.sent_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-300 mt-2">
                        {batch.items?.length || 0} item types in wash
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <Droplets className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No items in laundry</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowAddItem(false)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Add Equipment Item</h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Home Shirt #7"
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value as EquipmentCategory }))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none"
                  >
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Size (optional)</label>
                  <input
                    type="text"
                    value={newItem.size}
                    onChange={e => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                    placeholder="e.g., L"
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newItem.quantity_total}
                    onChange={e => setNewItem(prev => ({ ...prev, quantity_total: parseInt(e.target.value) || 1 }))}
                    min={1}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={newItem.min_stock}
                    onChange={e => setNewItem(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAddItem}
                disabled={!newItem.name.trim()}
                className="w-full py-3 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 disabled:opacity-50 transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowIssueModal(false)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Issue Equipment</h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                <p className="text-white font-medium">{selectedItem.name}</p>
                <p className="text-xs text-slate-400">
                  Available: {selectedItem.quantity_available}
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Issue to Player</label>
                <select
                  value={selectedPlayer}
                  onChange={e => setSelectedPlayer(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select player...</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleIssue}
                disabled={!selectedPlayer}
                className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 disabled:opacity-50 transition-colors"
              >
                Issue to Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentView;
