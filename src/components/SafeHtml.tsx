import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  html: string;
  className?: string;
  allowedTags?: string[];
}

// Configure DOMPurify defaults
const DEFAULT_ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'];
const DEFAULT_ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'id'];

export function SafeHtml({ html, className, allowedTags }: SafeHtmlProps) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags || DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
    ADD_ATTR: ['target'],
    // Force all links to open in new tab with noopener
    FORCE_BODY: true,
  });

  // Post-process to add security attributes to links
  const secureHtml = sanitized.replace(
    /<a\s/g,
    '<a rel="noopener noreferrer" target="_blank" '
  );

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: secureHtml }} 
    />
  );
}

// Utility function for sanitizing text without rendering
export function sanitizeHtml(html: string, allowedTags?: string[]): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags || DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
  });
}

// Utility for stripping all HTML
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
