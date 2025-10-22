import type { Blueprint as Project } from '@agentfactory/types';

const STORAGE_KEY = 'agentfactory_projects';
const INITIALIZED_KEY = 'agentfactory_initialized';
const PROJECTS_VERSION = 'v4'; // Updated version to keep only original 3 examples

// Built-in sample projects - original 3 examples only
const BUILT_IN_PROJECTS: Project[] = [
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

// Initialize storage with built-in projects if first time or version changed
function initializeStorage(): void {
  if (typeof window === 'undefined') return;
  
  const currentVersion = localStorage.getItem(INITIALIZED_KEY);
  
  // Re-initialize if not initialized or version is different
  if (currentVersion !== PROJECTS_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(BUILT_IN_PROJECTS));
    localStorage.setItem(INITIALIZED_KEY, PROJECTS_VERSION);
    console.log('✅ Initialized localStorage with built-in projects (version: ' + PROJECTS_VERSION + ')');
  }
}

// Get all projects from localStorage
export function getAllBlueprints(): Project[] {
  if (typeof window === 'undefined') return [];
  
  initializeStorage();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const projects = JSON.parse(stored) as Project[];
    return projects;
  } catch (error) {
    console.error('Failed to load projects from localStorage:', error);
    return [];
  }
}

// Get a single project by ID
export function getBlueprintById(id: string): Project | null {
  const projects = getAllBlueprints();
  return projects.find(bp => bp.id === id) || null;
}

// Save a new project to localStorage
export function saveBlueprint(project: Omit<Project, 'id'> | Project): Project {
  const projects = getAllBlueprints();
  
  // Generate ID if not provided
  const newProject: Project = 'id' in project && project.id
    ? project as Project
    : { ...project, id: generateId() };
  
  // Check if project with this ID already exists
  const existingIndex = projects.findIndex(bp => bp.id === newProject.id);
  
  if (existingIndex >= 0) {
    // Update existing project
    projects[existingIndex] = newProject;
  } else {
    // Add new project
    projects.push(newProject);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  console.log(`✅ Saved project: ${newProject.name}`);
  
  return newProject;
}

// Update an existing project in localStorage
export function updateBlueprint(id: string, updates: Partial<Project>): Project | null {
  const projects = getAllBlueprints();
  const index = projects.findIndex(bp => bp.id === id);
  
  if (index === -1) {
    console.error(`Project with id ${id} not found`);
    return null;
  }
  
  // Update the project
  projects[index] = { ...projects[index], ...updates };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  console.log(`✅ Updated project: ${projects[index].name}`);
  
  return projects[index];
}

// Delete a project from localStorage
export function deleteBlueprint(id: string): boolean {
  const projects = getAllBlueprints();
  const filteredProjects = projects.filter(bp => bp.id !== id);
  
  if (filteredProjects.length === projects.length) {
    console.error(`Project with id ${id} not found`);
    return false;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredProjects));
  console.log(`✅ Deleted project with id: ${id}`);
  
  return true;
}

// Clear all projects (useful for testing)
export function clearAllBlueprints(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(INITIALIZED_KEY);
  console.log('✅ Cleared all projects from localStorage');
}

// Export projects to JSON file
export function exportBlueprintsToFile(): void {
  const projects = getAllBlueprints();
  const dataStr = JSON.stringify(projects, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `projects-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Import projects from JSON file
export function importBlueprintsFromFile(file: File): Promise<Project[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedProjects = JSON.parse(content) as Project[];
        
        // Validate the imported data
        if (!Array.isArray(importedProjects)) {
          throw new Error('Invalid file format: expected an array of projects');
        }
        
        // Merge with existing projects
        const existingProjects = getAllBlueprints();
        const mergedProjects = [...existingProjects];
        
        importedProjects.forEach(imported => {
          const existingIndex = mergedProjects.findIndex(bp => bp.id === imported.id);
          if (existingIndex >= 0) {
            // Replace existing
            mergedProjects[existingIndex] = imported;
          } else {
            // Add new
            mergedProjects.push(imported);
          }
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedProjects));
        console.log(`✅ Imported ${importedProjects.length} projects`);
        
        resolve(importedProjects);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
