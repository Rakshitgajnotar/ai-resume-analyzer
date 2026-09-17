import { useState } from 'react';
import { Copy, Check, Printer } from 'lucide-react';

function ReportExport({ analysis }) {
  const [copied, setCopied] = useState(false);

  if (!analysis || !analysis.result) return null;

  const { result } = analysis;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const text = `
# ProfileIQ AI Resume Match Report
- **ATS Match Score**: ${result.matchScore}%
- **Date Analyzed**: ${new Date(analysis.createdAt).toLocaleDateString()}

## Summary
${result.summary}

## Matched Keywords
${result.matchedKeywords?.join(', ') || 'None'}

## Missing Keywords
${result.missingKeywords?.join(', ') || 'None'}

## Strengths
${result.strengths?.map((s) => `- ${s}`).join('\n') || 'None'}

## Weaknesses & Gaps
${result.weaknesses?.map((w) => `- ${w}`).join('\n') || 'None'}

## What Can Be Added
${result.whatCanBeAdded?.map((a) => `- ${a}`).join('\n') || 'None'}

## Suggested Bullet Point Rewrites
${result.suggestedBullets
  ?.map(
    (b) => `
Original: ${b.original}
Improved: ${b.improved}
Why: ${b.reason}`
  )
  .join('\n\n')}
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={handleCopyMarkdown}
        className="px-3 py-1.5 bg-[#141416] hover:bg-[#222226] border border-[#222226] text-xs font-extrabold text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Report Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Copy Text Report</span>
          </>
        )}
      </button>

      <button
        onClick={handlePrint}
        className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-black text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Print / PDF Export</span>
      </button>
    </div>
  );
}

export default ReportExport;
