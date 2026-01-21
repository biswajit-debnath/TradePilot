import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface FieldConfig {
  id: string;
  label: string;
  enabled: boolean;
  category?: 'basic' | 'option' | 'stock' | 'price' | 'live';
  order: number; // Global order for all fields
}

interface LivePositionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FieldConfig[];
  onSave: (fields: FieldConfig[]) => void;
}

export default function LivePositionSettingsModal({
  isOpen,
  onClose,
  fields,
  onSave,
}: LivePositionSettingsModalProps) {
  const [localFields, setLocalFields] = useState<FieldConfig[]>(fields);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    // Sort fields by order when they come in
    setLocalFields([...fields].sort((a, b) => a.order - b.order));
  }, [fields]);

  if (!isOpen) return null;

  const toggleField = (id: string) => {
    setLocalFields(prev =>
      prev.map(field =>
        field.id === id ? { ...field, enabled: !field.enabled } : field
      )
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newFields = [...localFields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);
    
    // Reorder all fields
    const reorderedFields = newFields.map((field, index) => ({
      ...field,
      order: index
    }));
    
    setLocalFields(reorderedFields);
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...localFields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx
    }));
    setLocalFields(reorderedFields);
  };

  const moveDown = (index: number) => {
    if (index === localFields.length - 1) return;
    const newFields = [...localFields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx
    }));
    setLocalFields(reorderedFields);
  };

  const handleSave = () => {
    onSave(localFields);
    onClose();
  };

  const handleReset = () => {
    // Reset to default order and enable all
    const resetFields = localFields.map((field, index) => ({
      ...field,
      enabled: true,
      order: index
    }));
    setLocalFields(resetFields);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'basic': return '📋';
      case 'option': return '📊';
      case 'stock': return '📈';
      case 'price': return '💰';
      case 'live': return '⚡';
      default: return '📌';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'basic': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'option': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'stock': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'price': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'live': return 'text-green-400 bg-green-500/10 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-cyan-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-5 border-b border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-cyan-400">Display Settings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Drag to reorder • Toggle to show/hide</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Instructions */}
          <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-xs text-cyan-300 flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span>
                Drag the <strong>☰ handle</strong> to reorder fields. Use <strong>↑↓ arrows</strong> for fine control. 
                <strong> Toggle checkbox</strong> to show/hide.
              </span>
            </p>
          </div>

          {/* Fields List */}
          <div className="space-y-2">
            {localFields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`group relative flex items-center gap-3 p-4 rounded-xl transition-all border ${
                  draggedIndex === index
                    ? 'opacity-40 scale-95'
                    : dragOverIndex === index
                    ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]'
                    : 'bg-black/40 border-gray-700/50 hover:border-cyan-500/50 hover:bg-black/60'
                }`}
              >
                {/* Position Number */}
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                  <span className="text-lg font-bold text-cyan-400">{index + 1}</span>
                </div>

                {/* Drag Handle */}
                <div className="cursor-move hover:text-cyan-400 transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-500 group-hover:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>

                {/* Field Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getCategoryIcon(field.category)}</span>
                    <span className="text-sm font-medium text-gray-200 truncate">{field.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(field.category)}`}>
                      {field.category?.toUpperCase() || 'OTHER'}
                    </span>
                    {!field.enabled && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {/* Move Up/Down */}
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === localFields.length - 1}
                      className="p-1 rounded hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Toggle Visibility */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={() => toggleField(field.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Total Fields: {localFields.length}</span>
              <span>Visible: {localFields.filter(f => f.enabled).length}</span>
              <span>Hidden: {localFields.filter(f => !f.enabled).length}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 p-5 border-t border-cyan-500/20 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium transition-all"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-cyan-500/30 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
