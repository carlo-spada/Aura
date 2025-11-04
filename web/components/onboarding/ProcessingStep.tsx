'use client';

import { useEffect, useState } from 'react';

interface ProcessingStepProps {
  onComplete: () => void;
  userData: any;
}

export default function ProcessingStep({ onComplete, userData }: ProcessingStepProps) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('Initializing...');

  useEffect(() => {
    // Simulate processing with progress updates
    const tasks = [
      { message: 'Analyzing your preferences...', duration: 2000 },
      { message: 'Processing your qualifications...', duration: 2000 },
      { message: 'Matching with job opportunities...', duration: 3000 },
      { message: 'Generating personalized recommendations...', duration: 2000 },
      { message: 'Finalizing your profile...', duration: 1000 },
    ];

    let currentProgress = 0;
    const progressIncrement = 100 / tasks.length;

    tasks.forEach((task, index) => {
      setTimeout(() => {
        setCurrentTask(task.message);
        currentProgress += progressIncrement;
        setProgress(Math.min(currentProgress, 100));

        if (index === tasks.length - 1) {
          setTimeout(() => {
            onComplete();
          }, task.duration);
        }
      }, tasks.slice(0, index).reduce((acc, t) => acc + t.duration, 0));
    });
  }, [onComplete]);

  return (
    <div className="space-y-8">
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="text-center">
          <div className="mb-8">
            {/* Animated AURA Logo/Icon */}
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-indigo-300 rounded-full animate-ping opacity-20 animation-delay-200"></div>
              <div className="relative w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AURA is preparing your personalized job matches
            </h2>
            <p className="text-gray-600 mb-8">
              This will just take a moment while we analyze thousands of opportunities
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-600 animate-pulse">{currentTask}</p>

          {/* Fun Facts */}
          <div className="mt-12 p-6 bg-indigo-50 rounded-lg">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3">Did you know?</h3>
            <div className="space-y-2 text-sm text-indigo-700">
              <p>✨ AURA uses advanced AI to match you with jobs that align with your skills and career goals</p>
              <p>🎯 Our users see an average 3x increase in interview callbacks</p>
              <p>🚀 AURA can generate tailored cover letters in seconds</p>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {userData.subscription_tier === 'free' ? (
                <>
                  You're on the <span className="font-semibold">Free plan</span> with 2 job matches per month.
                  <br />
                  <a href="/pricing" className="text-indigo-600 hover:text-indigo-700">
                    Upgrade anytime
                  </a> for more matches and features.
                </>
              ) : userData.subscription_tier === 'plus' ? (
                <>
                  You're on the <span className="font-semibold text-blue-600">Plus plan</span> with 6 job matches per month.
                </>
              ) : (
                <>
                  You're on the <span className="font-semibold text-purple-600">Premium plan</span> with unlimited job matches!
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}