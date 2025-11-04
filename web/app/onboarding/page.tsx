'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PreferencesStep from '@/components/onboarding/PreferencesStep';
import CVUploadStep from '@/components/onboarding/CVUploadStep';
import QualificationsStep from '@/components/onboarding/QualificationsStep';
import ProcessingStep from '@/components/onboarding/ProcessingStep';

const ONBOARDING_STEPS = [
  { id: 1, name: 'Preferences', description: 'Tell us what you\'re looking for' },
  { id: 2, name: 'Resume', description: 'Upload your CV or resume' },
  { id: 3, name: 'Qualifications', description: 'Confirm your skills and experience' },
  { id: 4, name: 'Processing', description: 'We\'re finding your matches' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<any>({
    preferences: {},
    qualifications: {},
    resumeUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check if user already completed onboarding
    const { data: userData } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_step')
      .eq('id', user.id)
      .single();

    if (userData?.onboarding_completed) {
      router.push('/dashboard');
    } else if (userData?.onboarding_step) {
      setCurrentStep(userData.onboarding_step);
    }
  };

  const updateProgress = async (step: number, completed: boolean = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.rpc('update_onboarding_progress', {
      user_id: user.id,
      step: step,
      completed: completed,
    });
  };

  const handleNextStep = async (data: any) => {
    setUserData({ ...userData, ...data });

    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateProgress(nextStep);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Save all user data
      const { error } = await supabase
        .from('users')
        .update({
          preferences: userData.preferences,
          qualifications: userData.qualifications,
          resume_url: userData.resumeUrl,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Start initial job search
      await fetch('/api/jobs/initial-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to AURA</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between">
              {ONBOARDING_STEPS.map((step, index) => (
                <div key={step.id} className="flex-1">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep >= step.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="mt-2 text-xs text-center">
                      <div className="font-medium text-gray-900">{step.name}</div>
                      <div className="text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 ${
                        currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                      style={{ transform: 'translateX(50%)' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && (
          <PreferencesStep
            onNext={handleNextStep}
            initialData={userData.preferences}
          />
        )}

        {currentStep === 2 && (
          <CVUploadStep
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            initialData={{ resumeUrl: userData.resumeUrl }}
          />
        )}

        {currentStep === 3 && (
          <QualificationsStep
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            initialData={userData.qualifications}
            resumeData={userData.resumeText}
          />
        )}

        {currentStep === 4 && (
          <ProcessingStep
            onComplete={() => completeOnboarding()}
            userData={userData}
          />
        )}
      </div>
    </div>
  );
}