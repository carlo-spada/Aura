'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CVUploadStepProps {
  onNext: (data: { resumeUrl: string; resumeText?: string }) => void;
  onBack: () => void;
  initialData?: { resumeUrl: string | null };
}

export default function CVUploadStep({ onNext, onBack, initialData }: CVUploadStepProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState(initialData?.resumeUrl || '');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/resume_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setResumeUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    onNext({ resumeUrl: '' });
  };

  const handleContinue = () => {
    if (resumeUrl) {
      onNext({ resumeUrl });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Upload Your Resume</h2>
        <p className="text-gray-600 mb-6">
          Upload your CV or resume so AURA can better understand your experience and match you with relevant opportunities.
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          } ${uploadedFile ? 'bg-green-50 border-green-300' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploadedFile ? (
            <div className="space-y-4">
              <svg className="w-16 h-16 mx-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-600">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Upload a different file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {uploading ? 'Uploading...' : 'Drop your resume here'}
                </p>
                <p className="text-sm text-gray-600 mt-1">or click to browse</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Select File'}
              </button>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT (max 5MB)</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInput}
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>

        <div className="space-x-4">
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!resumeUrl && !uploadedFile}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}