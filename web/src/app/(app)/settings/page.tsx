import { ThemeToggle } from '../../../components/ThemeToggle'

export default function SettingsPage() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Settings</h2>
      <div className="space-y-6">
        <section className="rounded border border-neutral-800 bg-neutral-900/50 p-4">
          <h3 className="font-medium">Theme</h3>
          <p className="mt-1 text-sm text-neutral-400">Switch between Dark and Light mode.</p>
          <div className="mt-3"><ThemeToggle /></div>
        </section>
        <section className="rounded border border-neutral-800 bg-neutral-900/50 p-4">
          <h3 className="font-medium">Preferences</h3>
          <p className="mt-1 text-sm text-neutral-400">Onboarding preferences editor (placeholder).</p>
        </section>
        <section className="rounded border border-neutral-800 bg-neutral-900/50 p-4">
          <h3 className="font-medium">CV Management</h3>
          <p className="mt-1 text-sm text-neutral-400">Upload/replace your source-of-truth CV (placeholder).</p>
        </section>
      </div>
    </div>
  )
}

