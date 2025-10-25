import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { NodeData } from './VisualNodes';

interface PropertiesPanelProps {
  selectedNode: { id: string; data: NodeData } | null;
  selectedEdge: { id: string; source: string; target: string; label?: string; data?: { name?: string; description?: string } } | null;
  nodes: Node[]; // Add nodes array so we can look up names
  onUpdateNode: (nodeId: string, newData: Partial<NodeData>) => void;
  onUpdateEdge: (edgeId: string, newData: { label?: string; data?: { name?: string; description?: string } }) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  selectedEdge,
  nodes,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onClose
}) => {
  const [formData, setFormData] = useState<NodeData>(
    selectedNode?.data || { name: '', type: 'agent' }
  );
  
  const [edgeLabel, setEdgeLabel] = useState(selectedEdge?.label || '');
  const [edgeName, setEdgeName] = useState(selectedEdge?.data?.name || '');
  const [edgeDescription, setEdgeDescription] = useState(selectedEdge?.data?.description || '');

  // Update formData when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data);
    }
  }, [selectedNode]);

  // Update edge data when selectedEdge changes
  useEffect(() => {
    if (selectedEdge) {
      setEdgeLabel(selectedEdge.label || '');
      setEdgeName(selectedEdge.data?.name || '');
      setEdgeDescription(selectedEdge.data?.description || '');
    }
  }, [selectedEdge]);

  if (!selectedNode && !selectedEdge) return null;

  const handleSave = () => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, formData);
    } else if (selectedEdge) {
      onUpdateEdge(selectedEdge.id, { 
        label: edgeLabel,
        data: {
          name: edgeName,
          description: edgeDescription
        }
      });
    }
    onClose();
  };

  const handleDeleteNode = () => {
    if (selectedNode && onDeleteNode) {
      if (confirm(`Are you sure you want to delete "${formData.name}"?`)) {
        onDeleteNode(selectedNode.id);
        onClose();
      }
    }
  };

  const handleDeleteEdge = () => {
    if (selectedEdge && onDeleteEdge) {
      if (confirm('Are you sure you want to delete this connection?')) {
        onDeleteEdge(selectedEdge.id);
        onClose();
      }
    }
  };

  const renderAgentProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Agent Prompt</label>
        <textarea
          value={formData.prompt || ''}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the agent's system prompt..."
        />
      </div>

      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isStart || false}
            onChange={(e) => setFormData({ ...formData, isStart: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Start Agent</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isOutput || false}
            onChange={(e) => setFormData({ ...formData, isOutput: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Output Agent</span>
        </label>
      </div>
    </div>
  );

  const renderToolProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tool Type</label>
        <select
          value={formData.api?.type || 'rest'}
          onChange={(e) => setFormData({ 
            ...formData, 
            api: { type: e.target.value, ...formData.api }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="rest">REST API</option>
          <option value="graph">Microsoft Graph</option>
          <option value="servicenow">ServiceNow</option>
          <option value="dataverse">Dataverse</option>
          <option value="mcp">MCP</option>
          <option value="sharepoint">SharePoint</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
        <input
          type="url"
          value={formData.api?.endpoint || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            api: { type: formData.api?.type || 'rest', endpoint: e.target.value, ...formData.api }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="https://api.example.com/endpoint"
        />
      </div>
    </div>
  );

  const renderGateProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gate Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gate Type</label>
        <select
          value={formData.gateType || 'condition'}
          onChange={(e) => setFormData({ ...formData, gateType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="condition">Condition</option>
          <option value="approval">Approval</option>
          <option value="merge">Merge</option>
          <option value="split">Split</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <input
          type="text"
          value={formData.condition || ''}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., amount > 1000"
        />
      </div>
    </div>
  );

  const renderEdgeProperties = () => {
    // Look up the node names from the nodes array
    const sourceNode = nodes.find(n => n.id === selectedEdge?.source);
    const targetNode = nodes.find(n => n.id === selectedEdge?.target);
    const sourceName = (sourceNode?.data as unknown as NodeData)?.name || 'Unknown';
    const targetName = (targetNode?.data as unknown as NodeData)?.name || 'Unknown';

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Edge Name</label>
          <input
            type="text"
            value={edgeName}
            onChange={(e) => setEdgeName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter edge name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Edge Description</label>
          <textarea
            value={edgeDescription}
            onChange={(e) => setEdgeDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter edge description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition / Label
          </label>
          <input
            type="text"
            value={edgeLabel}
            onChange={(e) => setEdgeLabel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., if approved, amount > 1000"
          />
          <p className="text-xs text-gray-500 mt-1">
            Add a condition or label to describe when this connection is used
          </p>
        </div>

        <div className="bg-yellow-50 p-3 rounded-md">
          <div className="text-xs font-medium text-yellow-800 mb-1">💡 Tip</div>
          <p className="text-xs text-yellow-700">
            Use conditions like "approved", "amount {'>'} 1000", or "status == active" to control workflow logic
          </p>
        </div>

        <div className="bg-blue-50 p-3 rounded-md">
          <div className="text-xs text-gray-600 mb-1">Connection</div>
          <div className="text-sm font-medium text-gray-900">
            {selectedEdge?.source} → {selectedEdge?.target}
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-md">
          <div className="text-xs text-gray-600 mb-1">Node Names</div>
          <div className="text-sm font-medium text-gray-900">
            {sourceName} → {targetName}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop overlay - full screen on mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Properties Panel - Bottom sheet on mobile, sidebar on desktop */}
      <div className="fixed bottom-0 left-0 right-0 lg:right-0 lg:left-auto lg:top-0 lg:bottom-auto h-[85vh] lg:h-full w-full lg:w-80 bg-white shadow-xl border-t lg:border-t-0 lg:border-l z-50 overflow-y-auto rounded-t-2xl lg:rounded-none">
        <div className="p-3 sm:p-4 border-b bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {selectedEdge ? '🔗 Connecting Line' : 
               formData.type === 'agent' ? '🤖 Agent' : 
               formData.type === 'tool' ? '🛠️ Tool' : '🚪 Gate'} Properties
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {selectedEdge && renderEdgeProperties()}
          {selectedNode && formData.type === 'agent' && renderAgentProperties()}
          {selectedNode && formData.type === 'tool' && renderToolProperties()}
          {selectedNode && formData.type === 'gate' && renderGateProperties()}

          <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 sm:py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition min-h-[44px]"
            >
              Save Changes
            </button>
            {selectedNode && onDeleteNode && (
              <button
                onClick={handleDeleteNode}
                className="px-4 py-3 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 transition min-h-[44px] sm:w-auto"
                title="Delete this node"
              >
                🗑️ Delete
              </button>
            )}
            {selectedEdge && onDeleteEdge && (
              <button
                onClick={handleDeleteEdge}
                className="px-4 py-3 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 transition min-h-[44px] sm:w-auto"
                title="Delete this connection"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};