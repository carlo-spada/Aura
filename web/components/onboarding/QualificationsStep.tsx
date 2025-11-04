'use client';

import { useState } from 'react';

interface QualificationsData {
  skills?: string[];
  experience?: number;
  education?: string;
  certifications?: string[];
}

interface QualificationsStepProps {
  onNext: (data: { qualifications: QualificationsData }) => void;
  onBack: () => void;
  initialData?: QualificationsData;
  resumeData?: any;
}

export default function QualificationsStep({ onNext, onBack, initialData = {}, resumeData }: QualificationsStepProps) {
  const [qualifications, setQualifications] = useState<QualificationsData>({
    skills: initialData.skills || [],
    experience: initialData.experience || 0,
    education: initialData.education || '',
    certifications: initialData.certifications || [],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ qualifications });
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setQualifications({
        ...qualifications,
        skills: [...(qualifications.skills || []), newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    const skills = [...(qualifications.skills || [])];
    skills.splice(index, 1);
    setQualifications({ ...qualifications, skills });
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setQualifications({
        ...qualifications,
        certifications: [...(qualifications.certifications || []), newCertification.trim()],
      });
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    const certifications = [...(qualifications.certifications || [])];
    certifications.splice(index, 1);
    setQualifications({ ...qualifications, certifications });
  };

  // Suggested skills based on common tech skills
  const suggestedSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker',
    'SQL', 'Git', 'Agile', 'Project Management', 'Data Analysis', 'Machine Learning',
    'UI/UX Design', 'REST APIs', 'GraphQL', 'MongoDB', 'PostgreSQL'
  ].filter(skill => !qualifications.skills?.includes(skill));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Your Qualifications</h2>

        {/* Experience */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={qualifications.experience}
            onChange={(e) => setQualifications({ ...qualifications, experience: Number(e.target.value) })}
          >
            <option value="0">Entry Level (0-1 years)</option>
            <option value="2">Junior (2-3 years)</option>
            <option value="4">Mid-level (4-6 years)</option>
            <option value="7">Senior (7-10 years)</option>
            <option value="11">Expert (10+ years)</option>
          </select>
        </div>

        {/* Education */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Highest Education Level
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={qualifications.education}
            onChange={(e) => setQualifications({ ...qualifications, education: e.target.value })}
          >
            <option value="">Select education level</option>
            <option value="high-school">High School</option>
            <option value="associate">Associate Degree</option>
            <option value="bachelor">Bachelor's Degree</option>
            <option value="master">Master's Degree</option>
            <option value="doctorate">Doctorate</option>
            <option value="bootcamp">Coding Bootcamp</option>
            <option value="self-taught">Self-taught</option>
          </select>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Skills
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add a skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>

          {/* Current Skills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {qualifications.skills?.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="ml-2 text-indigo-500 hover:text-indigo-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Suggested Skills */}
          {suggestedSkills.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Suggested skills:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.slice(0, 8).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setQualifications({
                      ...qualifications,
                      skills: [...(qualifications.skills || []), skill],
                    })}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certifications (optional)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add a certification"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
            />
            <button
              type="button"
              onClick={addCertification}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {qualifications.certifications?.map((cert, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center"
              >
                {cert}
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="ml-2 text-green-500 hover:text-green-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>

        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Complete Setup
        </button>
      </div>
    </form>
  );
}