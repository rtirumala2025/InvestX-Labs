import React, { useState } from 'react';
import OnboardingTooltip from './OnboardingTooltip';

/**
 * Example usage of OnboardingTooltip component
 * 
 * This demonstrates how to integrate OnboardingTooltip into your onboarding flow.
 * You can use this as a reference for implementing tooltips in your onboarding steps.
 */
const OnboardingTooltipExample = () => {
  const [currentTooltip, setCurrentTooltip] = useState(0);
  
  const tooltips = [
    {
      id: 'welcome-tooltip',
      targetId: 'welcome-section',
      title: 'Welcome to InvestX Labs!',
      content: 'This is your dashboard where you can track your portfolio and get investment insights.',
      position: 'bottom',
      stepNumber: 1,
      totalSteps: 3,
    },
    {
      id: 'portfolio-tooltip',
      targetId: 'portfolio-section',
      title: 'Your Portfolio',
      content: 'Here you can see all your investments and their current performance.',
      position: 'right',
      stepNumber: 2,
      totalSteps: 3,
    },
    {
      id: 'suggestions-tooltip',
      targetId: 'suggestions-section',
      title: 'AI Suggestions',
      content: 'Get personalized investment recommendations powered by AI.',
      position: 'left',
      stepNumber: 3,
      totalSteps: 3,
    },
  ];

  const handleNext = () => {
    if (currentTooltip < tooltips.length - 1) {
      setCurrentTooltip(currentTooltip + 1);
    } else {
      setCurrentTooltip(null);
    }
  };

  const handlePrevious = () => {
    if (currentTooltip > 0) {
      setCurrentTooltip(currentTooltip - 1);
    }
  };

  const handleDismiss = (id) => {
    console.log(`Tooltip ${id} dismissed`);
    setCurrentTooltip(null);
  };

  const currentTooltipData = tooltips[currentTooltip];

  return (
    <div>
      {/* Example sections with IDs for tooltips to target */}
      <section id="welcome-section" className="p-8">
        <h2>Welcome Section</h2>
        <p>This section can be highlighted by a tooltip.</p>
      </section>

      <section id="portfolio-section" className="p-8">
        <h2>Portfolio Section</h2>
        <p>This section can be highlighted by a tooltip.</p>
      </section>

      <section id="suggestions-section" className="p-8">
        <h2>Suggestions Section</h2>
        <p>This section can be highlighted by a tooltip.</p>
      </section>

      {/* Tooltip component */}
      {currentTooltipData && (
        <OnboardingTooltip
          {...currentTooltipData}
          isVisible={true}
          onNext={handleNext}
          onPrevious={currentTooltip > 0 ? handlePrevious : undefined}
          onDismiss={handleDismiss}
        />
      )}

      {/* Control buttons for demo */}
      <div className="p-8">
        <button onClick={() => setCurrentTooltip(0)}>
          Show First Tooltip
        </button>
      </div>
    </div>
  );
};

export default OnboardingTooltipExample;

