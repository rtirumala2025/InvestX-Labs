import React from 'react';
import Tooltip from '../ui/Tooltip';

const FinancialTerm = ({ term, children, definition }) => {
  const termDefinitions = {
    'budget': 'A plan for how you\'ll spend your money each month. Like a roadmap for your finances.',
    'emergency fund': 'Money set aside for unexpected expenses like car repairs or medical bills. Aim for 3-6 months of expenses.',
    'interest rate': 'The cost of borrowing money, shown as a percentage. Higher rates mean you pay more to borrow.',
    'investment': 'Putting money into something (like stocks or bonds) hoping it will grow over time.',
    'diversification': 'Spreading your money across different types of investments to reduce risk.',
    'compound interest': 'When you earn interest on both your original money and the interest you\'ve already earned. It grows faster over time.',
    'credit score': 'A number (300-850) that shows how trustworthy you are with borrowed money. Higher is better.',
    'APR': 'Annual Percentage Rate - the total cost of borrowing money for a year, including fees.',
    '401(k)': 'A retirement savings account offered by many employers. Money goes in before taxes.',
    'IRA': 'Individual Retirement Account - a personal retirement savings account you can open yourself.',
    'asset': 'Something you own that has value, like a house, car, or money in the bank.',
    'liability': 'Money you owe to someone else, like credit card debt or a loan.',
    'net worth': 'Your total assets minus your total liabilities. Shows your overall financial health.',
    'inflation': 'When prices go up over time, making your money buy less than it used to.',
    'stock': 'A small piece of ownership in a company. If the company does well, your stock might be worth more.',
    'bond': 'A loan you give to a company or government. They pay you back with interest over time.',
    'mutual fund': 'A collection of many different investments managed by professionals.',
    'ETF': 'Exchange-Traded Fund - like a mutual fund but trades like a stock throughout the day.',
    'dividend': 'A payment some companies make to their shareholders from their profits.',
    'capital gains': 'Profit you make when you sell an investment for more than you paid for it.'
  };

  const termKey = term.toLowerCase();
  const tooltipContent = definition || termDefinitions[termKey];

  if (!tooltipContent) {
    return <span>{children}</span>;
  }

  return (
    <Tooltip content={tooltipContent}>
      <span className="underline decoration-dotted decoration-glassAccent/50 underline-offset-2 cursor-help">
        {children}
      </span>
    </Tooltip>
  );
};

export default FinancialTerm;
