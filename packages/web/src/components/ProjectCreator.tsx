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
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { domToPng, domToJpeg } from 'modern-screenshot';
import { AgentNode, ToolNode, GateNode, NodeData } from './VisualNodes';
import { PropertiesPanel } from './PropertiesPanel';
import type { Blueprint } from '@agentfactory/types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { saveCanvasToCache, getCanvasFromCache, clearCanvasCache } from '../utils/canvasCache';

interface BlueprintCreatorProps {
  onSave: (blueprint: Blueprint) => void;
  onCancel: () => void;
  existingBlueprint?: Blueprint; // Add support for editing existing blueprints
  loadedExample?: Blueprint; // Add support for loading examples without edit mode
  onViewBlueprints?: () => void; // Add new prop for viewing blueprints
}

const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
  toolNode: ToolNode,
  gateNode: GateNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Main component wrapped in provider
export const BlueprintCreator: React.FC<BlueprintCreatorProps> = ({ onSave, onCancel, existingBlueprint, loadedExample, onViewBlueprints }) => {
  return (
    <ReactFlowProvider>
      <BlueprintCreatorInner onSave={onSave} onCancel={onCancel} existingBlueprint={existingBlueprint} loadedExample={loadedExample} onViewBlueprints={onViewBlueprints} />
    </ReactFlowProvider>
  );
};

