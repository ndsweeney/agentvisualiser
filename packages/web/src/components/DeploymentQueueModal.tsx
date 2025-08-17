import React, { useState } from 'react';

interface DeploymentItem {
  id: string;
  name: string;
  version: string;
  compiled: any;
  compiledAt: string;
  sourceType: 'blueprint' | 'manual';
  sourceName?: string;
}

interface DeploymentQueueModalProps {
  deploymentItems: DeploymentItem[];
  onRemove: (itemId: string) => void;
  onDeploySelected: (selectedIds: string[], environment: string) => void;
  isDeploying: boolean;
  onClose: () => void;
}

export function DeploymentQueueModal({ deploymentItems, onRemove, onDeploySelected, isDeploying, onClose }: DeploymentQueueModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');

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
    if (selectedItems.size === deploymentItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(deploymentItems.map(item => item.id)));
    }
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${itemName}" from the deployment queue?`
    );
    if (confirmed) {
      onRemove(itemId);
      // Remove from selection if it was selected
      const newSelection = new Set(selectedItems);
      newSelection.delete(itemId);
      setSelectedItems(newSelection);
    }
  };

  const handleDeploySelected = () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one project to deploy.');
      return;
    }
    onDeploySelected(Array.from(selectedItems), selectedEnvironment);
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Deployment Queue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {deploymentItems.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Ready for Deployment</h3>
              <p className="text-gray-600 mb-4">
                Compile projects to add them to the deployment queue for batch deployment.
              </p>
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">💡 How to Use the Deployment Queue:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Compile blueprints or projects to add them to the deployment queue</li>
                  <li>• Select which compiled projects to deploy together</li>
                  <li>• Choose your target environment (development, staging, production)</li>
                  <li>• Deploy multiple projects in batch to the same environment</li>
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
                      checked={selectedItems.size === deploymentItems.length}
                      onChange={() => {}} // Controlled by button click
                      className="rounded"
                    />
                    <span>
                      {selectedItems.size === deploymentItems.length ? 'Deselect All' : 'Select All'}
                    </span>
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedItems.size} of {deploymentItems.length} selected
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="environment" className="text-sm font-medium text-gray-700">
                      Environment:
                    </label>
                    <select
                      id="environment"
                      value={selectedEnvironment}
                      onChange={(e) => setSelectedEnvironment(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  <button
                    onClick={handleDeploySelected}
                    disabled={selectedItems.size === 0 || isDeploying}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:bg-purple-400 disabled:cursor-not-allowed"
                  >
                    {isDeploying ? 'Deploying...' : `Deploy Selected (${selectedItems.size})`}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {deploymentItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedItems.has(item.id) 
                        ? 'border-purple-300 bg-purple-50' 
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
                            <p className="text-sm text-gray-600 mt-1">Version: {item.version}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                Compiled: {new Date(item.compiledAt).toLocaleString()}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded border ${
                                item.sourceType === 'blueprint' 
                                  ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}>
                                {item.sourceType === 'blueprint' ? `Blueprint: ${item.sourceName}` : 'Manual Project'}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                Agents: {item.compiled.agents?.length || 0}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                Tools: {item.compiled.topology?.nodes?.filter((node: any) => node.type === 'tool').length || 0}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id, item.name)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors ml-2"
                            title="Remove from deployment queue"
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
                <div className={`mt-6 p-4 border rounded-md ${getEnvironmentColor(selectedEnvironment)}`}>
                  <h4 className="font-medium mb-2">
                    Ready to deploy {selectedItems.size} project{selectedItems.size !== 1 ? 's' : ''} to {selectedEnvironment}
                  </h4>
                  <p className="text-sm">
                    Selected projects will be deployed in sequence to the <strong>{selectedEnvironment}</strong> environment. 
                    Successfully deployed projects will be removed from the queue.
                  </p>
                  {selectedEnvironment === 'production' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      ⚠️ <strong>Production Deployment:</strong> Please ensure all projects have been tested in staging first.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}