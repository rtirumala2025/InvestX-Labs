import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { useFirestore } from '../../hooks/useFirestore';

const DiagnosticFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const { addDocument } = useFirestore('userDiagnostics');
  const navigate = useNavigate();

  const steps = [
    {
      id: 'goals',
      title: 'What are your main money goals?',
      subtitle: 'Choose what matters most to you right now',
      options: [
        { id: 'save_emergency', label: 'Build an emergency fund', description: 'Save 3-6 months of expenses for unexpected situations' },
        { id: 'save_purchase', label: 'Save for a big purchase', description: 'House, car, vacation, or other major expense' },
        { id: 'pay_debt', label: 'Pay off debt faster', description: 'Credit cards, student loans, or other debts' },
        { id: 'invest_grow', label: 'Start investing', description: 'Grow money for long-term goals like retirement' },
        { id: 'budget_better', label: 'Budget better', description: 'Track spending and manage money more effectively' }
      ]
    },
    {
      id: 'situation',
      title: 'What\'s your current money situation?',
      subtitle: 'Help us understand where you\'re starting from',
      options: [
        { id: 'student', label: 'Student', description: 'Limited income, focusing on learning and future planning' },
        { id: 'entry_level', label: 'Just starting out', description: 'First job, building financial foundation' },
        { id: 'stable_income', label: 'Stable income', description: 'Regular paycheck, ready to optimize finances' },
        { id: 'variable_income', label: 'Variable income', description: 'Freelance, commission, or irregular income' },
        { id: 'established', label: 'Established career', description: 'Good income, looking to maximize wealth building' }
      ]
    },
    {
      id: 'confidence',
      title: 'How confident do you feel about money topics?',
      subtitle: 'Rate your comfort level with these areas',
      type: 'rating',
      topics: [
        { id: 'budgeting', label: 'Creating and sticking to a budget' },
        { id: 'saving', label: 'Building savings and emergency funds' },
        { id: 'investing', label: 'Understanding investments and markets' },
        { id: 'debt', label: 'Managing and paying off debt' },
        { id: 'retirement', label: 'Planning for retirement' }
      ]
    }
  ];

  const handleAnswer = (stepId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [stepId]: answer
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save diagnostic results
      await addDocument({
        ...answers,
        completedAt: new Date(),
        userId: 'current-user' // This would come from auth context
      });
      
      // Navigate to personalized dashboard
      navigate('/dashboard', { 
        state: { 
          diagnosticComplete: true,
          answers 
        } 
      });
    } catch (error) {
      console.error('Error saving diagnostic:', error);
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = steps[currentStep];
  const canProceed = answers[currentStepData.id] !== undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-glassAccent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-glassText">Creating your personalized plan...</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-glassAccent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-glass-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-glass-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-glassText">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-glassTextSecondary">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-glassBg rounded-full h-2">
              <div
                className="bg-glassAccent h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <GlassCard className="p-8" variant="default" padding="large" shadow="xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-glassText mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-glassTextSecondary">
                {currentStepData.subtitle}
              </p>
            </div>

            {currentStepData.type === 'rating' ? (
              <div className="space-y-6">
                {currentStepData.topics.map((topic) => (
                  <div key={topic.id} className="space-y-3">
                    <label className="block text-glassText font-medium">
                      {topic.label}
                    </label>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-glassTextSecondary">Not confident</span>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleAnswer(currentStepData.id, {
                              ...answers[currentStepData.id],
                              [topic.id]: rating
                            })}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              answers[currentStepData.id]?.[topic.id] >= rating
                                ? 'bg-glassAccent border-glassAccent text-white'
                                : 'border-glassBorder text-glassTextSecondary hover:border-glassAccent'
                            }`}
                            aria-label={`Rate ${topic.label} as ${rating} out of 5`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-glassTextSecondary">Very confident</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentStepData.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(currentStepData.id, option.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      answers[currentStepData.id] === option.id
                        ? 'border-glassAccent bg-glassAccent/10'
                        : 'border-glassBorder hover:border-glassAccent/50'
                    }`}
                  >
                    <div className="font-medium text-glassText mb-1">
                      {option.label}
                    </div>
                    <div className="text-sm text-glassTextSecondary">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <GlassButton
                onClick={handleBack}
                variant="outline"
                disabled={currentStep === 0}
              >
                Back
              </GlassButton>
              
              <GlassButton
                onClick={handleNext}
                variant="primary"
                disabled={!canProceed}
              >
                {currentStep === steps.length - 1 ? 'Get My Plan' : 'Next'}
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticFlow;
