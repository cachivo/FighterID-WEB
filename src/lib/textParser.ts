// Text parser for social media content
// Detects @mentions, #hashtags, and URLs

export interface ParsedMention {
  username: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedHashtag {
  tag: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedLink {
  url: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedContent {
  mentions: ParsedMention[];
  hashtags: ParsedHashtag[];
  links: ParsedLink[];
}

// Extract @mentions from text
export function extractMentions(text: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  // Match @username (letters, numbers, underscores)
  const mentionRegex = /@(\w+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return mentions;
}

// Extract #hashtags from text
export function extractHashtags(text: string): ParsedHashtag[] {
  const hashtags: ParsedHashtag[] = [];
  // Match #hashtag (letters, numbers, underscores, spanish chars)
  const hashtagRegex = /#([\wáéíóúñÁÉÍÓÚÑ]+)/g;
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push({
      tag: match[1].toLowerCase(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return hashtags;
}

// Extract URLs from text
export function extractLinks(text: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    links.push({
      url: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return links;
}

// Parse all content
export function parseContent(text: string): ParsedContent {
  return {
    mentions: extractMentions(text),
    hashtags: extractHashtags(text),
    links: extractLinks(text)
  };
}

// Convert plain text to JSX with clickable elements
export function renderParsedContent(
  text: string,
  options: {
    onMentionClick?: (username: string) => void;
    onHashtagClick?: (tag: string) => void;
    onLinkClick?: (url: string) => void;
  } = {}
): React.ReactNode[] {
  const parsed = parseContent(text);
  
  // Combine all parsed elements with their positions
  const elements: Array<{
    type: 'mention' | 'hashtag' | 'link' | 'text';
    content: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  parsed.mentions.forEach(m => {
    elements.push({
      type: 'mention',
      content: m.username,
      startIndex: m.startIndex,
      endIndex: m.endIndex
    });
  });

  parsed.hashtags.forEach(h => {
    elements.push({
      type: 'hashtag',
      content: h.tag,
      startIndex: h.startIndex,
      endIndex: h.endIndex
    });
  });

  parsed.links.forEach(l => {
    elements.push({
      type: 'link',
      content: l.url,
      startIndex: l.startIndex,
      endIndex: l.endIndex
    });
  });

  // Sort by start index
  elements.sort((a, b) => a.startIndex - b.startIndex);

  // Build result array
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  elements.forEach((element, idx) => {
    // Add text before this element
    if (element.startIndex > lastIndex) {
      result.push(text.substring(lastIndex, element.startIndex));
    }

    // Add the element itself based on type
    // Note: This will be used by components
    result.push({
      type: element.type,
      content: element.content,
      key: idx
    } as any);

    lastIndex = element.endIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}

// Get mention suggestions based on partial input
export function getMentionSuggestions(text: string, cursorPosition: number): string | null {
  // Find if cursor is in a mention
  const beforeCursor = text.substring(0, cursorPosition);
  const match = beforeCursor.match(/@(\w*)$/);
  
  return match ? match[1] : null;
}

// Validate mention format
export function isValidMention(mention: string): boolean {
  return /^@\w+$/.test(mention);
}

// Validate hashtag format
export function isValidHashtag(hashtag: string): boolean {
  return /^#[\wáéíóúñÁÉÍÓÚÑ]+$/.test(hashtag);
}