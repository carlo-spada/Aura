"use client"
import { PreferencesProvider } from '../../../components/PreferencesContext'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <PreferencesProvider>{children}</PreferencesProvider>
}

