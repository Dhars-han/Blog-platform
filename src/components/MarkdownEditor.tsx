import { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarButton {
  icon: string;
  label: string;
  action: () => void;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreview, setIsPreview] = useState(false);

  function wrapSelection(before: string, after: string = before, placeholderText: string = '') {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholderText;
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    });
  }

  function insertLinePrefix(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  }

  function insertImage() {
    const url = window.prompt('Image URL:');
    if (!url) return;
    const alt = window.prompt('Alt text (optional):') || '';
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const img = `![${alt}](${url})`;
    onChange(value.substring(0, pos) + img + value.substring(pos));
  }

  function insertLink() {
    const url = window.prompt('Link URL:');
    if (!url) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || 'link text';
    const link = `[${selected}](${url})`;
    onChange(value.substring(0, start) + link + value.substring(end));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      wrapSelection('**', '**', 'bold text');
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      wrapSelection('*', '*', 'italic text');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      onChange(value.substring(0, start) + '  ' + value.substring(textarea.selectionEnd));
      requestAnimationFrame(() => {
        textarea?.setSelectionRange(start + 2, start + 2);
      });
    }
  }

  const toolbarButtons: ToolbarButton[] = [
    { icon: 'B', label: 'Bold', action: () => wrapSelection('**', '**', 'bold text') },
    { icon: 'I', label: 'Italic', action: () => wrapSelection('*', '*', 'italic text') },
    { icon: 'H', label: 'Heading', action: () => insertLinePrefix('## ') },
    { icon: '•', label: 'Bullet list', action: () => insertLinePrefix('- ') },
    { icon: '1.', label: 'Numbered list', action: () => insertLinePrefix('1. ') },
    { icon: '"', label: 'Quote', action: () => insertLinePrefix('> ') },
    { icon: '< >', label: 'Code', action: () => wrapSelection('`', '`', 'code') },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-3 py-2">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              title={btn.label}
              className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold text-ink-600 hover:bg-ink-200 hover:text-ink-900 transition-colors"
            >
              {btn.icon}
            </button>
          ))}
          <div className="mx-1 h-5 w-px bg-ink-200" />
          <button
            type="button"
            onClick={insertLink}
            title="Insert link"
            className="flex h-8 items-center justify-center rounded-md px-2 text-sm font-medium text-ink-600 hover:bg-ink-200 hover:text-ink-900 transition-colors"
          >
            Link
          </button>
          <button
            type="button"
            onClick={insertImage}
            title="Insert image"
            className="flex h-8 items-center justify-center rounded-md px-2 text-sm font-medium text-ink-600 hover:bg-ink-200 hover:text-ink-900 transition-colors"
          >
            Image
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-ink-100 p-0.5">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              !isPreview ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              isPreview ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            Preview
          </button>
        </div>
      </div>
      {isPreview ? (
        <div
          className="prose-blog min-h-[400px] p-4"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Write your post in markdown...'}
          className="min-h-[400px] w-full resize-y bg-white p-4 font-mono text-sm leading-relaxed text-ink-800 focus:outline-none"
        />
      )}
    </div>
  );
}

// Simple markdown to HTML renderer
export function renderMarkdown(md: string): string {
  if (!md) return '<p class="text-ink-400">Nothing to preview yet.</p>';
  let html = md;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr />');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/(?:^- (.+)$\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^- /, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/(?:^\d+\. (.+)$\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^\d+\. /, '')}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-3]|ul|ol|pre|blockquote|hr|img)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return html;
}
