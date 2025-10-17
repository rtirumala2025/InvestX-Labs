/**
 * Formats AI responses consistently based on query type and content
 */

// Formatting templates for different response types
const RESPONSE_TEMPLATES = {
  education: {
    header: '📚 {title}',
    sections: [
      '## 📖 Explanation',
      '{explanation}',
      '## 💡 Example',
      '{example}',
      '## 🔍 Key Points',
      '{keyPoints}'
    ],
    footer: '\n*Remember: This is educational content, not financial advice.*'
  },
  
  suggestion: {
    header: '💡 {title}',
    sections: [
      '## 📊 Overview',
      '{overview}',
      '## 🔍 Considerations',
      '{considerations}',
      '## ⚠️ Important Reminder',
      '{disclaimer}'
    ],
    footer: '\n*Always do your own research and consult with a financial advisor before making investment decisions.*'
  },
  
  portfolio: {
    header: '📊 Portfolio Analysis',
    sections: [
      '## 📈 Performance',
      '{performance}',
      '## ⚖️ Diversification',
      '{diversification}',
      '## 📋 Suggestions',
      '{suggestions}'
    ],
    footer: '\n*Portfolio analysis is based on the information provided and is for educational purposes only.*'
  },
  
  calculation: {
    header: '🧮 {title}',
    sections: [
      '## 🔢 Calculation',
      '{formula}',
      '## 📝 Step-by-Step',
      '{steps}',
      '## 💰 Result',
      '{result}'
    ],
    footer: '\n*This is a simplified calculation. Actual results may vary based on market conditions and fees.*'
  },
  
  general: {
    header: '{title}',
    sections: ['{content}'],
    footer: ''
  }
};

// Default template if no specific type matches
const DEFAULT_TEMPLATE = RESPONSE_TEMPLATES.general;

/**
 * Formats a response based on its type and content
 * @param {Object} response - The raw response from the AI
 * @param {string} queryType - The type of query
 * @returns {string} Formatted response
 */
export function formatResponse(response, queryType = 'general') {
  const template = RESPONSE_TEMPLATES[queryType] || DEFAULT_TEMPLATE;
  
  // Handle response object with type and data
  if (response && typeof response === 'object' && response.type && response.data) {
    return formatStructuredResponse(response, queryType);
  }
  
  // Extract content from response
  const { content, metadata = {} } = typeof response === 'string' 
    ? { content: response } 
    : response;
  
  // If content is already formatted, return as is
  if (content && content.includes('## ')) {
    return content;
  }
  
  // Simple formatting for general responses
  if (queryType === 'general') {
    return formatGeneralResponse(content || '');
  }
  
  // For other types, use template
  return applyTemplate(template, content || '', metadata);
}

/**
 * Formats a structured response object
 */
function formatStructuredResponse(response, queryType) {
  const { type, data } = response;
  const template = RESPONSE_TEMPLATES[type] || RESPONSE_TEMPLATES[queryType] || DEFAULT_TEMPLATE;
  
  let result = [];
  
  // Add header
  if (template.header && data.title) {
    result.push(replacePlaceholders(template.header, data));
    result.push('');
  }
  
  // Add sections based on data
  if (type === 'education') {
    if (data.explanation) {
      result.push('## 📖 Explanation');
      result.push(data.explanation);
      result.push('');
    }
    if (data.example) {
      result.push('## 💡 Example');
      result.push(data.example);
      result.push('');
    }
    if (data.keyPoints && data.keyPoints.length > 0) {
      result.push('## 🔍 Key Points');
      data.keyPoints.forEach(point => result.push(`- ${point}`));
      result.push('');
    }
  } else if (type === 'suggestion') {
    if (data.overview) {
      result.push('## 📊 Overview');
      result.push(data.overview);
      result.push('');
    }
    if (data.considerations) {
      result.push('## 🔍 Considerations');
      result.push(data.considerations);
      result.push('');
    }
    if (data.disclaimer) {
      result.push('## ⚠️ Important Reminder');
      result.push(data.disclaimer);
      result.push('');
    }
  }
  
  // Add footer
  if (template.footer) {
    result.push(template.footer);
  }
  
  return result.join('\n').trim();
}

