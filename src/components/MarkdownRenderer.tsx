import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Split into code blocks vs regular text
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm leading-relaxed text-[#e3e3e3]">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = !firstLine.includes(' ') && firstLine.length > 0 && lines.length > 1;
          const language = hasLang ? firstLine : 'code';
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <CodeBlock key={index} code={codeBody} language={language} />
          );
        }

        return <TextBlock key={index} text={part} />;
      })}
    </div>
  );
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-lg overflow-hidden border border-[#333537] bg-[#141517]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1b1c1e] border-b border-[#2d2f31] text-xs text-gray-400">
        <span className="font-mono lowercase text-[#9b72cb]">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-gray-300 hover:text-white hover:bg-[#2b2c2d] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono text-gray-200 leading-normal">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, lIndex) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIndex} className="h-2" />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={lIndex} className="font-semibold text-base text-white pt-2 pb-1">
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={lIndex} className="font-bold text-lg text-white pt-2.5 pb-1">
              {renderInline(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={lIndex} className="font-extrabold text-xl text-white pt-3 pb-1.5">
              {renderInline(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lIndex} className="flex items-start gap-2 pl-2">
              <span className="text-[#4285f4] mt-1 select-none font-bold">•</span>
              <p className="flex-1">{renderInline(trimmed.slice(2))}</p>
            </div>
          );
        }

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={lIndex} className="flex items-start gap-2 pl-2">
              <span className="text-[#9b72cb] font-mono text-xs mt-0.5 select-none">{numMatch[1]}.</span>
              <p className="flex-1">{renderInline(numMatch[2])}</p>
            </div>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={lIndex} className="border-l-2 border-[#4285f4] pl-3 py-1 text-gray-300 italic my-1 bg-[#1a1b1d]/40 rounded-r">
              {renderInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        return (
          <p key={lIndex} className="leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </>
  );
};

// Render inline formatting: **bold**, *italic*, `inline code`
function renderInline(text: string): React.ReactNode[] {
  // Regex to split tokens
  const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic text-gray-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="font-mono text-xs px-1.5 py-0.5 bg-[#141517] text-[#9b72cb] rounded border border-[#333537]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
