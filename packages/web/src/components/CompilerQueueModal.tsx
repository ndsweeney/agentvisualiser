import React, { useState } from 'react';

interface BacklogItem {
  id: string;
  name: string;
  description: string;
  projectSpec: any;
  addedAt: string;
}

interface CompilerQueueModalProps {
  backlogItems: BacklogItem[];
  onRemove: (itemId: string) => void;
  onCompileSelected: (selectedIds: string[]) => void;
  isCompiling: boolean;
  onClose: () => void;
}

export function CompilerQueueModal({ backlogItems, onRemove, onCompileSelected, isCompiling, onClose }: CompilerQueueModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSelectItem = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === backlogItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(backlogItems.map(item => item.id)));
    }
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${itemName}" from the compiler queue?`
    );
    if (confirmed) {
      onRemove(itemId);
      // Remove from selection if it was selected
      const newSelection = new Set(selectedItems);
      newSelection.delete(itemId);
      setSelectedItems(newSelection);
    }
  };

  const handleCompileSelected = () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one project to compile.');
      return;
    }
    onCompileSelected(Array.from(selectedItems));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Compiler Queue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {backlogItems.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects in Queue</h3>
              <p className="text-gray-600 mb-4">
                Add blueprints to the compiler queue to batch compile multiple projects at once.
              </p>
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">💡 How to Use the Compiler Queue:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Browse blueprints and click "Add to Queue" instead of "Use Now"</li>
                  <li>• Queue up multiple projects you want to compile together</li>
                  <li>• Select which projects to compile and run them in batch</li>
                  <li>• Remove projects from the queue if you change your mind</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.size === backlogItems.length}
                      onChange={() => {}} // Controlled by button click
                      className="rounded"
                    />
                    <span>
                      {selectedItems.size === backlogItems.length ? 'Deselect All' : 'Select All'}
                    </span>
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedItems.size} of {backlogItems.length} selected
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCompileSelected}
                    disabled={selectedItems.size === 0 || isCompiling}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {isCompiling ? 'Compiling...' : `Compile Selected (${selectedItems.size})`}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {backlogItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedItems.has(item.id) 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                Added: {new Date(item.addedAt).toLocaleString()}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                Agents: {item.projectSpec.orchestration?.agents?.length || 0}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                Tools: {item.projectSpec.orchestration?.tools?.length || 0}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id, item.name)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors ml-2"
                            title="Remove from queue"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedItems.size > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-medium text-green-900 mb-2">
                    Ready to compile {selectedItems.size} project{selectedItems.size !== 1 ? 's' : ''}
                  </h4>
                  <p className="text-sm text-green-800">
                    Selected projects will be compiled in sequence. Successfully compiled projects will be removed from the queue.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}