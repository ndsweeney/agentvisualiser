import React from 'react';
import { Handle, Position } from '@xyflow/react';

export interface NodeData {
  name: string;
  type: 'agent' | 'tool' | 'gate';
  prompt?: string;
  tools?: string[];
  config?: Record<string, any>;
  gateType?: string;
  condition?: string;
  api?: {
    type: string;
    endpoint?: string;
    authentication?: Record<string, any>;
  };
  isStart?: boolean;
  isOutput?: boolean;
}

export const AgentNode = ({ data, isConnectable }: { data: NodeData; isConnectable: boolean }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-blue-200 min-w-[160px] hover:border-blue-400 transition-colors">
    <Handle 
      type="target" 
      position={Position.Top} 
      isConnectable={isConnectable}
      className="w-3 h-3 bg-blue-500 border-2 border-white"
    />
    <div className="flex items-center">
      <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex items-center justify-center">
        <span className="text-white text-xs">🤖</span>
      </div>
      <div>
        <div className="text-sm font-bold text-gray-900">{data.name}</div>
        <div className="text-xs text-gray-500">Agent</div>
        {data.tools && data.tools.length > 0 && (
          <div className="text-xs text-blue-600 mt-1">{data.tools.length} tools</div>
        )}
      </div>
    </div>
    {data.isStart && (
      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
        START
      </div>
    )}
    {data.isOutput && (
      <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
        END
      </div>
    )}
    <Handle 
      type="source" 
      position={Position.Bottom} 
      isConnectable={isConnectable}
      className="w-3 h-3 bg-blue-500 border-2 border-white"
    />
  </div>
);

export const ToolNode = ({ data, isConnectable }: { data: NodeData; isConnectable: boolean }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-green-200 min-w-[140px] hover:border-green-400 transition-colors">
    <Handle 
      type="target" 
      position={Position.Top} 
      isConnectable={isConnectable}
      className="w-3 h-3 bg-green-500 border-2 border-white"
    />
    <div className="flex items-center">
      <div className="w-4 h-4 bg-green-500 rounded-full mr-2 flex items-center justify-center">
        <span className="text-white text-xs">🛠️</span>
      </div>
      <div>
        <div className="text-sm font-bold text-gray-900">{data.name}</div>
        <div className="text-xs text-gray-500">Tool</div>
        {data.api && (
          <div className="text-xs text-green-600 mt-1">{data.api.type}</div>
        )}
      </div>
    </div>
    <Handle 
      type="source" 
      position={Position.Bottom} 
      isConnectable={isConnectable}
      className="w-3 h-3 bg-green-500 border-2 border-white"
    />
  </div>
);

export const GateNode = ({ data, isConnectable }: { data: NodeData; isConnectable: boolean }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-purple-200 min-w-[120px] hover:border-purple-400 transition-colors">
    <Handle 
      type="target" 
      position={Position.Top} 
      isConnectable={isConnectable}
      className="w-3 h-3 bg-purple-500 border-2 border-white"
    />
    <div className="flex items-center">
      <div className="w-4 h-4 bg-purple-500 rounded-full mr-2 flex items-center justify-center">
        <span className="text-white text-xs">🚪</span>
      </div>
      <div>
        <div className="text-sm font-bold text-gray-900">{data.name || 'Gate'}</div>
        <div className="text-xs text-gray-500">{data.gateType || 'condition'}</div>
        {data.condition && (
          <div className="text-xs text-purple-600 mt-1 max-w-20 truncate" title={data.condition}>
            {data.condition}
          </div>
        )}
      </div>
    </div>
    <Handle 
      type="source" 
      position={Position.Bottom} 
      isConnectable={isConnectable}
      className="w-3 h-3 bg-purple-500 border-2 border-white"
    />
  </div>
);