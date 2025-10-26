import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Blueprint } from '@agentfactory/types';
import dynamic from 'next/dynamic';
import { 
  getAllBlueprints, 
  saveBlueprint, 
  updateBlueprint, 
  deleteBlueprint as deleteBlueprintFromStorage 
} from '../src/utils/blueprintStorage';
import { WelcomeModal } from '../src/components/WelcomeModal';

// Dynamically import the BlueprintCreator to avoid SSR issues
const BlueprintCreator = dynamic(() => import('../src/components/ProjectCreator').then(mod => ({ default: mod.BlueprintCreator })), {
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

export default function Home() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [editingBlueprint, setEditingBlueprint] = useState<Blueprint | null>(null);
  const [showBlueprintsModal, setShowBlueprintsModal] = useState(false);
  const [loadedExample, setLoadedExample] = useState<Blueprint | null>(null);

  useEffect(() => {
    fetchBlueprints();
  }, []);

  const fetchBlueprints = () => {
    const storedBlueprints = getAllBlueprints();
    setBlueprints(storedBlueprints);
  };

  const handleBlueprintSaved = (blueprint: Blueprint) => {
    try {
      const isBuiltInBlueprint = editingBlueprint && ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'].includes(editingBlueprint.id);
      
      if (editingBlueprint && !isBuiltInBlueprint) {
        // Update existing custom blueprint
        const updated = updateBlueprint(blueprint.id, blueprint);
        if (!updated) {
          throw new Error('Failed to update blueprint');
        }
        console.log('Blueprint updated successfully');
      } else {
        // Create new blueprint (either new or copy of built-in)
        if (isBuiltInBlueprint) {
          // For built-in blueprints, create a copy with a new ID
          const { id, ...blueprintData } = blueprint;
          saveBlueprint(blueprintData);
        } else {
          saveBlueprint(blueprint);
        }
        console.log(`Blueprint ${isBuiltInBlueprint ? 'copied and created' : 'created'} successfully`);
      }
      
      fetchBlueprints();
      setEditingBlueprint(null);
    } catch (error) {
      console.error('Error saving blueprint:', error);
      alert(`Failed to ${editingBlueprint && !['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'].includes(editingBlueprint.id) ? 'update' : 'create'} blueprint`);
    }
  };

  const handleEditBlueprint = (blueprint: Blueprint) => {
    const isBuiltIn = ['multi-agent', 'approval-chain', 'data-pipeline', 'helpdesk-automation', 'maker-checker'].includes(blueprint.id);
    
    if (isBuiltIn) {
      // For built-in examples, load them onto the canvas without entering edit mode
      setLoadedExample(blueprint);
      setEditingBlueprint(null);
    } else {
      // For custom blueprints, allow editing
      setEditingBlueprint(blueprint);
      setLoadedExample(null);
    }
    
    setShowBlueprintsModal(false);
  };

  const handleNewBlueprint = () => {
    setEditingBlueprint(null);
  };

  const handleDeleteBlueprint = (id: string) => {
    if (!confirm('Are you sure you want to delete this blueprint?')) return;
    
    try {
      const success = deleteBlueprintFromStorage(id);
      
      if (success) {
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

  return (
    <>
      <Head>
        <title>Agent Factory - Visual Blueprint Creator</title>
        <meta name="description" content="Create intelligent agent blueprints visually" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Welcome Modal - Shows on first visit */}
      <WelcomeModal />

      <div className="h-screen flex flex-col bg-gray-100">
        {/* Blueprints Modal */}
        {showBlueprintsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full h-full sm:w-full sm:max-w-6xl sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 sm:p-6 border-b flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Example Agents</h2>
                <button
                  onClick={() => setShowBlueprintsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {blueprints.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🎨</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Agents Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Create your first agent using the visual creator.
                    </p>
                    <button
                      onClick={() => setShowBlueprintsModal(false)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
                    >
                      Start Creating
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                        <div key={blueprint.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow border">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{blueprint.name}</h3>
                            {isBuiltIn && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Built-in
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-4 text-sm">{blueprint.description}</p>
                          
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
                              className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors min-h-[44px]"
                              title={isBuiltIn ? "Copy example to canvas" : "Edit blueprint"}
                            >
                              ✏️ {isBuiltIn ? 'Copy to Canvas' : 'Edit Blueprint'}
                            </button>
                            
                            {!isBuiltIn && (
                              <button
                                onClick={() => handleDeleteBlueprint(blueprint.id)}
                                className="w-full px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors min-h-[44px]"
                                title="Delete blueprint"
                              >
                                🗑️ Delete Blueprint
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Visual Creator with custom header */}
        <BlueprintCreator 
          onSave={handleBlueprintSaved} 
          onCancel={handleNewBlueprint}
          existingBlueprint={editingBlueprint || undefined}
          loadedExample={loadedExample || undefined}
          onViewBlueprints={() => setShowBlueprintsModal(true)}
        />
      </div>
    </>
  );
}