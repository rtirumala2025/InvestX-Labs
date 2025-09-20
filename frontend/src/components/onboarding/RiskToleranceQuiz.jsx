import React, { useState } from 'react';

const RiskToleranceQuiz = ({ onNext, onBack, userData, setUserData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 'time_horizon',
      question: 'What is your primary investment time horizon?',
      options: [
        { value: 'conservative', text: 'Less than 2 years', score: 1 },
        { value: 'moderate', text: '2-5 years', score: 2 },
        { value: 'balanced', text: '5-10 years', score: 3 },
        { value: 'aggressive', text: 'More than 10 years', score: 4 }
      ]
    },
    {
      id: 'loss_tolerance',
      question: 'How would you react if your portfolio lost 20% of its value in a month?',
      options: [
        { value: 'conservative', text: 'Sell everything immediately', score: 1 },
        { value: 'moderate', text: 'Sell some investments to reduce risk', score: 2 },
        { value: 'balanced', text: 'Hold and wait for recovery', score: 3 },
        { value: 'aggressive', text: 'Buy more while prices are low', score: 4 }
      ]
    },
    {
      id: 'investment_purpose',
      question: 'What is your primary investment goal?',
      options: [
        { value: 'conservative', text: 'Preserve capital with steady income', score: 1 },
        { value: 'moderate', text: 'Moderate growth with some income', score: 2 },
        { value: 'balanced', text: 'Balanced growth and income', score: 3 },
        { value: 'aggressive', text: 'Maximum long-term growth', score: 4 }
      ]
    },
    {
      id: 'volatility_comfort',
      question: 'How comfortable are you with investment volatility?',
      options: [
        { value: 'conservative', text: 'Very uncomfortable - prefer stability', score: 1 },
        { value: 'moderate', text: 'Somewhat uncomfortable', score: 2 },
        { value: 'balanced', text: 'Moderately comfortable', score: 3 },
        { value: 'aggressive', text: 'Very comfortable - volatility means opportunity', score: 4 }
      ]
    },
    {
      id: 'knowledge_level',
      question: 'How would you describe your investment knowledge?',
      options: [
        { value: 'conservative', text: 'Beginner - need guidance', score: 1 },
        { value: 'moderate', text: 'Some knowledge - learning more', score: 2 },
        { value: 'balanced', text: 'Intermediate - understand basics', score: 3 },
        { value: 'aggressive', text: 'Advanced - comfortable with complex strategies', score: 4 }
      ]
    }
  ];

  const handleAnswer = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate risk tolerance
      const totalScore = Object.values(answers).reduce((sum, answer) => sum + answer.score, 0);
      const averageScore = totalScore / questions.length;
      
      let riskProfile;
      if (averageScore <= 1.5) {
        riskProfile = 'conservative';
      } else if (averageScore <= 2.5) {
        riskProfile = 'moderate';
      } else if (averageScore <= 3.5) {
        riskProfile = 'balanced';
      } else {
        riskProfile = 'aggressive';
      }

      setUserData({ ...userData, riskProfile, riskAnswers: answers });
      onNext();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      onBack();
    }
  };

  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQ.id];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Risk Tolerance Assessment</h2>
        <p className="text-gray-600">Help us understand your investment risk preferences</p>
        <div className="mt-4">
          <div className="flex justify-center">
            <div className="flex space-x-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentQuestion
                      ? 'bg-blue-600'
                      : index < currentQuestion
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {currentQ.question}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <label
              key={index}
              className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                currentAnswer?.value === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={currentQ.id}
                value={option.value}
                checked={currentAnswer?.value === option.value}
                onChange={() => handleAnswer(currentQ.id, option)}
                className="sr-only"
              />
              <span className="text-gray-900">{option.text}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currentQuestion === 0 ? 'Back' : 'Previous'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentAnswer}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion === questions.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskToleranceQuiz;
