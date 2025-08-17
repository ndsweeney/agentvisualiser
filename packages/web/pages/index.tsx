import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Blueprint } from '@agentfactory/types';
import dynamic from 'next/dynamic';

// Dynamically import the BlueprintCreator to avoid SSR issues
const BlueprintCreator = dynamic(() => import('../src/components/BlueprintCreator').then(mod => ({ default: mod.BlueprintCreator })), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Visual Blueprint Creator...</p>
      </div>
    </div>
  )
});

interface CompileResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface DeployResponse {
  success: boolean;
  deploymentId?: string;
  message?: string;
  error?: string;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<Blueprint | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [compiledProjects, setCompiledProjects] = useState<any[]>([]);
  const [compileQueue, setCompileQueue] = useState<Blueprint[]>([]);

  useEffect(() => {
    fetchBlueprints();
    fetchDeployments();
    fetchCompiledProjects();
  }, []);

  const fetchBlueprints = async () => {
    try {
      const response = await fetch('/api/blueprints');
      if (response.ok) {
        const data = await response.json();
        setBlueprints(data);
      }
    } catch (error) {
      console.error('Failed to fetch blueprints:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployments = async () => {
    try {
      const response = await fetch('/api/deploy');
      if (response.ok) {
        const data = await response.json();
        setDeployments(data);
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  };

  const fetchCompiledProjects = async () => {
    try {
      const response = await fetch('/api/compiled');
      if (response.ok) {
        const data = await response.json();
        setCompiledProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch compiled projects:', error);
    }
  };

  const handleBlueprintSaved = async (blueprint: Blueprint) => {
    try {
      const isBuiltInBlueprint = editingBlueprint && ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'].includes(editingBlueprint.id);
      
      if (editingBlueprint && !isBuiltInBlueprint) {
        // Update existing custom blueprint
        const response = await fetch(`/api/blueprints/${blueprint.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(blueprint),
        });

        if (!response.ok) {
          throw new Error('Failed to update blueprint');
        }
        
        console.log('Blueprint updated successfully');
      } else {
        // Create new blueprint (either new or copy of built-in)
        const { id, ...blueprintData } = blueprint;
        const response = await fetch('/api/blueprints', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(blueprintData),
        });

        if (!response.ok) {
          throw new Error('Failed to create blueprint');
        }
        
        console.log(`Blueprint ${isBuiltInBlueprint ? 'copied and created' : 'created'} successfully`);
      }
      
      await fetchBlueprints();
    } catch (error) {
      console.error('Error saving blueprint:', error);
      alert(`Failed to ${editingBlueprint && !['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'].includes(editingBlueprint.id) ? 'update' : 'create'} blueprint`);
      return;
    }

    setShowCreator(false);
    setEditingBlueprint(null);
    setSelectedSection(null);
  };

  const handleEditBlueprint = (blueprint: Blueprint) => {
    setEditingBlueprint(blueprint);
    setShowCreator(true);
  };

  const handleCreateNew = () => {
    setEditingBlueprint(null);
    setShowCreator(true);
  };

  const handleDeleteBlueprint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blueprint?')) return;
    
    try {
      const response = await fetch(`/api/blueprints/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setBlueprints(blueprints.filter(bp => bp.id !== id));
        alert('Blueprint deleted successfully!');
      } else {
        alert('Failed to delete blueprint');
      }
    } catch (error) {
      console.error('Error deleting blueprint:', error);
      alert('Failed to delete blueprint');
    }
  };

  const handleCompile = async (blueprint: Blueprint) => {
    try {
      const spec = (blueprint as any).spec || blueprint.template;
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spec }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Blueprint "${blueprint.name}" compiled successfully!`);
        // Refresh compiled projects list
        await fetchCompiledProjects();
      } else {
        alert(`Compilation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Compilation error:', error);
      alert('Failed to compile blueprint');
    }
  };

  const handleDeploy = async (blueprint: Blueprint) => {
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blueprint),
      });
      
      const result: DeployResponse = await response.json();
      
      if (result.success) {
        alert(`Blueprint deployed successfully! Deployment ID: ${result.deploymentId}`);
      } else {
        alert(`Deployment failed: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Failed to deploy blueprint');
    }
  };

  const handleAddToCompileQueue = (blueprint: Blueprint) => {
    // Check if blueprint is already in queue
    const isAlreadyInQueue = compileQueue.some(bp => bp.id === blueprint.id);
    
    if (isAlreadyInQueue) {
      alert(`Blueprint "${blueprint.name}" is already in the compile queue`);
      return;
    }
    
    setCompileQueue(prev => [...prev, blueprint]);
    alert(`Blueprint "${blueprint.name}" added to compile queue`);
  };

  const handleRemoveFromCompileQueue = (blueprintId: string) => {
    setCompileQueue(prev => prev.filter(bp => bp.id !== blueprintId));
  };

  const handleCompileFromQueue = async (blueprint: Blueprint) => {
    try {
      const spec = (blueprint as any).spec || blueprint.template;
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spec }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Blueprint "${blueprint.name}" compiled successfully!`);
        // Remove from compile queue and refresh compiled projects list
        handleRemoveFromCompileQueue(blueprint.id);
        await fetchCompiledProjects();
      } else {
        alert(`Compilation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Compilation error:', error);
      alert('Failed to compile blueprint');
    }
  };

  const handleDeleteCompiledProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete compiled project "${projectName}"? This cannot be undone.`)) return;
    
    try {
      console.log(`Attempting to delete compiled project: ${projectId}`);
      
      const response = await fetch(`/api/compiled?id=${projectId}`, {
        method: 'DELETE',
      });
      
      console.log(`Delete response status: ${response.status}`);
      console.log(`Delete response ok: ${response.ok}`);
      
      if (response.ok) {
        alert(`Compiled project "${projectName}" deleted successfully!`);
        await fetchCompiledProjects();
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch (parseError) {
          console.log('Could not parse error response as JSON');
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        alert(`Failed to delete compiled project: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete compiled project. Network or other error: ${error.message}`);
    }
  };

  // Show the visual editor when creating or editing
  if (showCreator) {
    return (
      <div className="min-h-screen bg-gray-100">
        <BlueprintCreator 
          onSave={handleBlueprintSaved} 
          onCancel={() => {
            setShowCreator(false);
            setEditingBlueprint(null);
            setSelectedSection(null);
          }}
          existingBlueprint={editingBlueprint || undefined}
        />
      </div>
    );
  }

  // Show blueprints section
  if (selectedSection === 'blueprints') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => setSelectedSection(null)}
              className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Blueprints</h1>
            <p className="text-gray-600">Manage your agent blueprints and templates</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Available Blueprints</h2>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              🎨 Create New Blueprint
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading blueprints...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blueprints.map((blueprint) => {
                const getNodeCount = (bp: Blueprint) => {
                  if (bp.template?.orchestration?.agents) {
                    return bp.template.orchestration.agents.length;
                  }
                  if ((bp as any).spec?.orchestration?.agents) {
                    return (bp as any).spec.orchestration.agents.length;
                  }
                  return 0;
                };

                const getConnectionCount = (bp: Blueprint) => {
                  if (bp.template?.orchestration?.edges) {
                    return bp.template.orchestration.edges.length;
                  }
                  if ((bp as any).spec?.orchestration?.edges) {
                    return (bp as any).spec.orchestration.edges.length;
                  }
                  return 0;
                };

                const isBuiltIn = ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'].includes(blueprint.id);

                return (
                  <div key={blueprint.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{blueprint.name}</h3>
                      {isBuiltIn && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Built-in
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{blueprint.description}</p>
                    
                    {blueprint.category && (
                      <div className="mb-3">
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {blueprint.category}
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-4 text-sm text-gray-500">
                      <div>Agents: {getNodeCount(blueprint)}</div>
                      <div>Connections: {getConnectionCount(blueprint)}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleEditBlueprint(blueprint)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title={isBuiltIn ? "Edit blueprint (creates a copy)" : "Edit blueprint"}
                      >
                        ✏️ {isBuiltIn ? 'Copy & Edit' : 'Edit Blueprint'}
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCompileQueue(blueprint)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          📝 Add to Compile List
                        </button>
                        <button
                          onClick={() => handleDeploy(blueprint)}
                          className="flex-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
                        >
                          Deploy
                        </button>
                        {!isBuiltIn && (
                          <button
                            onClick={() => handleDeleteBlueprint(blueprint.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                            title="Delete blueprint"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show compile section - shows blueprints in queue waiting to be compiled
  if (selectedSection === 'compile') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => setSelectedSection(null)}
              className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Compile Queue</h1>
            <p className="text-gray-600">Manage blueprints waiting to be compiled</p>
          </div>

          {compileQueue.length > 0 ? (
            <>
              {/* Blueprints in Compile Queue */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Blueprints Ready to Compile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {compileQueue.map((blueprint) => {
                    const getNodeCount = (bp: Blueprint) => {
                      if (bp.template?.orchestration?.agents) {
                        return bp.template.orchestration.agents.length;
                      }
                      if ((bp as any).spec?.orchestration?.agents) {
                        return (bp as any).spec.orchestration.agents.length;
                      }
                      return 0;
                    };

                    const getConnectionCount = (bp: Blueprint) => {
                      if (bp.template?.orchestration?.edges) {
                        return bp.template.orchestration.edges.length;
                      }
                      if ((bp as any).spec?.orchestration?.edges) {
                        return (bp as any).spec.orchestration.edges.length;
                      }
                      return 0;
                    };

                    return (
                      <div key={blueprint.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{blueprint.name}</h3>
                        <p className="text-gray-600 mb-4">{blueprint.description}</p>
                        
                        <div className="mb-4 text-sm text-gray-500">
                          <div>Agents: {getNodeCount(blueprint)}</div>
                          <div>Connections: {getConnectionCount(blueprint)}</div>
                          <div>Category: {blueprint.category || 'General'}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <button
                            onClick={() => handleCompileFromQueue(blueprint)}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            ⚙️ Compile Blueprint
                          </button>
                          
                          <button
                            onClick={() => {
                              handleRemoveFromCompileQueue(blueprint.id);
                              alert(`Blueprint "${blueprint.name}" removed from compile queue`);
                            }}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            🗑️ Remove from Queue
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compiled Projects Section */}
              {compiledProjects.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recently Compiled Projects</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {compiledProjects.map((project) => (
                      <div key={project.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{project.blueprintName}</h3>
                        <p className="text-gray-600 mb-4">
                          ✅ Compiled and ready for deployment
                        </p>
                        
                        <div className="mb-4 text-sm text-gray-500">
                          <div>Agents: {project.compiled.agents.length}</div>
                          <div>Start Agent: {project.compiled.startAgent}</div>
                          <div>Compiled: {new Date(project.compiledAt).toLocaleString()}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <button
                            onClick={() => setSelectedSection('deploy')}
                            className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                          >
                            🚀 Go to Deploy
                          </button>
                          <button
                            onClick={() => handleDeleteCompiledProject(project.id, project.blueprintName)}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            🗑️ Delete Compiled Project
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Blueprints in Compile Queue</h3>
              <p className="text-gray-600 mb-4">
                Add blueprints to your compile queue from the Blueprints section.
              </p>
              <button
                onClick={() => setSelectedSection('blueprints')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Blueprints
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show deploy section - shows compiled projects ready for deployment
  if (selectedSection === 'deploy') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => setSelectedSection(null)}
              className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Deploy</h1>
            <p className="text-gray-600">Deploy compiled projects to production environments</p>
          </div>

          {compiledProjects.length > 0 ? (
            <>
              {/* Compiled Projects Ready for Deployment */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ready to Deploy</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {compiledProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{project.blueprintName}</h3>
                      <p className="text-gray-600 mb-4">
                        Compiled project ready for deployment
                      </p>
                      
                      <div className="mb-4 text-sm text-gray-500">
                        <div>Agents: {project.compiled.agents.length}</div>
                        <div>Start Agent: {project.compiled.startAgent}</div>
                        <div>Compiled: {new Date(project.compiledAt).toLocaleString()}</div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                        <select
                          id={`env-${project.id}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          defaultValue="development"
                        >
                          <option value="development">Development</option>
                          <option value="staging">Staging</option>
                          <option value="production">Production</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={async () => {
                            try {
                              const envSelect = document.getElementById(`env-${project.id}`) as HTMLSelectElement;
                              const environment = envSelect.value;
                              
                              const deployResponse = await fetch('/api/deploy', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                  compiled: project.compiled, 
                                  environment 
                                }),
                              });
                              
                              const result = await deployResponse.json();
                              
                              if (deployResponse.ok) {
                                alert(`Project "${project.blueprintName}" deployed successfully to ${environment}!\nRelease ID: ${result.releaseId}`);
                                await fetchDeployments();
                              } else {
                                alert(`Deployment failed: ${result.error || 'Unknown error'}`);
                              }
                            } catch (error) {
                              console.error('Deployment error:', error);
                              alert('Failed to deploy compiled project');
                            }
                          }}
                          className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors mb-2"
                        >
                          🚀 Deploy to Environment
                        </button>
                        
                        <button
                          onClick={() => handleDeleteCompiledProject(project.id, project.blueprintName)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          🗑️ Delete from Deploy List
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Deployments */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active Deployments</h2>
                {deployments.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Release ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployed At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {deployments.map((deployment) => (
                            <tr key={deployment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {deployment.compiled?.name || 'Unknown Project'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                {deployment.id?.substring(0, 8)}...
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  deployment.environment === 'production' ? 'bg-red-100 text-red-800' :
                                  deployment.environment === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {deployment.environment}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(deployment.deployedAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  {deployment.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to undeploy this release?')) {
                                      try {
                                        const response = await fetch(`/api/deploy/${deployment.id}`, {
                                          method: 'DELETE',
                                        });
                                        
                                        if (response.ok) {
                                          alert('Release undeployed successfully!');
                                          await fetchDeployments();
                                        } else {
                                          alert('Failed to undeploy release');
                                        }
                                      } catch (error) {
                                        console.error('Undeploy error:', error);
                                        alert('Failed to undeploy release');
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Undeploy
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg shadow-md">
                    <div className="text-gray-400 text-4xl mb-4">🚀</div>
                    <p className="text-gray-600">No active deployments</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Projects Ready to Deploy</h3>
              <p className="text-gray-600 mb-4">
                Compile blueprints first to make them available for deployment.
              </p>
              <button
                onClick={() => setSelectedSection('compile')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mr-4"
              >
                Go to Compiled Projects
              </button>
              <button
                onClick={() => setSelectedSection('blueprints')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Blueprints
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show monitor section
  if (selectedSection === 'monitor') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => setSelectedSection(null)}
              className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Monitor & Manage</h1>
            <p className="text-gray-600">Monitor agent performance and manage resources</p>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{blueprints.length}</div>
                  <div className="text-sm text-gray-600">Total Blueprints</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{compiledProjects.length}</div>
                  <div className="text-sm text-gray-600">Compiled Projects</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-lg mr-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{deployments.length}</div>
                  <div className="text-sm text-gray-600">Active Deployments</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{deployments.filter(d => d.status === 'deployed').length}</div>
                  <div className="text-sm text-gray-600">Running Agents</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {deployments.length > 0 ? (
              <div className="space-y-4">
                {deployments.slice(0, 5).map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-2 rounded-lg mr-3">
                        <span className="text-lg">🚀</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Deployment to {deployment.environment}</div>
                        <div className="text-sm text-gray-600">{new Date(deployment.deployedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {deployment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-600">No recent activity</p>
              </div>
            )}
          </div>

          {/* Environment Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['development', 'staging', 'production'].map((env) => {
                const envDeployments = deployments.filter(d => d.environment === env);
                return (
                  <div key={env} className="text-center p-4 border rounded-lg">
                    <div className={`text-2xl font-bold mb-2 ${
                      env === 'production' ? 'text-red-600' :
                      env === 'staging' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {envDeployments.length}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{env}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {envDeployments.length === 1 ? '1 deployment' : `${envDeployments.length} deployments`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard with 4 cards
  return (
    <>
      <Head>
        <title>Agent Factory</title>
        <meta name="description" content="Create, compile, and deploy intelligent agents" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Agent Factory</h1>
            <p className="text-xl text-gray-600">Create, compile, and deploy intelligent agents</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Blueprints Card */}
            <div 
              onClick={() => setSelectedSection('blueprints')}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer p-8 border-l-4 border-blue-500"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <span className="text-3xl">🎨</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Blueprints</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Design and manage agent workflow blueprints. Create new blueprints or edit existing templates.
              </p>
              <div className="flex items-center text-blue-600">
                <span className="mr-2">Available: {blueprints.length} blueprints</span>
                <span>→</span>
              </div>
            </div>

            {/* Compile Card */}
            <div 
              onClick={compileQueue.length > 0 ? () => setSelectedSection('compile') : undefined}
              className={`bg-white rounded-xl shadow-lg transition-shadow p-8 border-l-4 border-green-500 ${
                compileQueue.length > 0 
                  ? 'hover:shadow-xl cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <span className="text-3xl">⚙️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Compile</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Compile blueprints from your queue. {compileQueue.length === 0 ? 'Add blueprints to compile list first.' : 'Manage and compile queued blueprints.'}
              </p>
              <div className={`flex items-center ${compileQueue.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">
                  {compileQueue.length > 0 
                    ? `${compileQueue.length} blueprint${compileQueue.length !== 1 ? 's' : ''} in queue` 
                    : 'No blueprints in compile queue'}
                </span>
                {compileQueue.length > 0 && <span>→</span>}
              </div>
            </div>

            {/* Deploy Card */}
            <div 
              onClick={compiledProjects.length > 0 ? () => setSelectedSection('deploy') : undefined}
              className={`bg-white rounded-xl shadow-lg transition-shadow p-8 border-l-4 border-orange-500 ${
                compiledProjects.length > 0 
                  ? 'hover:shadow-xl cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 p-3 rounded-lg mr-4">
                  <span className="text-3xl">🚀</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Deploy</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Deploy compiled projects to production environments. {compiledProjects.length === 0 ? 'Compile projects first to access deployment.' : 'Manage deployments and scaling.'}
              </p>
              <div className={`flex items-center ${compiledProjects.length > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                <span className="mr-2">
                  {compiledProjects.length > 0 
                    ? `${compiledProjects.length} project${compiledProjects.length !== 1 ? 's' : ''} ready to deploy` 
                    : 'No projects ready for deployment'}
                </span>
                {compiledProjects.length > 0 && <span>→</span>}
              </div>
            </div>

            {/* Monitor and Manage Card */}
            <div 
              onClick={() => setSelectedSection('monitor')}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer p-8 border-l-4 border-purple-500"
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Monitor & Manage</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Monitor agent performance, manage resources, and analyze workflow metrics.
              </p>
              <div className="flex items-center text-purple-600">
                <span className="mr-2">Monitoring active</span>
                <span>→</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{blueprints.length}</div>
                <div className="text-sm text-gray-600">Total Blueprints</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{compiledProjects.length}</div>
                <div className="text-sm text-gray-600">Compiled Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{deployments.length}</div>
                <div className="text-sm text-gray-600">Active Deployments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Running Agents</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}