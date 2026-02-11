/**
 * Custom Function Editor Component
 * 
 * Create, edit, test, and manage custom scoring functions.
 */

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, type Doc } from "../convex/_generated/dataModel";

interface CustomFunctionEditorProps {
  tenantId: Id<"tenants">;
  currentOperatorId: Id<"operators">;
}

type FunctionParam = {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
};

type FunctionExample = {
  input: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  score: number;
};

export function CustomFunctionEditor({
  tenantId,
  currentOperatorId,
}: CustomFunctionEditorProps) {
  const [selectedFunction, setSelectedFunction] = useState<Id<"customScoringFunctions"> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState(`function score(input, expectedOutput, actualOutput) {
  // Your custom scoring logic here
  // Must return a number between 0 and 1
  
  // Example: Simple exact match
  if (JSON.stringify(expectedOutput) === JSON.stringify(actualOutput)) {
    return 1.0;
  }
  
  return 0.0;
}`);

  // Queries
  const functions = useQuery(api.customScoringFunctions.list, {
    tenantId,
    activeOnly: false,
  }) as Doc<"customScoringFunctions">[] | undefined;

  // Mutations
  const createFunction = useMutation(api.customScoringFunctions.create);
  const deleteFunction = useMutation(api.customScoringFunctions.remove);

  // Actions
  const testFunction = useAction(api.customScoringFunctions.test);

  const selectedFunctionData = selectedFunction
    ? functions?.find((f) => f._id === selectedFunction)
    : null;

  const handleCreate = async () => {
    try {
      await createFunction({
        tenantId,
        name,
        description,
        code,
        createdBy: currentOperatorId,
        metadata: {
          parameters: [
            { name: "input", type: "any", required: true },
            { name: "expectedOutput", type: "any", required: true },
            { name: "actualOutput", type: "any", required: true },
          ],
          returnType: "number",
          examples: [],
        },
      });
      setShowCreateModal(false);
      setName("");
      setDescription("");
      setCode(`function score(input, expectedOutput, actualOutput) {
  // Your custom scoring logic here
  return 0.0;
}`);
    } catch (error) {
      alert(`Error creating function: ${(error as Error).message}`);
    }
  };

  const handleTest = async () => {
    if (!selectedFunction) return;

    try {
      const result = await testFunction({ functionId: selectedFunction });
      alert(
        `Test Results:\n\nTotal Tests: ${result.totalTests}\nPassed: ${result.passed}\nFailed: ${result.failed}\n\n${
          result.allPassed ? "✅ All tests passed!" : "❌ Some tests failed"
        }`
      );
    } catch (error) {
      alert(`Error testing function: ${(error as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Scoring Functions</h2>
          <p className="text-gray-600 mt-1">
            Create and manage custom JavaScript scoring functions
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create Function
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Functions List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Functions ({functions?.length || 0})
          </h3>

          {functions?.map((func) => (
            <div
              key={func._id}
              onClick={() => {
                setSelectedFunction(func._id);
                setIsEditing(false);
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedFunction === func._id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{func.name}</h4>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        func.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {func.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {func.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">v{func.version}</p>
                </div>
              </div>
            </div>
          ))}

          {functions?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No functions found</p>
              <p className="text-sm mt-1">Create your first function to get started</p>
            </div>
          )}
        </div>

        {/* Function Editor/Viewer */}
        <div className="lg:col-span-2">
          {selectedFunctionData ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedFunctionData.name}
                  </h3>
                  <p className="text-gray-600 mt-1">{selectedFunctionData.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-gray-500">
                      Version {selectedFunctionData.version}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedFunctionData.language}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        selectedFunctionData.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {selectedFunctionData.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleTest}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${selectedFunctionData.name}"?`
                        )
                      ) {
                        await deleteFunction({ functionId: selectedFunctionData._id });
                        setSelectedFunction(null);
                      }
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Function Code
                </label>
                <div className="relative">
                  <textarea
                    value={selectedFunctionData.code}
                    readOnly={!isEditing}
                    className={`w-full h-64 px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !isEditing ? "bg-gray-50" : ""
                    }`}
                    spellCheck={false}
                  />
                  {!isEditing && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                        Read-only
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Parameters */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Parameters</h4>
                <div className="space-y-2">
                  {selectedFunctionData.metadata.parameters.map((param: FunctionParam) => (
                    <div
                      key={param.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{param.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({param.type})</span>
                      </div>
                      {param.required && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Examples */}
              {selectedFunctionData.metadata.examples.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Examples ({selectedFunctionData.metadata.examples.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedFunctionData.metadata.examples.map((example: FunctionExample, index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Input:</p>
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(example.input, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Expected:</p>
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(example.expectedOutput, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Actual:</p>
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(example.actualOutput, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Expected Score:</p>
                            <p className="text-lg font-bold text-gray-900">
                              {(example.score * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Full editing functionality requires additional form
                    components. For now, use the Convex dashboard to update functions.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <p>Select a function to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Function Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create Custom Function
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Function Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., semantic-similarity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this function does..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Function Code
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-64 px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Function must return a number between 0 and 1
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name || !description || !code}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Function
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
