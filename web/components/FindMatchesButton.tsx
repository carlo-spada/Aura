'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FindMatchesButtonProps {
  hasReachedLimit: boolean;
  userId: string;
}

export default function FindMatchesButton({ hasReachedLimit, userId }: FindMatchesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFindMatches = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/find-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError(`You've reached your monthly limit of ${data.limit} job matches. Upgrade to get more!`);
        } else {
          setError(data.error || 'Failed to find job matches');
        }
        return;
      }

      // Refresh the page to show new jobs
      router.refresh();

      // Show success message
      const jobCount = data.jobs?.length || 0;
      if (jobCount > 0) {
        alert(`Found ${jobCount} new job matches!`);
      } else {
        setError('No new matches found at this time. Try again later.');
      }
    } catch (err) {
      console.error('Error finding matches:', err);
      setError('An error occurred while finding job matches');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleFindMatches}
        disabled={hasReachedLimit || isLoading}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          hasReachedLimit || isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isLoading ? 'Finding matches...' : '🔍 Find New Matches'}
      </button>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
              {hasReachedLimit && (
                <a href="/pricing" className="text-sm underline mt-2 inline-block">
                  Upgrade your plan →
                </a>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}