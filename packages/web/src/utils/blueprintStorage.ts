import type { Blueprint } from '@agentfactory/types';

const STORAGE_KEY = 'agentfactory_blueprints';
const INITIALIZED_KEY = 'agentfactory_initialized';
const BLUEPRINTS_VERSION = 'v4'; // Updated version to keep only original 3 examples

// Built-in sample blueprints - original 3 examples only
const BUILT_IN_BLUEPRINTS: Blueprint[] = [
  {
    id: 'multi-agent',
    name: 'Multi-Agent Collaboration',
    description: 'Multiple agents working together to solve complex tasks',
    category: 'Collaboration',
    tags: ['multi-agent', 'collaboration'],
    template: {
      id: 'multi-agent-template',
      name: 'Multi-Agent Collaboration',
      version: '1.0.0',
      description: 'Multiple agents working together to solve complex tasks',
      orchestration: {
        id: 'multi-agent-orch',
        name: 'Multi-Agent Orchestration',
        agents: [
          {
            id: 'coordinator',
            name: 'Coordinator Agent',
            prompt: 'You coordinate tasks between multiple agents.',
            tools: [],
            memory: { type: 'ephemeral' as const, maxTokens: 4000 },
            policies: { maxIterations: 10, timeout: 30000, retryPolicy: 'exponential' as const }
          },
          {
            id: 'processor',
            name: 'Processor Agent',
            prompt: 'You process data and perform computations.',
            tools: [],
            memory: { type: 'ephemeral' as const, maxTokens: 4000 },
            policies: { maxIterations: 10, timeout: 30000, retryPolicy: 'exponential' as const }
          }
        ],
        tools: [],
        gates: [],
        edges: [
          { id: 'edge-1', source: 'coordinator', target: 'processor' }
        ],
        startNode: 'coordinator',
        outputs: ['processor']
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'System',
        tags: ['multi-agent', 'collaboration'],
        nodePositions: {
          coordinator: { x: 100, y: 100 },
          processor: { x: 400, y: 100 }
        }
      }
    }
  },
  {
    id: 'approval-chain',
    name: 'Approval Chain',
    description: 'Sequential approval workflow with gates',
    category: 'Automation',
    tags: ['approval', 'workflow'],
    template: {
      id: 'approval-chain-template',
      name: 'Approval Chain',
      version: '1.0.0',
      description: 'Sequential approval workflow with gates',
      orchestration: {
        id: 'approval-chain-orch',
        name: 'Approval Chain Orchestration',
        agents: [
          {
            id: 'submitter',
            name: 'Request Submitter',
            prompt: 'You submit requests for approval.',
            tools: [],
            memory: { type: 'ephemeral' as const, maxTokens: 4000 },
            policies: { maxIterations: 10, timeout: 30000, retryPolicy: 'exponential' as const }
          },
          {
            id: 'finalizer',
            name: 'Finalizer Agent',
            prompt: 'You finalize approved requests.',
            tools: [],
            memory: { type: 'ephemeral' as const, maxTokens: 4000 },
            policies: { maxIterations: 10, timeout: 30000, retryPolicy: 'exponential' as const }
          }
        ],
        tools: [],
        gates: [
          {
            id: 'approval-gate',
            type: 'approval' as const,
            condition: 'approved',
            approvers: ['manager', 'admin']
          }
        ],
        edges: [
          { id: 'edge-1', source: 'submitter', target: 'approval-gate' },
          { id: 'edge-2', source: 'approval-gate', target: 'finalizer' }
        ],
        startNode: 'submitter',
        outputs: ['finalizer']
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'System',
        tags: ['approval', 'workflow'],
        nodePositions: {
          submitter: { x: 100, y: 100 },
          'approval-gate': { x: 300, y: 100 },
          finalizer: { x: 500, y: 100 }
        }
      }
    }
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'ETL pipeline with multiple processing stages',
    category: 'Data',
    tags: ['data', 'pipeline', 'etl'],
    template: {
      id: 'data-pipeline-template',
      name: 'Data Pipeline',
      version: '1.0.0',
      description: 'ETL pipeline with multiple processing stages',
      orchestration: {
        id: 'data-pipeline-orch',
        name: 'Data Pipeline Orchestration',
        agents: [
          {
            id: 'extractor',
            name: 'Data Extractor',
            prompt: 'You extract data from various sources.',
            tools: [],
            memory: { type: 'ephemeral' as const, maxTokens: 4000 },
            policies: { maxIterations: 10, timeout: 30000, retryPolicy: 'exponential' as const }
          },
          {
            id: 'transformer',
            name: 'Data Transformer',
            prompt: 'You transform and clean data.',
            tools: [],
            memory: { type: 'ephemeral' as const, maxTokens: 4000 },
            policies: { maxIterations: 10, timeout: 30000, retryPolicy: 'exponential' as const }
          },
          {
            id: 'loader',
            name: 'Data Loader',
            prompt: 'You load data into the destination.',
            tools: [],
            memory: { type: 'ephemeral' as const, maxTokens: 4000 },
            policies: { maxIterations: 10, timeout: 30000, retryPolicy: 'exponential' as const }
          }
        ],
        tools: [],
        gates: [],
        edges: [
          { id: 'edge-1', source: 'extractor', target: 'transformer' },
          { id: 'edge-2', source: 'transformer', target: 'loader' }
        ],
        startNode: 'extractor',
        outputs: ['loader']
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'System',
        tags: ['data', 'pipeline', 'etl'],
        nodePositions: {
          extractor: { x: 100, y: 100 },
          transformer: { x: 350, y: 100 },
          loader: { x: 600, y: 100 }
        }
      }
    }
  }
];

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize storage with built-in blueprints if first time or version changed
function initializeStorage(): void {
  if (typeof window === 'undefined') return;
  
  const currentVersion = localStorage.getItem(INITIALIZED_KEY);
  
  // Re-initialize if not initialized or version is different
  if (currentVersion !== BLUEPRINTS_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(BUILT_IN_BLUEPRINTS));
    localStorage.setItem(INITIALIZED_KEY, BLUEPRINTS_VERSION);
    console.log('✅ Initialized localStorage with built-in blueprints (version: ' + BLUEPRINTS_VERSION + ')');
  }
}

