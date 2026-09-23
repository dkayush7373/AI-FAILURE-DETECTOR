import React, { useState } from 'react';
import { TestCase } from '../../types';
import { X, Plus, Save } from 'lucide-react';

interface TestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tc: TestCase) => Promise<void>;
  initialData?: TestCase | null;
}

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [id, setId] = useState(initialData?.id || `TC-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'Basic');
  const [inputPrompt, setInputPrompt] = useState(initialData?.input_prompt || '');
  const [expectedOutcome, setExpectedOutcome] = useState(initialData?.expected_outcome || '');
  const [successCriteria, setSuccessCriteria] = useState(
    initialData?.success_criteria || '{"required_terms": [], "max_length": 500}'
  );
  const [maxSteps, setMaxSteps] = useState(initialData?.max_steps || 5);
  const [maxTime, setMaxTime] = useState(initialData?.max_time || 10.0);
  const [priority, setPriority] = useState<TestCase['priority']>(initialData?.priority || 'MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !inputPrompt || !expectedOutcome) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id,
        name,
        category,
        input_prompt: inputPrompt,
        expected_outcome: expectedOutcome,
        success_criteria: successCriteria,
        max_steps: Number(maxSteps),
        max_time: Number(maxTime),
        priority,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save test case');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-obsidian-900 border border-obsidian-800 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-obsidian-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {initialData ? 'Edit Test Case' : 'Create New QA Benchmark Test'}
            </h3>
            <p className="text-xs text-slate-400">Define prompts, criteria, and SLA constraints</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-mono">Test ID *</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={!!initialData}
                className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Basic">Basic</option>
                <option value="Complex Reasoning">Complex Reasoning</option>
                <option value="Edge Cases">Edge Cases</option>
                <option value="Tool & Execution">Tool & Execution</option>
                <option value="Quality & Error Handling">Quality & Error Handling</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Test Name *</label>
            <input
              type="text"
              placeholder="e.g. Strict YAML Syntax Validation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-mono">Input Prompt to Agent *</label>
            <textarea
              rows={3}
              placeholder="Enter exact user prompt to be dispatched..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Expected Outcome *</label>
            <textarea
              rows={2}
              placeholder="Describe correct output, facts, or behavior expected..."
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-mono">Success Criteria JSON</label>
            <textarea
              rows={2}
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-purple-300 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-mono">Max Steps Limit</label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-mono">Max Latency SLA (Seconds)</label>
              <input
                type="number"
                step="0.5"
                min={0.5}
                max={60}
                value={maxTime}
                onChange={(e) => setMaxTime(Number(e.target.value))}
                className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-obsidian-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-obsidian-700 text-slate-300 hover:text-white hover:bg-obsidian-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-glow-purple transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Test Case'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
