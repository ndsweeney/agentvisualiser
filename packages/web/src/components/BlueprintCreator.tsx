import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Panel,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { AgentNode, ToolNode, GateNode, NodeData } from './VisualNodes';
import { PropertiesPanel } from './PropertiesPanel';
import type { Blueprint } from '@agentfactory/types';

interface BlueprintCreatorProps {
  onSave: (blueprint: Blueprint) => void;
  onCancel: () => void;
  existingBlueprint?: Blueprint; // Add support for editing existing blueprints
}

const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
  toolNode: ToolNode,
  gateNode: GateNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Main component wrapped in provider
export const BlueprintCreator: React.FC<BlueprintCreatorProps> = ({ onSave, onCancel, existingBlueprint }) => {
  return (
    <ReactFlowProvider>
      <BlueprintCreatorInner onSave={onSave} onCancel={onCancel} existingBlueprint={existingBlueprint} />
    </ReactFlowProvider>
  );
};

const BlueprintCreatorInner: React.FC<BlueprintCreatorProps> = ({ onSave, onCancel, existingBlueprint }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: NodeData } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [blueprintInfo, setBlueprintInfo] = useState({
    name: existingBlueprint?.name || '',
    description: existingBlueprint?.description || '',
    category: existingBlueprint?.category || '',
    tags: existingBlueprint?.tags || [] as string[]
  });
  
  // Collapsible section states - collapsed by default
  const [sectionsExpanded, setSectionsExpanded] = useState({
    agents: false,
    tools: false,
    gates: false
  });
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { getViewport } = useReactFlow();

  // Toggle section expansion
  const toggleSection = (section: 'agents' | 'tools' | 'gates') => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode({ id: node.id, data: node.data as unknown as NodeData });
  }, []);

  const addAgentNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `agent-${Date.now()}`,
      type: 'agentNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        type: 'agent',
        name: `${type} Agent`,
        prompt: `You are a ${type.toLowerCase()} agent. Process tasks according to your role.`,
        tools: [],
        config: {}
      } as unknown as Record<string, unknown>
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const addToolNode = useCallback((toolType: string) => {
    const newNode: Node = {
      id: `tool-${Date.now()}`,
      type: 'toolNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        type: 'tool',
        name: `${toolType} Tool`,
        config: {},
        api: {
          type: toolType.toLowerCase(),
          endpoint: '',
          authentication: {}
        }
      } as unknown as Record<string, unknown>
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const addGateNode = useCallback((gateType: string) => {
    const newNode: Node = {
      id: `gate-${Date.now()}`,
      type: 'gateNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        type: 'gate',
        name: `${gateType} Gate`,
        gateType: gateType.toLowerCase(),
        condition: gateType === 'Condition' ? 'value > threshold' : ''
      } as unknown as Record<string, unknown>
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const onUpdateNode = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...(node.data as unknown as NodeData), ...newData } as unknown as Record<string, unknown> } : node
      )
    );
  }, [setNodes]);

  const downloadImage = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.setAttribute('download', filename);
    a.setAttribute('href', dataUrl);
    a.click();
  };

  const exportToImage = useCallback(async (format: 'png' | 'jpg' | 'svg' = 'png') => {
    if (!reactFlowWrapper.current) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const viewport = getViewport();
      
      // Get the React Flow viewport element
      const viewportElement = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;
      
      if (!viewportElement) {
        throw new Error('Could not find React Flow viewport element');
      }

      const filename = `${blueprintInfo.name || 'blueprint'}-${Date.now()}`;
      
      const options = {
        backgroundColor: '#ffffff',
        width: reactFlowBounds.width,
        height: reactFlowBounds.height,
        style: {
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
        filter: (node: Element) => {
          // Exclude controls, minimap, and other UI elements from export
          return !node.classList?.contains('react-flow__controls') &&
                 !node.classList?.contains('react-flow__minimap') &&
                 !node.classList?.contains('react-flow__panel') &&
                 !node.classList?.contains('react-flow__attribution');
        },
        pixelRatio: 2, // Higher quality
      };

      let dataUrl: string;
      
      switch (format) {
        case 'jpg':
          dataUrl = await toJpeg(viewportElement, { ...options, quality: 0.95 });
          downloadImage(dataUrl, `${filename}.jpg`);
          break;
        case 'svg':
          dataUrl = await toSvg(viewportElement, options);
          downloadImage(dataUrl, `${filename}.svg`);
          break;
        default: // png
          dataUrl = await toPng(viewportElement, options);
          downloadImage(dataUrl, `${filename}.png`);
          break;
      }
      
      console.log(`Successfully exported blueprint as ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [blueprintInfo.name, getViewport]);

  // Load existing blueprint data into the editor
  useEffect(() => {
    const blueprintData = existingBlueprint?.template || (existingBlueprint as any)?.spec;
    
    if (blueprintData?.orchestration) {
      const orchestration = blueprintData.orchestration;
      
      // Convert agents to nodes
      const agentNodes: Node[] = orchestration.agents.map((agent, index) => ({
        id: agent.id,
        type: 'agentNode',
        position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
        data: {
          type: 'agent',
          name: agent.name,
          prompt: agent.prompt,
          tools: agent.tools,
          config: {},
          isStart: agent.id === orchestration.startNode,
          isOutput: orchestration.outputs.includes(agent.id)
        } as unknown as Record<string, unknown>
      }));

      // Convert tools to nodes
      const toolNodes: Node[] = orchestration.tools.map((tool, index) => ({
        id: tool.id,
        type: 'toolNode',
        position: { x: 500 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
        data: {
          type: 'tool',
          name: tool.name,
          config: tool.config,
          api: {
            type: tool.kind,
            endpoint: tool.config.endpoint || '',
            authentication: tool.auth?.credentials || {}
          }
        } as unknown as Record<string, unknown>
      }));

      // Convert gates to nodes
      const gateNodes: Node[] = (orchestration.gates || []).map((gate, index) => ({
        id: gate.id,
        type: 'gateNode',
        position: { x: 200 + (index % 3) * 300, y: 300 + Math.floor(index / 3) * 200 },
        data: {
          type: 'gate',
          name: `${gate.type.charAt(0).toUpperCase() + gate.type.slice(1)} Gate`,
          gateType: gate.type,
          condition: gate.condition || ''
        } as unknown as Record<string, unknown>
      }));

      // Convert edges
      const flowEdges: Edge[] = orchestration.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.condition,
        type: 'default'
      }));

      // Set all nodes and edges
      setNodes([...agentNodes, ...toolNodes, ...gateNodes]);
      setEdges(flowEdges);
    }
  }, [existingBlueprint, setNodes, setEdges]);

  const saveBlueprint = useCallback(() => {
    if (!blueprintInfo.name.trim()) {
      alert('Please enter a blueprint name');
      return;
    }

    const startNodes = nodes.filter(node => (node.data as unknown as NodeData).isStart);
    const outputNodes = nodes.filter(node => (node.data as unknown as NodeData).isOutput);

    // Check if this is a built-in blueprint being edited (should create a copy)
    const isBuiltInBlueprint = existingBlueprint && ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'].includes(existingBlueprint.id);
    
    // Generate schema-compliant ProjectSpec
    const blueprint: Blueprint = {
      id: isBuiltInBlueprint ? `custom-${Date.now()}` : (existingBlueprint?.id || `visual-${Date.now()}`), // Create new ID for built-in blueprints
      name: blueprintInfo.name,
      description: blueprintInfo.description,
      category: blueprintInfo.category,
      tags: blueprintInfo.tags,
      template: {
        id: blueprintInfo.name.toLowerCase().replace(/\s+/g, '-'),
        name: blueprintInfo.name,
        version: isBuiltInBlueprint ? '1.0.0' : (existingBlueprint?.template?.version || '1.0.0'),
        description: blueprintInfo.description,
        orchestration: {
          id: `${blueprintInfo.name.toLowerCase().replace(/\s+/g, '-')}-orchestration`,
          name: `${blueprintInfo.name} Orchestration`,
          agents: nodes
            .filter(node => (node.data as unknown as NodeData).type === 'agent')
            .map(node => {
              const data = node.data as unknown as NodeData;
              return {
                id: node.id,
                name: data.name,
                prompt: data.prompt || 'You are a helpful agent.',
                tools: data.tools || [],
                // Add optional memory and policies with default values if needed
                memory: {
                  type: 'ephemeral' as const,
                  maxTokens: 4000
                },
                policies: {
                  maxIterations: 10,
                  timeout: 30000,
                  retryPolicy: 'exponential' as const
                }
              };
            }),
          tools: nodes
            .filter(node => (node.data as unknown as NodeData).type === 'tool')
            .map(node => {
              const data = node.data as unknown as NodeData;
              const apiType = data.api?.type || 'rest';
              
              // Map API types to valid schema kinds
              const kindMapping: Record<string, 'graph' | 'sharepoint' | 'servicenow' | 'dataverse' | 'rest' | 'mcp'> = {
                'rest api': 'rest',
                'rest': 'rest',
                'database': 'rest',
                'email': 'rest',
                'graph api': 'graph',
                'graph': 'graph',
                'servicenow': 'servicenow',
                'file system': 'rest',
                'mcp': 'mcp',
                'dataverse': 'dataverse',
                'sharepoint': 'sharepoint'
              };
              
              return {
                id: node.id,
                name: data.name,
                kind: kindMapping[apiType.toLowerCase()] || 'rest',
                config: {
                  endpoint: data.api?.endpoint || '',
                  ...data.config
                },
                auth: {
                  type: 'none' as const,
                  credentials: data.api?.authentication || {}
                }
              };
            }),
          gates: nodes
            .filter(node => (node.data as unknown as NodeData).type === 'gate')
            .map(node => {
              const data = node.data as unknown as NodeData;
              const gateType = data.gateType || 'condition';
              
              // Map gate types to valid schema types
              const typeMapping: Record<string, 'approval' | 'condition' | 'merge' | 'split'> = {
                'condition': 'condition',
                'approval': 'approval',
                'merge': 'merge',
                'split': 'split'
              };
              
              return {
                id: node.id,
                type: typeMapping[gateType.toLowerCase()] || 'condition',
                condition: data.condition || 'true',
                ...(gateType === 'approval' && { approvers: ['admin'] }),
                ...(gateType === 'merge' && { mergeStrategy: 'all' as const })
              };
            }),
          edges: edges.map((edge, index) => ({
            id: edge.id || `edge-${index}`,
            source: edge.source,
            target: edge.target,
            condition: edge.label as string || undefined,
          })),
          startNode: startNodes.length > 0 ? startNodes[0].id : nodes[0]?.id || '',
          outputs: outputNodes.length > 0 ? outputNodes.map(n => n.id) : [nodes[nodes.length - 1]?.id || ''],
        },
        metadata: {
          createdAt: isBuiltInBlueprint ? new Date().toISOString() : (existingBlueprint?.template?.metadata?.createdAt || new Date().toISOString()),
          updatedAt: new Date().toISOString(),
          author: 'Visual Designer',
          tags: blueprintInfo.tags,
        },
      }
    };

    onSave(blueprint);
  }, [nodes, edges, blueprintInfo, onSave, existingBlueprint]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {existingBlueprint ? '✏️ Edit Blueprint' : '🎨 Visual Blueprint Creator'}
            </h2>
            <input
              type="text"
              placeholder="Blueprint Name *"
              className="px-3 py-2 border rounded-md w-64"
              value={blueprintInfo.name}
              onChange={(e) => setBlueprintInfo(prev => ({ ...prev, name: e.target.value }))}
            />
            <select
              className="px-3 py-2 border rounded-md"
              value={blueprintInfo.category}
              onChange={(e) => setBlueprintInfo(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Category</option>
              <option value="Automation">Automation</option>
              <option value="Support">Support</option>
              <option value="Finance">Finance</option>
              <option value="Data">Data</option>
              <option value="Custom">Custom</option>
            </select>
            {existingBlueprint && (
              <div className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
                Editing: {existingBlueprint.name}
              </div>
            )}
          </div>
          <div className="flex space-x-2 items-center">
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={`px-4 py-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 flex items-center space-x-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isExporting}
              >
                <span>📸</span>
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                <span className="text-xs">▼</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[140px]">
                  <button 
                    onClick={() => exportToImage('png')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                    disabled={isExporting}
                  >
                    <span>🖼️</span>
                    <span>PNG Image</span>
                  </button>
                  <button 
                    onClick={() => exportToImage('jpg')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                    disabled={isExporting}
                  >
                    <span>📸</span>
                    <span>JPEG Image</span>
                  </button>
                  <button 
                    onClick={() => exportToImage('svg')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                    disabled={isExporting}
                  >
                    <span>🎨</span>
                    <span>SVG Vector</span>
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={onCancel} 
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              onClick={saveBlueprint} 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={!blueprintInfo.name.trim()}
            >
              💾 {existingBlueprint ? 'Update Blueprint' : 'Save Blueprint'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r shadow-sm overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4 text-gray-900">🧰 Component Palette</h3>
            
            {/* Agents Section */}
            <div className="mb-6">
              <h4 
                className="text-sm font-medium text-blue-700 mb-2 flex items-center cursor-pointer"
                onClick={() => toggleSection('agents')}
              >
                🤖 Agents
                <span className="ml-auto">{sectionsExpanded.agents ? '▲' : '▼'}</span>
              </h4>
              {sectionsExpanded.agents && (
                <div className="grid grid-cols-1 gap-2">
                  {['Processor', 'Analyzer', 'Responder', 'Classifier', 'Router'].map((type) => (
                    <button
                      key={type}
                      onClick={() => addAgentNode(type)}
                      className="text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border-l-4 border-blue-400 transition-colors"
                    >
                      <span className="font-medium">{type}</span>
                      <div className="text-xs text-blue-600 mt-1">Drag to add agent</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tools Section */}
            <div className="mb-6">
              <h4 
                className="text-sm font-medium text-green-700 mb-2 flex items-center cursor-pointer"
                onClick={() => toggleSection('tools')}
              >
                🛠️ Tools
                <span className="ml-auto">{sectionsExpanded.tools ? '▲' : '▼'}</span>
              </h4>
              {sectionsExpanded.tools && (
                <div className="grid grid-cols-1 gap-2">
                  {['REST API', 'Database', 'Email', 'Graph API', 'ServiceNow', 'File System'].map((type) => (
                    <button
                      key={type}
                      onClick={() => addToolNode(type)}
                      className="text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded border-l-4 border-green-400 transition-colors"
                    >
                      <span className="font-medium">{type}</span>
                      <div className="text-xs text-green-600 mt-1">External integration</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gates Section */}
            <div className="mb-6">
              <h4 
                className="text-sm font-medium text-purple-700 mb-2 flex items-center cursor-pointer"
                onClick={() => toggleSection('gates')}
              >
                🚪 Gates
                <span className="ml-auto">{sectionsExpanded.gates ? '▲' : '▼'}</span>
              </h4>
              {sectionsExpanded.gates && (
                <div className="grid grid-cols-1 gap-2">
                  {['Condition', 'Approval', 'Merge', 'Split'].map((type) => (
                    <button
                      key={type}
                      onClick={() => addGateNode(type)}
                      className="text-left px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 rounded border-l-4 border-purple-400 transition-colors"
                    >
                      <span className="font-medium">{type}</span>
                      <div className="text-xs text-purple-600 mt-1">Control flow</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">💡 Quick Tips</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Click components above to add them</li>
                <li>• Drag from connection points to link nodes</li>
                <li>• Click nodes to edit properties</li>
                <li>• Mark start/end agents in properties</li>
                <li>• Use gates for conditional logic</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
          >
            <Background color="#f1f5f9" gap={16} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                const data = node.data as unknown as NodeData;
                if (data.type === 'agent') return '#3b82f6';
                if (data.type === 'tool') return '#10b981';
                return '#8b5cf6';
              }}
              className="!bg-white !border-gray-300"
            />
            
            {/* Help Panel */}
            <Panel position="top-right">
              <div className="bg-white p-3 rounded-lg shadow-lg border text-sm max-w-xs">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">📊</span>
                  <span className="font-medium">Workflow Stats</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Agents: {nodes.filter(n => (n.data as unknown as NodeData).type === 'agent').length}</div>
                  <div>Tools: {nodes.filter(n => (n.data as unknown as NodeData).type === 'tool').length}</div>
                  <div>Gates: {nodes.filter(n => (n.data as unknown as NodeData).type === 'gate').length}</div>
                  <div>Connections: {edges.length}</div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
          
          {/* Click outside to close export menu */}
          {showExportMenu && (
            <div 
              className="fixed inset-0 z-5" 
              onClick={() => setShowExportMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={onUpdateNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};