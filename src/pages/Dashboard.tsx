import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, CheckCircle, AlertTriangle, AlertCircle,
  ChevronDown, ChevronUp, Loader2, BarChart3, Download
} from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { analyzeReports, type AnalysisResult, type Discrepancy } from '@/lib/api'

interface UploadedFile {
  file: File
  name: string
  size: string
}

export default function Dashboard() {
  const [aFile, setAFile] = useState<UploadedFile | null>(null)
  const [hFile, setHFile] = useState<UploadedFile | null>(null)
  const [analysisState, setAnalysisState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStartAudit = async () => {
    if (!aFile || !hFile) return
    
    setAnalysisState('running')
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      const analysisResult = await analyzeReports(
        aFile.file,
        hFile.file,
        undefined,
        (p, msg) => {
          setProgress(p)
          setProgressMessage(msg)
        }
      )
      setResult(analysisResult)
      setAnalysisState('completed')
    } catch (err: any) {
      setError(err.message || '分析过程中出错')
      setAnalysisState('error')
    }
  }

  const handleReset = () => {
    setAFile(null)
    setHFile(null)
    setAnalysisState('idle')
    setProgress(0)
    setProgressMessage('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-deloitte-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-deloitte-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-deloitte-gray-800">审计工作台</h1>
              <p className="text-sm text-deloitte-gray-500 mt-1">上传 A/H 股财报，AI 自动完成交叉校验</p>
            </div>
            {analysisState === 'completed' && (
              <button onClick={handleReset} className="btn-secondary text-sm">
                新建审计任务
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {analysisState !== 'completed' && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileDropzone
                label="上传 A股年报"
                subtitle="上交所/深交所 PDF 报告"
                accentColor="bg-deloitte-blue"
                file={aFile}
                onFileSelect={(file) => setAFile(file)}
              />
              <FileDropzone
                label="上传 H股年报"
                subtitle="港交所 PDF 报告"
                accentColor="bg-deloitte-teal"
                file={hFile}
                onFileSelect={(file) => setHFile(file)}
              />
            </div>

            {/* Start button */}
            <div className="mt-6 flex justify-center">
              {analysisState === 'idle' && (
                <button
                  onClick={handleStartAudit}
                  disabled={!aFile || !hFile}
                  className={`btn-primary text-base px-10 py-4 ${
                    (!aFile || !hFile) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  开始 AI 审计分析
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {analysisState === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-6 h-6 text-deloitte-green animate-spin" />
              <div>
                <p className="text-lg font-semibold text-deloitte-gray-800">正在分析中...</p>
                <p className="text-sm text-deloitte-gray-500">{progressMessage}</p>
              </div>
            </div>
            <div className="w-full bg-deloitte-gray-100 rounded-full h-2">
              <motion.div
                className="bg-deloitte-green h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-deloitte-gray-400 mt-2 text-right">{progress}%</p>
          </motion.div>
        )}

        {/* Error */}
        {analysisState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 mb-8 border-accent-danger/30"
          >
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-accent-danger" />
              <div>
                <p className="text-lg font-semibold text-deloitte-gray-800">分析失败</p>
                <p className="text-sm text-accent-danger">{error}</p>
              </div>
            </div>
            <button onClick={handleReset} className="mt-4 btn-secondary text-sm">
              重新开始
            </button>
          </motion.div>
        )}

        {/* Results */}
        {analysisState === 'completed' && result && (
          <AnalysisResults result={result} />
        )}
      </div>
    </div>
  )
}

/* ─── File Dropzone ─── */
function FileDropzone({
  label, subtitle, accentColor, file, onFileSelect
}: {
  label: string
  subtitle: string
  accentColor: string
  file: UploadedFile | null
  onFileSelect: (file: UploadedFile) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === 'application/pdf') {
      onFileSelect({ file: dropped, name: dropped.name, size: formatBytes(dropped.size) })
    }
  }, [onFileSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      onFileSelect({ file: selected, name: selected.name, size: formatBytes(selected.size) })
    }
  }

  return (
    <div
      className={`card overflow-hidden transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-deloitte-green shadow-lg' : ''
      } ${file ? 'border-deloitte-green/30' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      {/* Top accent bar */}
      <div className={`h-1 ${accentColor}`} />
      
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      {!file ? (
        <div className="p-8 flex flex-col items-center justify-center cursor-pointer min-h-[200px]">
          <Upload className={`w-10 h-10 ${isDragOver ? 'text-deloitte-green' : 'text-deloitte-gray-300'} mb-4`} />
          <p className="text-base font-medium text-deloitte-gray-700">{label}</p>
          <p className="text-sm text-deloitte-gray-400 mt-1">{subtitle}</p>
          <p className="text-xs text-deloitte-gray-300 mt-3">点击上传或拖拽 PDF 至此 (最大 100MB)</p>
        </div>
      ) : (
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-accent-danger" />
              <div>
                <p className="text-sm font-medium text-deloitte-gray-800 truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-deloitte-gray-400">{file.size}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-accent-success" />
              <span className="text-xs text-accent-success font-medium">已就绪</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Analysis Results ─── */
function AnalysisResults({ result }: { result: AnalysisResult }) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const allDiscrepancies: Discrepancy[] = []
  if (result.comparison?.dimensionResults) {
    Object.values(result.comparison.dimensionResults).forEach((dim: any) => {
      if (dim.discrepancies) {
        allDiscrepancies.push(...dim.discrepancies)
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="检查项" value={result.summary.totalChecked} color="text-deloitte-gray-800" />
        <SummaryCard label="差异总数" value={result.summary.discrepancies} color="text-accent-warning" />
        <SummaryCard label="严重" value={result.summary.critical} color="text-accent-danger" />
        <SummaryCard label="警告" value={result.summary.warning} color="text-accent-warning" />
        <SummaryCard label="通过" value={result.summary.passed} color="text-accent-success" />
      </div>

      {/* Report Summary */}
      {result.report && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-deloitte-gray-800 mb-3">
            {result.report.title || '审计报告'}
          </h3>
          <p className="text-sm text-deloitte-gray-600 leading-relaxed mb-4">
            {result.report.overallConclusion}
          </p>
          
          {result.report.keyFindings?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-deloitte-gray-700 mb-2">关键发现</h4>
              <ul className="space-y-1">
                {result.report.keyFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-deloitte-gray-600">
                    <span className="text-deloitte-green mt-0.5">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.report.recommendations?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-deloitte-gray-700 mb-2">审计建议</h4>
              <ul className="space-y-1">
                {result.report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-deloitte-gray-600">
                    <span className="text-deloitte-blue mt-0.5">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Dimensions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-deloitte-gray-800 mb-4">检查维度</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.dimensions?.map((dim) => (
            <div
              key={dim.id}
              className={`p-4 rounded-sm border ${
                dim.status === 'pass'
                  ? 'border-accent-success/30 bg-accent-success/5'
                  : 'border-accent-warning/30 bg-accent-warning/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-deloitte-gray-700">{dim.name}</span>
                {dim.status === 'pass' ? (
                  <CheckCircle className="w-4 h-4 text-accent-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-accent-warning" />
                )}
              </div>
              <p className="text-xs text-deloitte-gray-400 mt-1">
                {dim.discrepancies > 0 ? `${dim.discrepancies} 项差异` : '全部通过'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Discrepancies List */}
      {allDiscrepancies.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-deloitte-gray-800 mb-4">差异详情</h3>
          <div className="space-y-3">
            {allDiscrepancies.map((item, idx) => (
              <DiscrepancyCard
                key={idx}
                item={item}
                index={idx}
                expanded={expandedId === idx}
                onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="text-center text-sm text-deloitte-gray-400 py-4">
        分析耗时: {result.duration}
      </div>
    </motion.div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-deloitte-gray-400 mt-1">{label}</div>
    </div>
  )
}

function DiscrepancyCard({ item, index, expanded, onToggle }: {
  item: Discrepancy; index: number; expanded: boolean; onToggle: () => void
}) {
  const severityConfig = {
    critical: { label: '严重', bg: 'bg-accent-danger/10', text: 'text-accent-danger', border: 'border-accent-danger/30' },
    warning: { label: '警告', bg: 'bg-accent-warning/10', text: 'text-accent-warning', border: 'border-accent-warning/30' },
    info: { label: '提示', bg: 'bg-deloitte-blue/10', text: 'text-deloitte-blue', border: 'border-deloitte-blue/30' },
  }
  const cfg = severityConfig[item.severity] || severityConfig.info

  return (
    <div className={`border rounded-sm ${cfg.border} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-sm ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
            <span className="text-sm font-medium text-deloitte-gray-700">{item.field || item.category}</span>
          </div>
          <button onClick={onToggle} className="text-deloitte-gray-400 hover:text-deloitte-gray-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="bg-deloitte-gray-50 p-3 rounded-sm">
            <p className="text-xs text-deloitte-gray-400 mb-1">A股报告 {item.aSharePage}</p>
            <p className="text-sm text-deloitte-gray-700">{item.aShareValue}</p>
          </div>
          <div className="bg-deloitte-gray-50 p-3 rounded-sm">
            <p className="text-xs text-deloitte-gray-400 mb-1">H股报告 {item.hSharePage}</p>
            <p className="text-sm text-deloitte-gray-700">{item.hShareValue}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-deloitte-gray-100 pt-3">
              <p className="text-sm text-deloitte-gray-600 leading-relaxed">{item.description}</p>
              <p className="text-xs text-deloitte-gray-400 mt-2">差异类型: {item.difference}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
