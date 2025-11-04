'use client';

import { useState } from 'react';

interface PreferencesData {
  jobType?: string[];
  location?: string;
  remote?: string;
  salaryMin?: number;
  salaryMax?: number;
  industries?: string[];
  companySize?: string[];
}

interface PreferencesStepProps {
  onNext: (data: { preferences: PreferencesData }) => void;
  initialData?: PreferencesData;
}

export default function PreferencesStep({ onNext, initialData = {} }: PreferencesStepProps) {
  const [preferences, setPreferences] = useState<PreferencesData>({
    jobType: initialData.jobType || [],
    location: initialData.location || '',
    remote: initialData.remote || 'hybrid',
    salaryMin: initialData.salaryMin || 50000,
    salaryMax: initialData.salaryMax || 150000,
    industries: initialData.industries || [],
    companySize: initialData.companySize || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ preferences });
  };

  const toggleArrayItem = (field: 'jobType' | 'industries' | 'companySize', value: string) => {
    const current = preferences[field] || [];
    if (current.includes(value)) {
      setPreferences({
        ...preferences,
        [field]: current.filter(item => item !== value),
      });
    } else {
      setPreferences({
        ...preferences,
        [field]: [...current, value],
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Job Preferences</h2>

        {/* Job Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What type of role are you looking for?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={preferences.jobType?.includes(type) || false}
                  onChange={() => toggleArrayItem('jobType', type)}
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location & Remote */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Location
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., San Francisco, CA"
              value={preferences.location}
              onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remote Preference
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={preferences.remote}
              onChange={(e) => setPreferences({ ...preferences, remote: e.target.value })}
            >
              <option value="onsite">On-site only</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote only</option>
              <option value="flexible">No preference</option>
            </select>
          </div>
        </div>

        {/* Salary Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desired Salary Range (USD)
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Minimum</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={preferences.salaryMin}
                onChange={(e) => setPreferences({ ...preferences, salaryMin: Number(e.target.value) })}
                step="10000"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Maximum</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={preferences.salaryMax}
                onChange={(e) => setPreferences({ ...preferences, salaryMax: Number(e.target.value) })}
                step="10000"
              />
            </div>
          </div>
        </div>

        {/* Industries */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Industries (select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
              'Manufacturing', 'Consulting', 'Media', 'Non-profit', 'Government',
              'Real Estate', 'Transportation'
            ].map(industry => (
              <label key={industry} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={preferences.industries?.includes(industry) || false}
                  onChange={() => toggleArrayItem('industries', industry)}
                />
                <span className="text-sm">{industry}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Company Size */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Company Size
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Startup (1-50)',
              'Small (51-200)',
              'Medium (201-1000)',
              'Large (1000+)'
            ].map(size => (
              <label key={size} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={preferences.companySize?.includes(size) || false}
                  onChange={() => toggleArrayItem('companySize', size)}
                />
                <span className="text-sm">{size}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </form>
  );
}