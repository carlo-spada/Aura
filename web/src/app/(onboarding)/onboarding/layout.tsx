"use client"
import { PreferencesProvider } from '../../../components/PreferencesContext'
import { RequireAuth } from '../../../components/RequireAuth'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PreferencesProvider>{children}</PreferencesProvider>
    </RequireAuth>
  )
}
