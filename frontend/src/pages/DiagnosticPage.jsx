import React, { useEffect, useState } from 'react';
import DiagnosticFlow from '../components/diagnostic/DiagnosticFlow';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import Modal from '../components/ui/Modal';

// Task 28: Save/Resume functionality for diagnostic
const saveDiagnosticProgress = (currentStep, answers) => {
  try {
    localStorage.setItem('diagnostic-progress', JSON.stringify({
      currentStep,
      answers,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save diagnostic progress:', error);
  }
};

const loadDiagnosticProgress = () => {
  try {
    const saved = localStorage.getItem('diagnostic-progress');
    if (saved) {
      const data = JSON.parse(saved);
      const age = Date.now() - (data.timestamp || 0);
      if (age < 24 * 60 * 60 * 1000) {
        return data;
      } else {
        localStorage.removeItem('diagnostic-progress');
      }
    }
  } catch (error) {
    console.error('Failed to load diagnostic progress:', error);
  }
  return null;
};

// Task 28: Results Summary Component
const ResultsSummary = ({ results, onClose }) => {
  if (!results) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Your Investment Profile" size="large">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Risk Tolerance</h3>
          <p className="text-white/80">{results.riskTolerance || 'Moderate'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Investment Style</h3>
          <p className="text-white/80">{results.style || 'Balanced'}</p>
        </div>
        {results.goals && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Primary Goals</h3>
            <ul className="list-disc list-inside text-white/80 space-y-2">
              {Array.isArray(results.goals) ? results.goals.map((goal, i) => (
                <li key={i}>{goal}</li>
              )) : <li>{results.goals}</li>}
            </ul>
          </div>
        )}
        <div className="flex justify-end">
          <GlassButton variant="primary" onClick={onClose}>
            Continue
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
};

const DiagnosticPage = () => {
  const [hasResumed, setHasResumed] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  // Task 28: Load saved progress on mount
  useEffect(() => {
    const progress = loadDiagnosticProgress();
    if (progress) {
      setSavedProgress(progress);
    }
  }, []);

  return (
    <>
      {/* Task 28: Resume prompt */}
      {savedProgress && !hasResumed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <GlassCard variant="accent" padding="large" glow className="max-w-md w-full mx-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-2">Resume Diagnostic</h3>
              <p className="text-white/70 text-sm">
                You have saved progress from {new Date(savedProgress.timestamp).toLocaleString()}
              </p>
              <div className="flex gap-3">
                <GlassButton
                  variant="glass"
                  onClick={() => {
                    localStorage.removeItem('diagnostic-progress');
                    setSavedProgress(null);
                  }}
                  className="flex-1"
                >
                  Start Fresh
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={() => setHasResumed(true)}
                  className="flex-1"
                >
                  Resume
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <DiagnosticFlow
        savedProgress={hasResumed ? savedProgress : null}
        onProgressChange={(step, answers) => saveDiagnosticProgress(step, answers)}
        onComplete={(results) => {
          setResults(results);
          setShowResults(true);
          localStorage.removeItem('diagnostic-progress');
        }}
      />

      {showResults && (
        <ResultsSummary
          results={results}
          onClose={() => {
            setShowResults(false);
            setResults(null);
          }}
        />
      )}
    </>
  );
};

export default DiagnosticPage;
