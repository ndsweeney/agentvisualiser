import React, { useState } from 'react';
import { NodeData } from './VisualNodes';

interface PropertiesPanelProps {
  selectedNode: { id: string; data: NodeData } | null;
  onUpdateNode: (nodeId: string, newData: Partial<NodeData>) => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onClose
}) => {
  const [formData, setFormData] = useState<NodeData>(
    selectedNode?.data || { name: '', type: 'agent' }
  );

  if (!selectedNode) return null;

  const handleSave = () => {
    onUpdateNode(selectedNode.id, formData);
    onClose();
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

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l z-50 overflow-y-auto">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {formData.type === 'agent' ? '🤖' : formData.type === 'tool' ? '🛠️' : '🚪'} Properties
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4">
        {formData.type === 'agent' && renderAgentProperties()}
        {formData.type === 'tool' && renderToolProperties()}
        {formData.type === 'gate' && renderGateProperties()}

        <div className="flex space-x-2 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};