const BlueprintCreatorInner: React.FC<BlueprintCreatorProps> = ({ onSave, onCancel, existingBlueprint, loadedExample, onViewBlueprints }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: NodeData } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ id: string; source: string; target: string; label?: string; data?: { name?: string; description?: string } } | null>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getViewport, getNodes, fitView } = useReactFlow();
  const router = useRouter();

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
    setSelectedEdge(null); // Clear edge selection when clicking a node
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    console.log('Edge clicked:', edge); // Debug log
    setSelectedEdge({ 
      id: edge.id, 
      source: edge.source, 
      target: edge.target, 
      label: edge.label as string,
      data: edge.data as { name?: string; description?: string }
    });
    setSelectedNode(null); // Clear node selection when clicking an edge
  }, []);

  // Handler for clicking on the canvas background - closes the properties panel
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const onUpdateEdge = useCallback((edgeId: string, newData: { label?: string; data?: { name?: string; description?: string } }) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, label: newData.label, data: newData.data } : edge
      )
    );
  }, [setEdges]);

  const onDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, [setEdges]);

  const onDeleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    // Also remove any edges connected to this node
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

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

  const exportToImage = useCallback(async (format: 'png' | 'jpg' = 'png') => {
    if (!reactFlowWrapper.current) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const currentNodes = getNodes();
      
      if (currentNodes.length === 0) {
        alert('No nodes to export. Please add some nodes first.');
        setIsExporting(false);
        return;
      }

      // Fit all nodes into view
      fitView({ padding: 0.2, duration: 300 });
      
      // Wait for the view to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the React Flow element
      const reactFlowElement = reactFlowWrapper.current.querySelector('.react-flow') as HTMLElement;
      
      if (!reactFlowElement) {
        throw new Error('Could not find React Flow element');
      }

      // Store original styles
      const originalBgColor = reactFlowElement.style.backgroundColor;
      const edgeElements = reactFlowElement.querySelectorAll('.react-flow__edge path');
      const originalEdgeStyles = Array.from(edgeElements).map(edge => ({
        element: edge as SVGPathElement,
        stroke: (edge as SVGPathElement).style.stroke
      }));

      // Apply export styles: white background and black edges
      reactFlowElement.style.backgroundColor = '#ffffff';
      edgeElements.forEach(edge => {
        (edge as SVGPathElement).style.stroke = '#000000';
      });

      // Wait a bit for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Starting export with modern-screenshot...');

      // Use modern-screenshot which properly handles SVG elements
      const dataUrl = format === 'jpg' 
        ? await domToJpeg(reactFlowElement, {
            quality: 0.95,
            scale: 2,
            backgroundColor: '#ffffff',
            filter: (node: Element) => {
              // Exclude UI controls from export
              return !node.classList?.contains('react-flow__controls') &&
                     !node.classList?.contains('react-flow__minimap') &&
                     !node.classList?.contains('react-flow__panel') &&
                     !node.classList?.contains('react-flow__attribution');
            }
          })
        : await domToPng(reactFlowElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            filter: (node: Element) => {
              // Exclude UI controls from export
              return !node.classList?.contains('react-flow__controls') &&
                     !node.classList?.contains('react-flow__minimap') &&
                     !node.classList?.contains('react-flow__panel') &&
                     !node.classList?.contains('react-flow__attribution');
            }
          });

      // Restore original styles
      reactFlowElement.style.backgroundColor = originalBgColor;
      originalEdgeStyles.forEach(({ element, stroke }) => {
        element.style.stroke = stroke;
      });

      // Download the image
      const filename = `${blueprintInfo.name || 'blueprint'}-${Date.now()}.${format}`;
      downloadImage(dataUrl, filename);

      console.log(`✅ Successfully exported blueprint as ${format.toUpperCase()}`);
      
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Failed to export image: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [blueprintInfo.name, getNodes, fitView]);

  // Export diagram to JSON file
  const exportToJSON = useCallback(() => {
    if (nodes.length === 0) {
      alert('No diagram to export. Please add some nodes first.');
      return;
    }

    const diagramData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      blueprintInfo,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        data: edge.data
      }))
    };

    const blob = new Blob([JSON.stringify(diagramData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprintInfo.name || 'diagram'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportMenu(false);
    console.log('✅ Successfully exported diagram as JSON');
  }, [nodes, edges, blueprintInfo]);

  // Import diagram from JSON file
  const importFromJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const diagramData = JSON.parse(content);

        // Validate the imported data
        if (!diagramData.nodes || !diagramData.edges) {
          throw new Error('Invalid diagram file format');
        }

        // Restore blueprint info if available
        if (diagramData.blueprintInfo) {
          setBlueprintInfo(diagramData.blueprintInfo);
        }

        // Restore nodes and edges
        setNodes(diagramData.nodes);
        setEdges(diagramData.edges);

        console.log('✅ Successfully imported diagram from JSON');
        alert('Diagram imported successfully!');
      } catch (error: any) {
        console.error('Import error:', error);
        alert(`Failed to import diagram: ${error.message}`);
      }
    };

    reader.readAsText(file);
    
    // Reset the input so the same file can be imported again if needed
    event.target.value = '';
  }, [setNodes, setEdges]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
    setShowExportMenu(false);
  }, []);

  // Clear the canvas
  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0 && edges.length === 0) {
      alert('Canvas is already empty.');
      return;
    }

    if (!confirm('Are you sure you want to clear the entire canvas? This will remove all nodes and connections.')) {
      return;
    }

    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    
    console.log('✅ Canvas cleared');
  }, [nodes.length, edges.length, setNodes, setEdges]);

  // Load existing blueprint data into the editor
  useEffect(() => {
    // Use loadedExample if available (for examples), otherwise use existingBlueprint (for editing)
    const blueprintToLoad = loadedExample || existingBlueprint;
    const blueprintData = blueprintToLoad?.template || (blueprintToLoad as any)?.spec;
    
    if (blueprintData?.orchestration) {
      const orchestration = blueprintData.orchestration;
      
      // Get saved node positions from metadata (if they exist)
      const savedPositions = blueprintData.metadata?.nodePositions as Record<string, { x: number; y: number }> | undefined;
      
      // Convert agents to nodes
      const agentNodes: Node[] = orchestration.agents.map((agent, index) => ({
        id: agent.id,
        type: 'agentNode',
        // Use saved position if available, otherwise use calculated grid position
        position: savedPositions?.[agent.id] || { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
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
        // Use saved position if available, otherwise use calculated grid position
        position: savedPositions?.[tool.id] || { x: 500 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
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
        // Use saved position if available, otherwise use calculated grid position
        position: savedPositions?.[gate.id] || { x: 200 + (index % 3) * 300, y: 300 + Math.floor(index / 3) * 200 },
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
        type: 'default',
        // Restore sourceHandle and targetHandle if they exist in metadata
        sourceHandle: (edge as any).sourceHandle,
        targetHandle: (edge as any).targetHandle,
      }));

      // Set all nodes and edges
      setNodes([...agentNodes, ...toolNodes, ...gateNodes]);
      setEdges(flowEdges);
    }
  }, [existingBlueprint, loadedExample, setNodes, setEdges]);

  // Restore canvas from cache when returning from report page
  useEffect(() => {
    // Only try to restore from cache if we're not editing an existing blueprint
    if (!existingBlueprint) {
      const cached = getCanvasFromCache();
      if (cached) {
        console.log('🔄 Restoring canvas from cache...');
        setNodes(cached.nodes);
        setEdges(cached.edges);
        setBlueprintInfo(cached.blueprintInfo);
        
        // Clear the cache after restoration so it doesn't persist unnecessarily
        // Uncomment the line below if you want to clear cache after restoration
        // clearCanvasCache();
      }
    }
  }, []); // Run only once on mount

  const saveBlueprint = useCallback(() => {
    if (!blueprintInfo.name.trim()) {
      alert('Please enter a blueprint name');
      return;
    }

    const startNodes = nodes.filter(node => (node.data as unknown as NodeData).isStart);
    const outputNodes = nodes.filter(node => (node.data as unknown as NodeData).isOutput);

    // Check if this is a built-in blueprint being edited (should create a copy)
    const isBuiltInBlueprint = existingBlueprint && ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'].includes(existingBlueprint.id);
    
    // Store node positions in metadata for canvas restoration
    const nodePositions = nodes.reduce((acc, node) => {
      acc[node.id] = { x: node.position.x, y: node.position.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    // Generate schema-compliant ProjectSpec
    const blueprint: Blueprint = {
      id: isBuiltInBlueprint ? `custom-${Date.now()}` : (existingBlueprint?.id || `visual-${Date.now()}`),
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
            // Save sourceHandle and targetHandle to preserve connection points
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          } as any)),
          startNode: startNodes.length > 0 ? startNodes[0].id : nodes[0]?.id || '',
          outputs: outputNodes.length > 0 ? outputNodes.map(n => n.id) : [nodes[nodes.length - 1]?.id || ''],
        },
        metadata: {
          createdAt: isBuiltInBlueprint ? new Date().toISOString() : (existingBlueprint?.template?.metadata?.createdAt || new Date().toISOString()),
          updatedAt: new Date().toISOString(),
          author: 'Visual Designer',
          tags: blueprintInfo.tags,
          nodePositions: nodePositions, // Save canvas positions
        },
      }
    };

    onSave(blueprint);
  }, [nodes, edges, blueprintInfo, onSave, existingBlueprint]);

  // Navigate to report page with canvas data
  const handleReportClick = useCallback(async () => {
    if (nodes.length === 0) {
      return; // Button should be disabled, but extra safety check
    }

    const startNodes = nodes.filter(node => (node.data as unknown as NodeData).isStart);
    const outputNodes = nodes.filter(node => (node.data as unknown as NodeData).isOutput);

    // Store node positions in metadata for canvas restoration
    const nodePositions = nodes.reduce((acc, node) => {
      acc[node.id] = { x: node.position.x, y: node.position.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    // Generate diagram image to include in the report
    let diagramImage: string | null = null;
    try {
      if (reactFlowWrapper.current) {
        console.log('📸 Capturing diagram for report...');
        
        // Fit all nodes into view
        fitView({ padding: 0.2, duration: 300 });
        
        // Wait for the view to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the React Flow element
        const reactFlowElement = reactFlowWrapper.current.querySelector('.react-flow') as HTMLElement;
        
        if (reactFlowElement) {
          // Store original styles
          const originalBgColor = reactFlowElement.style.backgroundColor;
          const edgeElements = reactFlowElement.querySelectorAll('.react-flow__edge path');
          const originalEdgeStyles = Array.from(edgeElements).map(edge => ({
            element: edge as SVGPathElement,
            stroke: (edge as SVGPathElement).style.stroke
          }));

          // Apply export styles: white background and black edges
          reactFlowElement.style.backgroundColor = '#ffffff';
          edgeElements.forEach(edge => {
            (edge as SVGPathElement).style.stroke = '#000000';
          });

          // Wait a bit for styles to apply
          await new Promise(resolve => setTimeout(resolve, 100));

          // Use modern-screenshot to capture the diagram
          diagramImage = await domToPng(reactFlowElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            filter: (node: Element) => {
              // Exclude UI controls from export
              return !node.classList?.contains('react-flow__controls') &&
                     !node.classList?.contains('react-flow__minimap') &&
                     !node.classList?.contains('react-flow__panel') &&
                     !node.classList?.contains('react-flow__attribution');
            }
          });

          // Restore original styles
          reactFlowElement.style.backgroundColor = originalBgColor;
          originalEdgeStyles.forEach(({ element, stroke }) => {
            element.style.stroke = stroke;
          });

          console.log('✅ Diagram captured successfully');
        }
      }
    } catch (error) {
      console.error('Failed to capture diagram:', error);
      // Continue even if diagram capture fails
    }

    // Create a proper Blueprint structure that will pass validation
    const blueprint: Blueprint = {
      id: `report-${Date.now()}`,
      name: blueprintInfo.name || 'Untitled Blueprint',
      description: blueprintInfo.description || 'Blueprint generated from canvas',
      category: blueprintInfo.category || 'custom',
      tags: blueprintInfo.tags || [],
      template: {
        id: (blueprintInfo.name || 'untitled').toLowerCase().replace(/\s+/g, '-'),
        name: blueprintInfo.name || 'Untitled Blueprint',
        version: '1.0.0',
        description: blueprintInfo.description || 'Blueprint generated from canvas',
        orchestration: {
          id: `orchestration-${Date.now()}`,
          name: `${blueprintInfo.name || 'Untitled'} Orchestration`,
          agents: nodes
            .filter(node => (node.data as unknown as NodeData).type === 'agent')
            .map(node => {
              const data = node.data as unknown as NodeData;
              return {
                id: node.id,
                name: data.name,
                prompt: data.prompt || 'You are a helpful agent.',
                tools: data.tools || [],
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
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          } as any)),
          startNode: startNodes.length > 0 ? startNodes[0].id : nodes[0]?.id || '',
          outputs: outputNodes.length > 0 ? outputNodes.map(n => n.id) : [nodes[nodes.length - 1]?.id || ''],
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'Visual Designer',
          tags: blueprintInfo.tags || [],
          nodePositions: nodePositions,
        },
      }
    };

    // Save canvas state to cache (including diagram image)
    saveCanvasToCache(nodes, edges, blueprintInfo);
    
    // Cache the diagram image separately
    if (diagramImage) {
      const { cacheDiagramImage } = await import('../utils/reportIntegration');
      cacheDiagramImage(diagramImage);
    }

    // Convert to JSON string and encode for URL using base64
    const jsonString = JSON.stringify(blueprint);
    const base64Data = btoa(jsonString);
    const encoded = encodeURIComponent(base64Data);
    
    // Navigate to report page with data
    router.push(`/report?data=${encoded}`);
  }, [nodes, edges, blueprintInfo, router, fitView]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {existingBlueprint ? '✏️ Edit Blueprint' : 'Agent Visualiser'}
            </h2>
            {onViewBlueprints && (
              <button
                onClick={onViewBlueprints}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors font-medium"
              >
                📁 Examples
              </button>
            )}
            <button
              onClick={handleReportClick}
              disabled={nodes.length === 0}
              className={`px-4 py-2 rounded transition-colors font-medium ${
                nodes.length === 0
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
              }`}
              title={nodes.length === 0 ? 'Add nodes to the canvas first' : 'Generate report from canvas'}
            >
              📊 Report Generator
            </button>
          </div>
          <div className="flex space-x-2 items-center">
            <button 
              onClick={handleImportClick}
              className="px-4 py-2 text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors flex items-center space-x-2"
            >
              <span>📂</span>
              <span>Import JSON</span>
            </button>
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
                    <span>PNG</span>
                  </button>
                  <button 
                    onClick={() => exportToImage('jpg')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                    disabled={isExporting}
                  >
                    <span>🖼️</span>
                    <span>JPG</span>
                  </button>
                  <button 
                    onClick={exportToJSON}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <span>📄</span>
                    <span>JSON</span>
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={handleClearCanvas}
              className="px-4 py-2 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
            >
              Clear Canvas
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r shadow-sm overflow-y-auto">
          <div className="p-4">
            
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
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
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
      {(selectedNode || selectedEdge) && (
        <PropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={nodes}
          onUpdateNode={onUpdateNode}
          onUpdateEdge={onUpdateEdge}
          onDeleteNode={onDeleteNode}
          onDeleteEdge={onDeleteEdge}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
        />
      )}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={importFromJSON}
      />
    </div>
  );
};