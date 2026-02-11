/**
 * CreateSuiteModal Component
 * 
 * Modal for creating new evaluation suites with test cases.
 */

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import { toast } from '../lib/toast'
import type { TestCase, ScoringCriteria, ScoringCriteriaType } from '../../../packages/shared/src/types/evaluation'

interface CreateSuiteModalProps {
  tenantId: Id<'tenants'>
  operatorId: Id<'operators'>
  onClose: () => void
  onSuccess?: () => void
}

export function CreateSuiteModal({ tenantId, operatorId, onClose, onSuccess }: CreateSuiteModalProps) {
  const createSuite = useMutation(api.evaluationSuites.create)

  type TestCaseForm = Omit<TestCase, 'scoringCriteria'> & { scoringCriteria: ScoringCriteria }
  const buildTestCase = (id: string): TestCaseForm => ({
    id,
    name: `Test Case ${id}`,
    input: '',
    expectedOutput: '',
    scoringCriteria: {
      type: 'exact_match',
    },
  })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [testCases, setTestCases] = useState<TestCaseForm[]>([buildTestCase('1')])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addTestCase = () => {
    const newId = (Math.max(...testCases.map(tc => parseInt(tc.id)), 0) + 1).toString()
    setTestCases([...testCases, buildTestCase(newId)])
  }

  const removeTestCase = (id: string) => {
    if (testCases.length === 1) {
      toast.error('Suite must have at least one test case')
      return
    }
    setTestCases(testCases.filter(tc => tc.id !== id))
  }

  const updateTestCase = (id: string, updates: Partial<TestCaseForm>) => {
    setTestCases(testCases.map(tc => (tc.id === id ? { ...tc, ...updates } : tc)))
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      toast.error('Suite name is required')
      return
    }

    const invalidTestCases = testCases.filter(tc => !tc.input.trim() || !tc.expectedOutput.trim())
    if (invalidTestCases.length > 0) {
      toast.error('All test cases must have input and expected output')
      return
    }

    setIsSubmitting(true)

    try {
      await createSuite({
        tenantId,
        name: name.trim(),
        description: description.trim() || undefined,
        testCases,
        createdBy: operatorId,
        tags: tags.length > 0 ? tags : undefined,
      })

      toast.success(`Suite "${name}" created successfully`)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create suite:', error)
      toast.error((error as Error).message || 'Failed to create suite')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-arm-bg-secondary rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-arm-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-arm-text-primary">Create Evaluation Suite</h2>
          <button
            onClick={onClose}
            className="text-arm-text-secondary hover:text-arm-text-primary transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-arm-text-primary mb-1">
                  Suite Name <span className="text-arm-danger">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-arm-bg-primary border border-arm-border rounded-lg text-arm-text-primary placeholder-arm-text-tertiary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent"
                  placeholder="e.g., Standard Agent Tests"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-arm-text-primary mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-arm-bg-primary border border-arm-border rounded-lg text-arm-text-primary placeholder-arm-text-tertiary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Describe what this suite tests..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-arm-text-primary mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-arm-bg-primary border border-arm-border rounded-lg text-arm-text-primary placeholder-arm-text-tertiary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent"
                    placeholder="Add tag and press Enter"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-arm-accent text-white rounded-lg hover:bg-arm-accent-hover transition-colors disabled:opacity-50"
                    disabled={isSubmitting || !tagInput.trim()}
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-arm-accent/20 text-arm-accent rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-arm-danger transition-colors"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Test Cases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-arm-text-primary">
                  Test Cases <span className="text-arm-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="px-3 py-1 bg-arm-accent text-white rounded-lg hover:bg-arm-accent-hover transition-colors text-sm disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  + Add Test Case
                </button>
              </div>

              <div className="space-y-4">
                {testCases.map((testCase, index) => (
                  <div key={testCase.id} className="p-4 bg-arm-bg-primary border border-arm-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-arm-text-primary">Test Case {index + 1}</h4>
                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(testCase.id)}
                          className="text-arm-danger hover:text-red-400 transition-colors text-sm"
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-arm-text-secondary mb-1">
                          Input <span className="text-arm-danger">*</span>
                        </label>
                        <textarea
                          value={testCase.input}
                          onChange={e => updateTestCase(testCase.id, { input: e.target.value })}
                          className="w-full px-3 py-2 bg-arm-bg-secondary border border-arm-border rounded-lg text-arm-text-primary placeholder-arm-text-tertiary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent resize-none text-sm"
                          rows={2}
                          placeholder="Enter test input..."
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-arm-text-secondary mb-1">
                          Expected Output <span className="text-arm-danger">*</span>
                        </label>
                        <textarea
                          value={testCase.expectedOutput}
                          onChange={e => updateTestCase(testCase.id, { expectedOutput: e.target.value })}
                          className="w-full px-3 py-2 bg-arm-bg-secondary border border-arm-border rounded-lg text-arm-text-primary placeholder-arm-text-tertiary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent resize-none text-sm"
                          rows={2}
                          placeholder="Enter expected output..."
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-arm-text-secondary mb-1">
                          Scoring Type
                        </label>
                        <select
                          value={testCase.scoringCriteria.type}
                          onChange={e =>
                            updateTestCase(testCase.id, {
                              scoringCriteria: { type: e.target.value as ScoringCriteriaType },
                            })
                          }
                          className="w-full px-3 py-2 bg-arm-bg-secondary border border-arm-border rounded-lg text-arm-text-primary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent text-sm"
                          disabled={isSubmitting}
                        >
                          <option value="exact_match">Exact Match</option>
                          <option value="contains">Contains</option>
                          <option value="similarity">Similarity (Levenshtein)</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {testCase.scoringCriteria.type === 'similarity' && (
                        <div>
                          <label className="block text-xs font-medium text-arm-text-secondary mb-1">
                            Similarity Threshold (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={testCase.scoringCriteria.threshold || 0.8}
                            onChange={e =>
                              updateTestCase(testCase.id, {
                                scoringCriteria: {
                                  ...testCase.scoringCriteria,
                                  threshold: parseFloat(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-arm-bg-secondary border border-arm-border rounded-lg text-arm-text-primary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent text-sm"
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-arm-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-arm-text-secondary hover:text-arm-text-primary transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-arm-accent text-white rounded-lg hover:bg-arm-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Suite'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
