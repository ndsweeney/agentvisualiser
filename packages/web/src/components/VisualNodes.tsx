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
  <div className="px-2 py-2 sm:px-4 sm:py-3 shadow-lg rounded-lg bg-white border-2 border-blue-200 min-w-[120px] sm:min-w-[160px] hover:border-blue-400 transition-colors">
    {/* Top Handle */}
    <Handle 
      type="target" 
      position={Position.Top} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 border-2 border-white"
      id="top"
    />
    {/* Left Handle */}
    <Handle 
      type="target" 
      position={Position.Left} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 border-2 border-white"
      id="left"
    />
    {/* Right Handle */}
    <Handle 
      type="source" 
      position={Position.Right} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 border-2 border-white"
      id="right"
    />
    <div className="flex items-center">
      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full mr-1 sm:mr-2 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[8px] sm:text-xs">🤖</span>
      </div>
      <div className="min-w-0">
        <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">{data.name}</div>
        <div className="text-[10px] sm:text-xs text-gray-500">Agent</div>
        {data.tools && data.tools.length > 0 && (
          <div className="text-[10px] sm:text-xs text-blue-600 mt-1">{data.tools.length} tools</div>
        )}
      </div>
    </div>
    {data.isStart && (
      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-green-500 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full">
        START
      </div>
    )}
    {data.isOutput && (
      <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-red-500 text-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full">
        END
      </div>
    )}
    {/* Bottom Handle */}
    <Handle 
      type="source" 
      position={Position.Bottom} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 border-2 border-white"
      id="bottom"
    />
  </div>
);

export const ToolNode = ({ data, isConnectable }: { data: NodeData; isConnectable: boolean }) => (
  <div className="px-2 py-2 sm:px-4 sm:py-3 shadow-lg rounded-lg bg-white border-2 border-green-200 min-w-[100px] sm:min-w-[140px] hover:border-green-400 transition-colors">
    {/* Top Handle */}
    <Handle 
      type="target" 
      position={Position.Top} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border-2 border-white"
      id="top"
    />
    {/* Left Handle */}
    <Handle 
      type="target" 
      position={Position.Left} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border-2 border-white"
      id="left"
    />
    {/* Right Handle */}
    <Handle 
      type="source" 
      position={Position.Right} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border-2 border-white"
      id="right"
    />
    <div className="flex items-center">
      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full mr-1 sm:mr-2 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[8px] sm:text-xs">🛠️</span>
      </div>
      <div className="min-w-0">
        <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">{data.name}</div>
        <div className="text-[10px] sm:text-xs text-gray-500">Tool</div>
        {data.api && (
          <div className="text-[10px] sm:text-xs text-green-600 mt-1 truncate">{data.api.type}</div>
        )}
      </div>
    </div>
    {/* Bottom Handle */}
    <Handle 
      type="source" 
      position={Position.Bottom} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 border-2 border-white"
      id="bottom"
    />
  </div>
);

export const GateNode = ({ data, isConnectable }: { data: NodeData; isConnectable: boolean }) => (
  <div className="px-2 py-2 sm:px-4 sm:py-3 shadow-lg rounded-lg bg-white border-2 border-purple-200 min-w-[90px] sm:min-w-[120px] hover:border-purple-400 transition-colors">
    {/* Top Handle */}
    <Handle 
      type="target" 
      position={Position.Top} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 border-2 border-white"
      id="top"
    />
    {/* Left Handle */}
    <Handle 
      type="target" 
      position={Position.Left} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 border-2 border-white"
      id="left"
    />
    {/* Right Handle */}
    <Handle 
      type="source" 
      position={Position.Right} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 border-2 border-white"
      id="right"
    />
    <div className="flex items-center">
      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full mr-1 sm:mr-2 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[8px] sm:text-xs">🚪</span>
      </div>
      <div className="min-w-0">
        <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">{data.name || 'Gate'}</div>
        <div className="text-[10px] sm:text-xs text-gray-500 truncate">{data.gateType || 'condition'}</div>
        {data.condition && (
          <div className="text-[10px] sm:text-xs text-purple-600 mt-1 max-w-16 sm:max-w-20 truncate" title={data.condition}>
            {data.condition}
          </div>
        )}
      </div>
    </div>
    {/* Bottom Handle */}
    <Handle 
      type="source" 
      position={Position.Bottom} 
      isConnectable={isConnectable}
      className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 border-2 border-white"
      id="bottom"
    />
  </div>
);