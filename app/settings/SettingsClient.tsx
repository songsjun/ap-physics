'use client'

import { useEffect, useRef, useState } from 'react'
import { StorageService } from '@/lib/infra/storage'
import { exportProgress, importProgress, downloadJson, type ExportData } from '@/lib/app/share'

export function SettingsClient() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const key = StorageService.apiKey.get()
    if (key) setApiKey(key)
  }, [])

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
      const data = JSON.parse(text) as ExportData
      const userId = StorageService.userId.get()
      if (!userId) throw new Error('用户未初始化')
      await importProgress(userId, data)
      setImportStatus('success')
    } catch (err) {
      setImportStatus('error')
      setImportError(err instanceof Error ? err.message : '文件格式错误')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <a href="/" className="text-sm text-blue-500 hover:underline">← 返回首页</a>
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
      </div>

      {/* API Key */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Claude API Key</h2>
          <p className="text-sm text-gray-500 mt-0.5">用于获取个性化学习反馈。Key 仅保存在本地浏览器，不会上传。</p>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="sk-ant-..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saved ? '已保存 ✓' : '保存'}
          </button>
        </div>
        {apiKey && (
          <button
            onClick={() => { StorageService.apiKey.clear(); setApiKey('') }}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            清除 Key
          </button>
        )}
        <p className="text-xs text-gray-400">
          前往{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            console.anthropic.com
          </a>{' '}
          获取 API Key（需要账号）。
        </p>
      </section>

      {/* Progress backup */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">学习进度备份</h2>
          <p className="text-sm text-gray-500 mt-0.5">导出进度到 JSON 文件，或从备份文件恢复（会覆盖当前进度）。</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            导出进度
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            导入进度
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
          <p className="text-sm text-green-600">✓ 进度已成功导入，请刷新页面查看更新。</p>
        )}
        {importStatus === 'error' && (
          <p className="text-sm text-red-500">导入失败：{importError}</p>
        )}
      </section>
    </div>
  )
}
