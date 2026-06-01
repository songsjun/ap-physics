'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { StorageService, type ThemePreference } from '@/lib/infra/storage'
import { applyStoredTheme } from '@/components/AppInitializer'
import { exportProgress, importProgress, downloadJson, type ExportData } from '@/lib/app/share'

export function SettingsClient() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importError, setImportError] = useState('')
  const [theme, setTheme] = useState<ThemePreference>('system')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const key = StorageService.apiKey.get()
    if (key) setApiKey(key)
    setTheme(StorageService.theme.get())
  }, [])

  function handleThemeChange(t: ThemePreference) {
    setTheme(t)
    StorageService.theme.save(t)
    applyStoredTheme()
  }

  function handleSave() {
    const trimmed = apiKey.trim()
    if (trimmed) {
      StorageService.apiKey.save(trimmed)
    } else {
      StorageService.apiKey.clear()
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleExport() {
    const userId = StorageService.userId.get()
    if (!userId) return
    const data = await exportProgress(userId)
    downloadJson(data, `ap-physics-progress-${new Date().toISOString().slice(0, 10)}.json`)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus('idle')
    try {
      const text = await file.text()
      const raw: unknown = JSON.parse(text)
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new Error('Invalid file format: not a valid JSON object')
      }
      const userId = StorageService.userId.get()
      if (!userId) throw new Error('User not initialized')
      await importProgress(userId, raw as ExportData)
      setImportStatus('success')
    } catch (err) {
      setImportStatus('error')
      setImportError(err instanceof Error ? err.message : 'Invalid file format')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const themeOptions: { value: ThemePreference; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'system', label: 'System', icon: '⚙️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm text-blue-500 hover:underline">← Back to Home</Link>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Settings</h1>
      </div>

      {/* Theme preference */}
      <section className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">Appearance</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Choose your display theme. Settings are saved locally in your browser.
          </p>
        </div>
        <div className="flex gap-2">
          {themeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleThemeChange(opt.value)}
              className={`flex-1 py-2.5 text-sm rounded-lg border transition-colors ${
                theme === opt.value
                  ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-800 dark:border-stone-100 font-medium'
                  : 'bg-stone-50 dark:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600'
              }`}
            >
              <span className="mr-1.5">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* API Key */}
      <section className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">Claude API Key</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Used for personalized learning feedback. Your key is saved locally and never uploaded.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="sk-ant-..."
            className="flex-1 border border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
        {apiKey && (
          <button
            onClick={() => { StorageService.apiKey.clear(); setApiKey('') }}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Clear Key
          </button>
        )}
        <p className="text-xs text-stone-400 dark:text-stone-500">
          Visit{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            console.anthropic.com
          </a>{' '}
          to get your API Key (account required).
        </p>
      </section>

      {/* Progress backup */}
      <section className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">Progress Backup</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Export progress to a JSON file, or restore from a backup (overwrites current progress).</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-300"
          >
            Export Progress
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-300"
          >
            Import Progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        {importStatus === 'success' && (
          <p className="text-sm text-emerald-600">✓ Progress imported successfully. Refresh the page to see updates.</p>
        )}
        {importStatus === 'error' && (
          <p className="text-sm text-red-500">Import failed: {importError}</p>
        )}
      </section>
    </div>
  )
}
