import React, { useState } from 'react';
import { Agent } from '../../types';
import { 
  Cpu, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface SettingsViewProps {
  agents: Agent[];
  onCreateAgent: (data: Partial<Agent>) => Promise<void>;
  onDeleteAgent: (id: string) => Promise<void>;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  agents,
  onCreateAgent,
  onDeleteAgent,
  isDemoMode,
  setIsDemoMode,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [maxSteps, setMaxSteps] = useState(10);
  const [maxTime, setMaxTime] = useState(15.0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Please provide a name for the agent profile.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onCreateAgent({
        name,
        description,
        endpoint: endpoint || undefined,
        model,
        max_steps: Number(maxSteps),
        max_response_time: Number(maxTime),
      });
      setName('');
      setDescription('');
      setEndpoint('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Global Lab Simulation Toggle */}
      <div className="glass-panel rounded-xl p-5 border border-obsidian-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Interactive Demo Mode</h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            When active, the laboratory simulates multi-step agent actions, tool calls, and realistic failure conditions across test cases without requiring external API keys.
          </p>
        </div>

        <button
          onClick={() => setIsDemoMode(!isDemoMode)}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono border transition-all ${
            isDemoMode
              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-glow-purple'
              : 'bg-obsidian-800 text-slate-400 border-obsidian-700 hover:text-white'
          }`}
        >
          {isDemoMode ? 'SIMULATION ACTIVE' : 'LIVE API DISABLED'}
        </button>
      </div>

      {/* Target Agent Profiles */}
      <div className="glass-panel rounded-xl p-5 border border-obsidian-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-obsidian-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Target Agent Profiles
            </h3>
            <p className="text-xs text-slate-400">
              Configure endpoints and execution budgets for evaluated models
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-glow-purple"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Agent Profile</span>
          </button>
        </div>

        {/* Add Agent Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-obsidian-950 border border-obsidian-800 space-y-3 text-xs animate-in fade-in duration-200">
            <div className="font-semibold text-white text-xs font-mono">New Agent Profile Specification</div>
            {error && <div className="text-rose-400 text-xs">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Agent Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Llama-3-70B Test Rig"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Model Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. gpt-4o or meta-llama-3"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">HTTP API Endpoint (Optional)</label>
                <input
                  type="text"
                  placeholder="https://api.openai.com/v1/chat/completions"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Profile Description</label>
              <input
                type="text"
                placeholder="Evaluation notes, role, or architecture details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Max Step Depth Limit</label>
                <input
                  type="number"
                  value={maxSteps}
                  onChange={(e) => setMaxSteps(Number(e.target.value))}
                  className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Max Latency Budget (s)</label>
                <input
                  type="number"
                  step="0.5"
                  value={maxTime}
                  onChange={(e) => setMaxTime(Number(e.target.value))}
                  className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg border border-obsidian-700 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium"
              >
                {isSaving ? 'Saving...' : 'Create Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Existing Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 rounded-xl bg-obsidian-950/60 border border-obsidian-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">{agent.name}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {agent.model}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{agent.description || 'No description provided'}</p>
                <div className="text-[11px] font-mono text-slate-400 mt-2 truncate">
                  Endpoint: {agent.endpoint || 'Mock Simulator Profile'}
                </div>
              </div>

              <div className="pt-2 border-t border-obsidian-850 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Budget: {agent.max_steps} steps • {agent.max_response_time}s</span>
                {agent.id !== 'agent-gpt4o' && agent.id !== 'agent-demo' && (
                  <button
                    onClick={() => onDeleteAgent(agent.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                    title="Delete agent profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
