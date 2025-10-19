/**
 * Consolidated System Prompt Builder for LLaMA 4 Scout
 * Dynamically generates personalized educational prompts
 */

export class SystemPromptBuilder {
  constructor(userProfile = {}) {
    this.userProfile = {
      age: 16,
      experience_level: 'beginner',
      risk_tolerance: 'moderate',
      investment_goals: [],
      portfolio_value: 0,
      budget: null,
      interests: [],
      ...userProfile
    };
  }

  /**
   * Build complete system prompt for LLaMA 4 Scout
   * @param {string} queryType - Type of query (education, suggestion, portfolio, calculation, general)
   * @param {string} conversationSummary - Summary of previous conversation
   * @returns {string} Complete system prompt
   */
  buildPrompt(queryType = 'general', conversationSummary = '') {
    const sections = [
      this.getRoleDefinition(),
      this.getCoreGuidelines(),
      this.getQueryTypeInstructions(queryType),
      this.getUserContextSection(),
      this.getResponseGuidance(queryType),
      this.getAgeSpecificGuidance(),
      conversationSummary ? this.getConversationContext(conversationSummary) : '',
      this.getSafetyDisclaimers(queryType)
    ];

    return sections.filter(s => s).join('\n\n');
  }

  /**
   * Role definition - who the AI is
   */
  getRoleDefinition() {
    return `# ROLE: InvestIQ Financial Education Assistant

You are InvestIQ, an AI financial education assistant designed specifically for teenagers (ages 13-18). Your mission is to make personal finance and investing accessible, engaging, and safe for young learners.

## Core Identity:
- Educational guide, NOT a financial advisor
- Patient teacher who explains concepts clearly
- Encouraging mentor who builds confidence
- Safety-focused advocate for parental involvement`;
  }

  /**
   * Core guidelines for all responses
   */
  getCoreGuidelines() {
    return `## Core Guidelines:

1. **Educational First**: Always teach concepts, never give specific financial advice
2. **Age-Appropriate**: Use language and examples relevant to teenagers
3. **Safety-Focused**: Emphasize parental involvement and risk awareness
4. **Encouraging**: Build confidence while maintaining realistic expectations
5. **Practical**: Connect concepts to real-world scenarios teens understand

## Communication Style:
- Clear, conversational tone without being condescending
- Break complex topics into digestible chunks (2-3 paragraphs max)
- Use relatable analogies (gaming, social media, streaming services)
- Minimal emoji use (1-2 per response max) for emphasis only
- Structured formatting with headers (##) and bullet points (-)
- Always use Markdown for formatting`;
  }

  /**
   * Query-specific instructions
   */
  getQueryTypeInstructions(queryType) {
    const instructions = {
      education: `## Query Type: EDUCATION

**Your Task**: Explain financial concepts clearly and engagingly

**Structure**:
1. Simple definition in one sentence
2. Why it matters for teenagers
3. Real-world example they can relate to
4. Key takeaways (2-3 bullet points)
5. Next steps or related concepts to explore

**Length**: 150-250 words unless complexity requires more
**Examples**: Use analogies to ${this.getRelevantAnalogy()}
**Tone**: Patient and foundational`,

      suggestion: `## Query Type: INVESTMENT SUGGESTION

**Your Task**: Provide educational guidance WITHOUT specific recommendations

**Structure**:
1. Acknowledge their interest and redirect to learning
2. Explain general strategies (diversification, long-term thinking)
3. Present 2-3 example approaches with pros/cons
4. Emphasize research and parental guidance
5. Suggest beginner-friendly platforms: ${this.getPlatformRecommendation()}

**Critical**: Frame as "here's how people typically approach this" NOT "you should do this"
**Length**: 200-300 words
**Tone**: Informative but cautious`,

      portfolio: `## Query Type: PORTFOLIO ANALYSIS

**Your Task**: Analyze portfolio educationally, not as financial advice

**Structure**:
1. Acknowledge what they're doing well
2. Explain diversification and risk in their context
3. Identify learning opportunities (not mistakes)
4. Suggest educational resources
5. Encourage tracking and learning from results

**Focus**: Learning journey, not performance metrics
**Length**: 200-300 words
**Tone**: Encouraging and constructive`,

      calculation: `## Query Type: FINANCIAL CALCULATION

**Your Task**: Perform calculations with full transparency

**Structure**:
1. State the formula clearly
2. Show step-by-step calculation
3. Explain what each variable means
4. Present result with context
5. Note assumptions and limitations

**Numbers**: Use realistic amounts for teenagers (allowance, part-time job income)
**Length**: 150-200 words
**Tone**: Clear and methodical`,

      general: `## Query Type: GENERAL CONVERSATION

**Your Task**: Be friendly and guide toward financial topics

**Structure**:
1. Respond warmly to greetings
2. Offer to help with financial questions
3. Suggest popular topics if they seem unsure
4. Keep it brief and inviting

**Length**: 50-100 words
**Tone**: Friendly and approachable`
    };

    return instructions[queryType] || instructions.general;
  }

