'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  match_score: number;
  key_matches?: string[];
  posted_date?: string;
  description?: string;
  url?: string;
  applications?: any[];
}

interface JobCardProps {
  job: Job;
  hasApplied: boolean;
}

export default function JobCard({ job, hasApplied }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error applying to job:', error);
    }
    setIsApplying(false);
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <p className="text-gray-600">{job.company}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getMatchColor(job.match_score)}`}>
            {job.match_score}% match
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <span className="mr-2">📍</span>
            {job.location}
          </div>
          <div className="flex items-center">
            <span className="mr-2">💰</span>
            {formatSalary(job.salary_min, job.salary_max)}
          </div>
          {job.job_type && (
            <div className="flex items-center">
              <span className="mr-2">💼</span>
              {job.job_type}
            </div>
          )}
          {job.posted_date && (
            <div className="flex items-center">
              <span className="mr-2">📅</span>
              {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Key Matches */}
        {job.key_matches && job.key_matches.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Why it matches:</div>
            <div className="flex flex-wrap gap-2">
              {job.key_matches.slice(0, 3).map((match, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                >
                  {match}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expandable Description */}
        {job.description && (
          <div className="mb-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
            {isExpanded && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-4">
                {job.description}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {hasApplied ? (
            <button
              disabled
              className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium cursor-not-allowed"
            >
              ✓ Applied
            </button>
          ) : (
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isApplying ? 'Applying...' : 'Quick Apply'}
            </button>
          )}

          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              View →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}