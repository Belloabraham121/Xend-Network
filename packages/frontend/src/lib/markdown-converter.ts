/**
 * Utility functions to convert markdown text to plain text
 */

/**
 * Convert markdown text to plain text by removing markdown syntax
 * @param markdown - The markdown text to convert
 * @returns Plain text without markdown formatting
 */
export function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // Remove headers (# ## ### etc.)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold and italic formatting
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold**
  text = text.replace(/\*([^*]+)\*/g, '$1'); // *italic*
  text = text.replace(/__([^_]+)__/g, '$1'); // __bold__
  text = text.replace(/_([^_]+)_/g, '$1'); // _italic_

  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove links but keep the text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Remove list markers
  text = text.replace(/^\s*[-*+]\s+/gm, '• '); // Unordered lists
  text = text.replace(/^\s*\d+\.\s+/gm, ''); // Ordered lists

  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n'); // Multiple newlines
  text = text.replace(/^\s+|\s+$/g, ''); // Leading/trailing whitespace

  return text;
}

/**
 * Format AI response for display in chat interface
 * @param response - The AI response (potentially in markdown)
 * @returns Formatted plain text response
 */
export function formatAIResponse(response: string): string {
  const plainText = markdownToPlainText(response);
  
  // Add some basic formatting for better readability
  return plainText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');
}

/**
 * Convert markdown list to formatted text
 * @param markdown - Markdown text containing lists
 * @returns Formatted text with proper list formatting
 */
export function formatMarkdownList(markdown: string): string {
  let text = markdown;
  
  // Convert unordered lists to bullet points
  text = text.replace(/^\s*[-*+]\s+(.+)$/gm, '• $1');
  
  // Convert ordered lists to numbered format
  let counter = 1;
  text = text.replace(/^\s*\d+\.\s+(.+)$/gm, () => {
    return `${counter++}. $1`;
  });
  
  return text;
}