// Get all blueprints from localStorage
export function getAllBlueprints(): Blueprint[] {
  if (typeof window === 'undefined') return [];
  
  initializeStorage();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const blueprints = JSON.parse(stored) as Blueprint[];
    return blueprints;
  } catch (error) {
    console.error('Failed to load blueprints from localStorage:', error);
    return [];
  }
}

// Get a single blueprint by ID
export function getBlueprintById(id: string): Blueprint | null {
  const blueprints = getAllBlueprints();
  return blueprints.find(bp => bp.id === id) || null;
}

// Save a new blueprint to localStorage
export function saveBlueprint(blueprint: Omit<Blueprint, 'id'> | Blueprint): Blueprint {
  const blueprints = getAllBlueprints();
  
  // Generate ID if not provided
  const newBlueprint: Blueprint = 'id' in blueprint && blueprint.id
    ? blueprint as Blueprint
    : { ...blueprint, id: generateId() };
  
  // Check if blueprint with this ID already exists
  const existingIndex = blueprints.findIndex(bp => bp.id === newBlueprint.id);
  
  if (existingIndex >= 0) {
    // Update existing blueprint
    blueprints[existingIndex] = newBlueprint;
  } else {
    // Add new blueprint
    blueprints.push(newBlueprint);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
  console.log(`✅ Saved blueprint: ${newBlueprint.name}`);
  
  return newBlueprint;
}

// Update an existing blueprint in localStorage
export function updateBlueprint(id: string, updates: Partial<Blueprint>): Blueprint | null {
  const blueprints = getAllBlueprints();
  const index = blueprints.findIndex(bp => bp.id === id);
  
  if (index === -1) {
    console.error(`Blueprint with id ${id} not found`);
    return null;
  }
  
  // Update the blueprint
  blueprints[index] = { ...blueprints[index], ...updates };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
  console.log(`✅ Updated blueprint: ${blueprints[index].name}`);
  
  return blueprints[index];
}

// Delete a blueprint from localStorage
export function deleteBlueprint(id: string): boolean {
  const blueprints = getAllBlueprints();
  const filteredBlueprints = blueprints.filter(bp => bp.id !== id);
  
  if (filteredBlueprints.length === blueprints.length) {
    console.error(`Blueprint with id ${id} not found`);
    return false;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredBlueprints));
  console.log(`✅ Deleted blueprint with id: ${id}`);
  
  return true;
}

// Clear all blueprints (useful for testing)
export function clearAllBlueprints(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(INITIALIZED_KEY);
  console.log('✅ Cleared all blueprints from localStorage');
}

// Export blueprints to JSON file
export function exportBlueprintsToFile(): void {
  const blueprints = getAllBlueprints();
  const dataStr = JSON.stringify(blueprints, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `blueprints-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Import blueprints from JSON file
export function importBlueprintsFromFile(file: File): Promise<Blueprint[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedBlueprints = JSON.parse(content) as Blueprint[];
        
        // Validate the imported data
        if (!Array.isArray(importedBlueprints)) {
          throw new Error('Invalid file format: expected an array of blueprints');
        }
        
        // Merge with existing blueprints
        const existingBlueprints = getAllBlueprints();
        const mergedBlueprints = [...existingBlueprints];
        
        importedBlueprints.forEach(imported => {
          const existingIndex = mergedBlueprints.findIndex(bp => bp.id === imported.id);
          if (existingIndex >= 0) {
            // Replace existing
            mergedBlueprints[existingIndex] = imported;
          } else {
            // Add new
            mergedBlueprints.push(imported);
          }
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedBlueprints));
        console.log(`✅ Imported ${importedBlueprints.length} blueprints`);
        
        resolve(importedBlueprints);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
