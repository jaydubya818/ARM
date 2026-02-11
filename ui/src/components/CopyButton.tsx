import { useState } from 'react';

interface CopyButtonProps {
  text: string
  label?: string
  size?: 'sm' | 'md'
}

export function CopyButton({ text, label, size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <button
      onClick={handleCopy}
      className={`${sizeClasses[size]} text-arm-accent hover:text-arm-blue transition-colors font-medium`}
      title={`Copy ${label || 'text'}`}
    >
      {copied ? '✓ Copied' : label || 'Copy'}
    </button>
  );
}
