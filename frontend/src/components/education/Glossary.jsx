import React, { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const Glossary = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const glossaryTerms = {
    all: [
      { term: 'Budget', definition: 'A plan for how you\'ll spend your money each month. Like a roadmap for your finances.', category: 'basics' },
      { term: 'Emergency Fund', definition: 'Money set aside for unexpected expenses like car repairs or medical bills. Aim for 3-6 months of expenses.', category: 'saving' },
      { term: 'Interest Rate', definition: 'The cost of borrowing money, shown as a percentage. Higher rates mean you pay more to borrow.', category: 'debt' },
      { term: 'Investment', definition: 'Putting money into something (like stocks or bonds) hoping it will grow over time.', category: 'investing' },
      { term: 'Diversification', definition: 'Spreading your money across different types of investments to reduce risk.', category: 'investing' },
      { term: 'Compound Interest', definition: 'When you earn interest on both your original money and the interest you\'ve already earned. It grows faster over time.', category: 'investing' },
      { term: 'Credit Score', definition: 'A number (300-850) that shows how trustworthy you are with borrowed money. Higher is better.', category: 'credit' },
      { term: 'APR', definition: 'Annual Percentage Rate - the total cost of borrowing money for a year, including fees.', category: 'debt' },
      { term: '401(k)', definition: 'A retirement savings account offered by many employers. Money goes in before taxes.', category: 'retirement' },
      { term: 'IRA', definition: 'Individual Retirement Account - a personal retirement savings account you can open yourself.', category: 'retirement' },
      { term: 'Asset', definition: 'Something you own that has value, like a house, car, or money in the bank.', category: 'basics' },
      { term: 'Liability', definition: 'Money you owe to someone else, like credit card debt or a loan.', category: 'debt' },
      { term: 'Net Worth', definition: 'Your total assets minus your total liabilities. Shows your overall financial health.', category: 'basics' },
      { term: 'Inflation', definition: 'When prices go up over time, making your money buy less than it used to.', category: 'basics' },
      { term: 'Stock', definition: 'A small piece of ownership in a company. If the company does well, your stock might be worth more.', category: 'investing' },
      { term: 'Bond', definition: 'A loan you give to a company or government. They pay you back with interest over time.', category: 'investing' },
      { term: 'Mutual Fund', definition: 'A collection of many different investments managed by professionals.', category: 'investing' },
      { term: 'ETF', definition: 'Exchange-Traded Fund - like a mutual fund but trades like a stock throughout the day.', category: 'investing' },
      { term: 'Dividend', definition: 'A payment some companies make to their shareholders from their profits.', category: 'investing' },
      { term: 'Capital Gains', definition: 'Profit you make when you sell an investment for more than you paid for it.', category: 'investing' }
    ]
  };

  const categories = [
    { id: 'all', label: 'All Terms' },
    { id: 'basics', label: 'Basics' },
    { id: 'saving', label: 'Saving' },
    { id: 'debt', label: 'Debt' },
    { id: 'investing', label: 'Investing' },
    { id: 'credit', label: 'Credit' },
    { id: 'retirement', label: 'Retirement' }
  ];

  const filteredTerms = glossaryTerms.all.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard 
        className="w-full max-w-4xl max-h-[80vh] overflow-hidden"
        variant="default"
        padding="large"
        shadow="xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-title"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="glossary-title" className="text-2xl font-bold text-glassText">
              Financial Terms Glossary
            </h2>
            <GlassButton
              onClick={onClose}
              variant="ghost"
              size="small"
              aria-label="Close glossary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </GlassButton>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-glassBg border border-glassBorder rounded-lg text-glassText placeholder-glassTextMuted focus:outline-none focus:ring-2 focus:ring-glassAccent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-glassBg border border-glassBorder rounded-lg text-glassText focus:outline-none focus:ring-2 focus:ring-glassAccent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Terms List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {filteredTerms.map((term, index) => (
                <div key={index} className="p-4 bg-glassBgLight rounded-lg border border-glassBorderLight">
                  <h3 className="font-semibold text-glassText mb-2">{term.term}</h3>
                  <p className="text-glassTextSecondary">{term.definition}</p>
                </div>
              ))}
              {filteredTerms.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-glassTextSecondary">No terms found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-glassBorder">
            <p className="text-sm text-glassTextMuted text-center">
              Don't see a term you're looking for? Let us know and we'll add it!
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Glossary;
