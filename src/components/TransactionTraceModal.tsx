import React from 'react';
import { X, Send, CheckCircle2, AlertOctagon, Clock, ArrowRight, Layers } from 'lucide-react';
import { TransactionResult } from '../types';

interface TransactionTraceModalProps {
  result: TransactionResult | null;
  onClose: () => void;
}

export const TransactionTraceModal: React.FC<TransactionTraceModalProps> = ({
  result,
  onClose,
}) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${result.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">Distributed Transaction Trace</h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  result.success ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {result.success ? '200 OK' : '504 TIMEOUT / ERROR'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Duration: <strong className="text-white">{result.durationMs}ms</strong> across {result.trace.length} hops
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trace Waterfall */}
        <div className="my-5 space-y-2.5 font-mono text-xs">
          {result.trace.map((hop, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                hop.ok 
                  ? 'bg-slate-950/80 border-slate-800 text-slate-200' 
                  : 'bg-rose-950/50 border-rose-800 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500 font-bold">{idx + 1}.</span>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    {hop.serviceId}
                    {hop.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  {hop.error && (
                    <span className="text-[11px] text-rose-400 block mt-0.5">
                      Error: {hop.error}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className={`font-bold ${hop.latency > 150 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {hop.latency}ms
                </span>
                <span className="text-[10px] text-slate-500 block">hop latency</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold transition-colors"
        >
          Close Trace Inspector
        </button>

      </div>
    </div>
  );
};
