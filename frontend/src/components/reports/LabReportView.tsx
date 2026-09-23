import React, { useState, useEffect } from 'react';
import { EvaluationRun } from '../../types';
import { api } from '../../api/client';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Code2, 
  ShieldCheck, 
  Flame 
} from 'lucide-react';

interface LabReportViewProps {
  runs: EvaluationRun[];
  initialRunId?: string;
}

export const LabReportView: React.FC<LabReportViewProps> = ({ runs, initialRunId }) => {
  const [selectedRunId, setSelectedRunId] = useState<string>(
    initialRunId || (runs[0]?.id ?? '')
  );
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [activeFormat, setActiveFormat] = useState<'markdown' | 'json'>('markdown');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialRunId) {
      setSelectedRunId(initialRunId);
    } else if (!selectedRunId && runs.length > 0) {
      setSelectedRunId(runs[0].id);
    }
  }, [initialRunId, runs]);

  useEffect(() => {
    if (!selectedRunId) return;

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const [md, js] = await Promise.all([
          api.getMarkdownReport(selectedRunId),
          api.getJSONReport(selectedRunId),
        ]);
        setMarkdownContent(md);
        setJsonContent(js);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [selectedRunId]);

  const handleCopy = () => {
    const textToCopy =
      activeFormat === 'markdown'
        ? markdownContent
        : JSON.stringify(jsonContent, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeFormat === 'markdown' ? 'md' : 'json';
    const content =
      activeFormat === 'markdown'
        ? markdownContent
        : JSON.stringify(jsonContent, null, 2);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-failure-detector-report-${selectedRunId}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Run Selector & Format Toolbar */}
      <div className="glass-panel rounded-xl p-4 border border-obsidian-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="text-xs text-slate-400 font-mono">SELECT BENCHMARK RUN:</div>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 cursor-pointer mt-0.5"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.agent?.name || r.agent_id} ({r.success_rate}% Pass Rate)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Format Selector and Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Format Switcher */}
          <div className="flex items-center rounded-lg bg-obsidian-950 border border-obsidian-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveFormat('markdown')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeFormat === 'markdown'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Markdown Report
            </button>
            <button
              onClick={() => setActiveFormat('json')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeFormat === 'json'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw JSON Data
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 border border-obsidian-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 border border-obsidian-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-glow-purple"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Content View */}
      <div className="glass-panel rounded-xl p-6 border border-obsidian-800 overflow-hidden min-h-[500px]">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-mono text-xs">
            Compiling lab report data...
          </div>
        ) : activeFormat === 'markdown' ? (
          <div className="prose prose-invert max-w-none text-xs font-mono">
            <pre className="p-4 rounded-xl bg-obsidian-950 border border-obsidian-800 text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {markdownContent}
            </pre>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-xs font-mono">
            <pre className="p-4 rounded-xl bg-obsidian-950 border border-obsidian-800 text-purple-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {JSON.stringify(jsonContent, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