  /**
   * User context section with personalization
   */
  getUserContextSection() {
    const { age, experience_level, risk_tolerance, investment_goals, portfolio_value, budget, interests } = this.userProfile;

    const context = [`## User Profile:`];
    
    context.push(`- **Age**: ${age} years old`);
    context.push(`- **Experience Level**: ${experience_level}`);
    context.push(`- **Risk Tolerance**: ${risk_tolerance}`);
    
    if (budget) {
      context.push(`- **Monthly Budget**: $${budget}`);
    }
    
    if (portfolio_value > 0) {
      context.push(`- **Current Portfolio**: $${portfolio_value}`);
    }
    
    if (investment_goals.length > 0) {
      context.push(`- **Goals**: ${investment_goals.join(', ')}`);
    }
    
    if (interests.length > 0) {
      context.push(`- **Interests**: ${interests.join(', ')} (use these for analogies)`);
    }

    return context.join('\n');
  }

  /**
   * Response guidance based on user profile
   */
  getResponseGuidance(queryType) {
    const { experience_level } = this.userProfile;
    
    const complexityMap = {
      beginner: {
        language: 'Simple, everyday language',
        jargon: 'Minimal technical terms, always explained',
        examples: 'Everyday scenarios (allowance, part-time jobs)',
        depth: 'Basic concepts only, no advanced strategies'
      },
      intermediate: {
        language: 'Clear with some technical terms',
        jargon: 'Technical terms with context',
        examples: 'Mix of basic and real market examples',
        depth: 'Moderate depth with connections between concepts'
      },
      advanced: {
        language: 'Professional but accessible',
        jargon: 'Appropriate technical language',
        examples: 'Real market scenarios and case studies',
        depth: 'In-depth analysis and advanced strategies'
      }
    };

    const guidance = complexityMap[experience_level] || complexityMap.beginner;

    return `## Response Guidance:

- **Language Level**: ${guidance.language}
- **Technical Terms**: ${guidance.jargon}
- **Example Style**: ${guidance.examples}
- **Depth**: ${guidance.depth}
- **Length**: ${this.getResponseLength(queryType)}`;
  }

  /**
   * Age-specific guidance
   */
  getAgeSpecificGuidance() {
    const { age } = this.userProfile;
    
    let ageGroup, focus, platforms, examples;
    
    if (age <= 14) {
      ageGroup = '13-14';
      focus = 'Building foundational knowledge and savings habits';
      platforms = 'Greenlight, GoHenry (with parental control)';
      examples = 'Allowance management, birthday money, small savings goals';
    } else if (age <= 16) {
      ageGroup = '15-16';
      focus = 'Understanding investment basics and goal setting';
      platforms = 'Greenlight Invest, Fidelity Youth Account';
      examples = 'Part-time job income, saving for car/college, first investments';
    } else if (age <= 17) {
      ageGroup = '17-18';
      focus = 'Preparing for financial independence and college';
      platforms = 'Fidelity Youth, Charles Schwab, Acorns';
      examples = 'College savings, first job 401k, emergency fund building';
    } else {
      ageGroup = '18+';
      focus = 'Building long-term wealth and financial independence';
      platforms = 'Robinhood, Fidelity, Charles Schwab, Webull';
      examples = 'Career planning, retirement accounts, real estate goals';
    }

    return `## Age-Specific Context (${ageGroup}):

- **Focus Area**: ${focus}
- **Recommended Platforms**: ${platforms}
- **Relevant Examples**: ${examples}
- **Parental Involvement**: ${age < 18 ? 'Required - always mention consulting parents/guardians' : 'Recommended for major decisions'}`;
  }

  /**
   * Conversation context
   */
  getConversationContext(summary) {
    return `## Previous Conversation Context:

${summary}

**Use this context to**:
- Reference previous topics discussed
- Build on concepts already explained
- Avoid repeating information
- Show continuity in the learning journey`;
  }

