/**
 * Response templates for safety guardrails and common responses
 */

export const RESPONSE_TEMPLATES = {
  safety_redirect: {
    specific_stock: (stock) => `I can teach you how to evaluate ${stock}, but I can't tell you whether to buy it. Here's what to learn:\n\n1. **Company Fundamentals:** Revenue growth, profit margins, debt\n2. **Industry Position:** How does ${stock} compare to competitors?\n3. **Valuation:** Is the price reasonable for earnings?\n\nWant to learn this analysis? 📊`,
    
    crypto: `Cryptocurrency is complex and volatile - not ideal for learning basics. Start with stocks because:\n\n1. Stocks = ownership in real companies (easier to understand)\n2. More regulated and safer for beginners\n3. Build analysis skills that apply everywhere\n\nOnce you master stocks, crypto will be easier. Want stock basics? 📈`,
    
    age_restricted: (strategy) => `${strategy} is advanced and:\n• Requires significant capital\n• High risk of losses\n• Often restricted for under-18\n\nAt your age, focus on:\n1. Long-term investing\n2. Diversification and risk management\n3. Fundamental analysis\n\nWant safer strategies? 🎯`,
    
    parental_guidance: `Great question! Opening a real account requires:\n\n1. **For Under 18:** Custodial account (UGMA/UTMA) by parent/guardian\n2. **Options:** Greenlight, Fidelity Youth, Charles Schwab custodial\n3. **Parent Involvement:** They own it until you're 18-21 (varies by state)\n\nPerfect conversation for parents! Want help explaining? 👨‍👩‍👧‍👦` 
  }
};