/**
 * Applies a template to format the response
 */
function applyTemplate(template, content, metadata = {}) {
  let result = [];
  
  // Add header if exists
  if (template.header) {
    result.push(replacePlaceholders(template.header, metadata));
    result.push(''); // Empty line after header
  }
  
  // Process sections
  for (let i = 0; i < template.sections.length; i++) {
    const section = template.sections[i];
    const nextSection = template.sections[i + 1];
    
    // Skip empty sections
    if (section.includes('{content}')) {
      result.push(replacePlaceholders(section, { content }));
      continue;
    }
    
    // For other sections, try to extract content
    const sectionName = section.match(/##\s*(.*?)$/m)?.[1].toLowerCase() || '';
    let sectionContent = '';
    
    // Try to find section content in the response
    const sectionMatch = new RegExp(`##\s*${sectionName}[\s\S]*?(?=##|$)`, 'i');
    const match = content.match(sectionMatch);
    
    if (match) {
      sectionContent = match[0].replace(/^##.*?\n/, '').trim();
    } else if (section.includes('{') && section.includes('}')) {
      // If no section found but template has placeholders, try to extract from metadata
      sectionContent = replacePlaceholders(section, metadata);
    }
    
    if (sectionContent) {
      result.push(section);
      result.push('');
      result.push(sectionContent);
      result.push('');
    }
  }
  
  // Add footer if exists
  if (template.footer) {
    result.push(replacePlaceholders(template.footer, metadata));
  }
  
  return result.join('\n').trim();
}

/**
 * Replaces placeholders in a string with values from context
 */
function replacePlaceholders(template, context = {}) {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = context[key.trim()];
    return value !== undefined ? value : match;
  });
}

/**
 * Formats a general response with basic markdown
 */
function formatGeneralResponse(content) {
  // Simple formatting for lists
  if (content.includes('\n- ')) {
    return content;
  }
  
  // Add paragraph breaks for long text
  const sentences = content.split(/(?<=[.!?])\s+/);
  if (sentences.length > 3) {
    const mid = Math.ceil(sentences.length / 2);
    return `${sentences.slice(0, mid).join(' ')}

${sentences.slice(mid).join(' ')}`;
  }
  
  return content;
}

/**
 * Extracts structured data from a response
 */
export function extractStructuredData(response) {
  if (!response) return {};
  
  const result = {
    summary: '',
    keyPoints: [],
    links: [],
    calculations: []
  };
  
  // Simple extraction of key points (lines starting with •, -, or *)
  const keyPointRegex = /^[•\-*]\s*(.+)$/gm;
  let match;
  while ((match = keyPointRegex.exec(response)) !== null) {
    result.keyPoints.push(match[1]);
  }
  
  // Extract links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = linkRegex.exec(response)) !== null) {
    result.links.push({
      text: match[1],
      url: match[2]
    });
  }
  
  // Extract calculations (simple pattern matching)
  const calcRegex = /(?:\$?\d+(?:\.\d+)?\s*[+\-*/]\s*)+\$?\d+(?:\.\d+)?\s*=\s*\$?\d+(?:\.\d+)?/g;
  while ((match = calcRegex.exec(response)) !== null) {
    result.calculations.push(match[0]);
  }
  
  // Use first 2 sentences as summary if no explicit summary
  if (!result.summary) {
    const sentences = response.split(/(?<=[.!?])\s+/);
    result.summary = sentences.slice(0, 2).join(' ');
  }
  
  return result;
}

/**
 * Formats a calculation response
 */
export function formatCalculation(calculation) {
  const { formula, steps, result, variables = {} } = calculation;
  
  return `## 🧮 Calculation: ${formula}

### 📝 Steps:
${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

### 💰 Result:
${result}

*Values used: ${Object.entries(variables).map(([k, v]) => `${k} = ${v}`).join(', ')}*`;
}