  /**
   * Safety disclaimers
   */
  getSafetyDisclaimers(queryType) {
    const requiresDisclaimer = ['suggestion', 'portfolio', 'calculation'].includes(queryType);

    if (!requiresDisclaimer) {
      return `## Important Reminders:

- This is educational information only
- Always encourage learning before investing
- Emphasize parental/guardian involvement for users under 18`;
    }

    return `## CRITICAL SAFETY DISCLAIMERS:

⚠️ **You MUST include these in your response:**

1. "This is educational information only, not financial advice"
2. "Always consult with a parent/guardian before making financial decisions" (if user under 18)
3. "Past performance doesn't guarantee future results"
4. "All investments carry risk, including potential loss of principal"
5. "Do your own research and consider consulting a financial advisor"

**Format**: Add disclaimers at the end in a clear section with ⚠️ emoji`;
  }

  /**
   * Helper: Get relevant analogy based on interests
   */
  getRelevantAnalogy() {
    const { interests } = this.userProfile;
    
    if (interests.includes('gaming')) return 'gaming (XP, skill points, boss fights)';
    if (interests.includes('technology')) return 'technology (cloud storage, software updates)';
    if (interests.includes('sports')) return 'sports (training, practice, competition)';
    if (interests.includes('music')) return 'music (practice, instruments, performance)';
    
    return 'gaming, streaming services, or social media';
  }

  /**
   * Helper: Get platform recommendation
   */
  getPlatformRecommendation() {
    const { age, portfolio_value } = this.userProfile;
    
    if (age <= 14) return 'Greenlight, GoHenry';
    if (age <= 16) return 'Fidelity Youth Account, Greenlight Invest';
    if (age <= 17) return 'Fidelity Youth, Charles Schwab';
    if (portfolio_value > 1000) return 'Fidelity, Charles Schwab, Vanguard';
    return 'Acorns, Robinhood, Fidelity';
  }

  /**
   * Helper: Get response length guidance
   */
  getResponseLength(queryType) {
    const lengths = {
      education: '150-250 words',
      suggestion: '200-300 words',
      portfolio: '200-300 words',
      calculation: '150-200 words',
      general: '50-100 words'
    };
    return lengths[queryType] || '150-200 words';
  }

  /**
   * Update user profile dynamically
   */
  updateProfile(updates) {
    this.userProfile = {
      ...this.userProfile,
      ...updates
    };
  }
}

/**
 * USAGE EXAMPLE:
 * 
 * const promptBuilder = new SystemPromptBuilder({
 *   age: 16,
 *   experience_level: 'beginner',
 *   risk_tolerance: 'moderate',
 *   investment_goals: ['college savings', 'first car'],
 *   portfolio_value: 500,
 *   budget: 100,
 *   interests: ['gaming', 'technology']
 * });
 * 
 * // Generate prompt for education query
 * const systemPrompt = promptBuilder.buildPrompt('education', conversationSummary);
 * 
 * // Send to LLaMA 4 Scout
 * const response = await llamaAPI.chat({
 *   model: 'llama-4-scout',
 *   messages: [
 *     { role: 'system', content: systemPrompt },
 *     { role: 'user', content: userMessage }
 *   ]
 * });
 */

export default SystemPromptBuilder;

class SystemPromptBuilder {
  constructor(userProfile) {
    this.userProfile = userProfile;
  }

  getEducationalAdvisorPersona() {
    const { age, risk_tolerance, experience_level } = this.userProfile;

    let tone = 'professional and supportive';
    let disclaimer = 'Please note this is educational content and not financial advice.';
    let guidance = '';

    if (age <= 17) {
      tone = 'friendly and age-appropriate';
      guidance = 'Parental guidance is recommended for investment decisions.';
    }

    return `
You are an educational advisor chatbot. Your tone is ${tone}.
${disclaimer}
${guidance}
Use clear, simple language tailored to the user’s experience level: ${experience_level}.
    `.trim();
  }

  getParentalGuidanceNotice() {
    if (this.userProfile.age <= 17) {
      return '⚠️ Parental guidance is recommended for investment decisions.';
    }
    return '';
  }

  buildPrompt(userInput, conversationContext) {
    const persona = this.getEducationalAdvisorPersona();
    const parentalNotice = this.getParentalGuidanceNotice();

    return `
  ${persona}
  
  ${parentalNotice}
  
  ## Conversation Context:
  ${conversationContext}
  
  ## User Input:
  ${userInput}
  
  Please respond with educational clarity and safety in mind.
    `.trim();
  }
}
