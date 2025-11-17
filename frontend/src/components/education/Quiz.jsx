import React, { useState } from "react";

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const questions = [
    {
      question: "What is the primary benefit of portfolio diversification?",
      options: [
        "Higher returns",
        "Reduced risk",
        "Lower taxes",
        "Faster growth",
      ],
      correct: 1,
    },
    {
      question: "Which of the following is NOT a type of investment risk?",
      options: ["Market risk", "Credit risk", "Liquidity risk", "Weather risk"],
      correct: 3,
    },
  ];

  const handleAnswer = (questionIndex, answerIndex) => {
    setAnswers({ ...answers, [questionIndex]: answerIndex });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const score = Object.keys(answers).reduce((acc, key) => {
    return acc + (answers[key] === questions[key].correct ? 1 : 0);
  }, 0);

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Quiz Results
          </h1>
          <p className="text-2xl text-blue-600 mb-4">
            {score}/{questions.length}
          </p>
          <p className="text-gray-600 mb-6">
            You scored {Math.round((score / questions.length) * 100)}%
          </p>
          <button
            onClick={() => {
              setCurrentQuestion(0);
              setAnswers({});
              setShowResults(false);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Investment Knowledge Quiz
        </h1>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {questions[currentQuestion].question}
        </h2>
        <div className="space-y-3 mb-6">
          {questions[currentQuestion].options.map((option, index) => (
            <label
              key={index}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="answer"
                checked={answers[currentQuestion] === index}
                onChange={() => handleAnswer(currentQuestion, index)}
                className="mr-3"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={answers[currentQuestion] === undefined}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestion === questions.length - 1
            ? "Finish Quiz"
            : "Next Question"}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
