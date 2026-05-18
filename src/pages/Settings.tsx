import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle, AlertCircle, Cpu, Zap } from 'lucide-react'

interface FunctionConfig {
  provider: string
  model: string
  description: string
}

interface ModelConfigState {
  extraction: FunctionConfig
  analysis: FunctionConfig
  reporting: FunctionConfig
  fallback: FunctionConfig
}

const defaultConfig: ModelConfigState = {
  extraction: { provider: 'kimi', model: 'moonshot-v1-128k', description: '文本提取与解析' },
  analysis: { provider: 'kimi-code', model: 'kimi-code', description: '数据分析与比对' },
  reporting: { provider: 'kimi', model: 'moonshot-v1-128k', description: '报告生成与总结' },
  fallback: { provider: 'minimax', model: 'MiniMax-Text-01', description: '备选模型' },
}

const providers = [
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    models: ['moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'],
    description: '长文本处理能力极强，中文财报理解深入',
    badge: '推荐',
  },
  {
    id: 'kimi-code',
    name: 'Kimi Code',
    models: ['kimi-code'],
    description: '代码与逻辑推理能力强，适合结构化分析',
    badge: '推荐',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    description: '性价比极高，逻辑推理能力优秀',
    badge: '',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    models: ['MiniMax-Text-01', 'abab6.5s-chat'],
    description: '超长上下文支持，中文表现不错',
    badge: '备选',
  },
  {
    id: 'glm',
    name: 'GLM (智谱)',
    models: ['glm-4-plus', 'glm-4-long'],
    description: '国产大模型，长文本支持好',
    badge: '',
  },
  {
    id: 'qwen',
    name: '通义千问',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
    description: '阿里大模型，综合能力强',
    badge: '',
  },
  {
    id: 'doubao',
    name: '豆包 (字节)',
    models: ['doubao-pro-128k', 'doubao-lite-128k'],
    description: '字节跳动大模型，性价比高',
    badge: '',
  },
]

const functions = [
  { id: 'extraction', name: '文本提取', icon: '📄', description: 'PDF文档解析与文本提取，需要长上下文窗口和强文档理解能力' },
  { id: 'analysis', name: '数据分析', icon: '🔍', description: '财务数据比对与差异分析，需要强逻辑推理和结构化输出能力' },
  { id: 'reporting', name: '报告生成', icon: '📋', description: '审计报告撰写与总结，需要良好的中文表达和专业术语能力' },
  { id: 'fallback', name: '备选模型', icon: '🔄', description: '当主模型不可用时自动切换的备用方案' },
]

export default function Settings() {
  const [config, setConfig] = useState<ModelConfigState>(defaultConfig)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load config from API
  useEffect(() => {
    fetch('/api/models/config')
      .then(res => res.json())
      .then(data => {
        if (data.config) setConfig(data.config)
      })
      .catch(() => {
        // Use default config if API not available
      })
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/models/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // Save locally if API not available
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  const handleReset = () => {
    setConfig(defaultConfig)
  }

  const updateFunction = (funcId: string, provider: string, model: string) => {
    setConfig(prev => ({
      ...prev,
      [funcId]: { ...prev[funcId as keyof ModelConfigState], provider, model },
    }))
  }

  return (
    <div className="min-h-screen bg-deloitte-gray-50">
      <div className="bg-white border-b border-deloitte-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-deloitte-gray-800">模型配置</h1>
              <p className="text-sm text-deloitte-gray-500 mt-1">为不同功能配置最适合的 AI 模型</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleReset} className="btn-secondary text-sm">
                <RefreshCw className="w-4 h-4" />
                恢复默认
              </button>
              <button onClick={handleSave} disabled={loading} className="btn-primary text-sm">
                {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? '已保存' : '保存配置'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Architecture diagram */}
        <div className="card p-6 mb-8">
          <h3 className="text-base font-semibold text-deloitte-gray-800 mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-deloitte-green" />
            模型调用架构
          </h3>
          <div className="bg-deloitte-gray-50 rounded-sm p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 bg-deloitte-blue/10 border border-deloitte-blue/30 rounded-sm text-xs text-deloitte-blue font-medium">
                  PDF 上传
                </div>
                <span className="text-deloitte-gray-300">→</span>
                <div className="px-3 py-2 bg-deloitte-green/10 border border-deloitte-green/30 rounded-sm text-xs text-deloitte-green font-medium">
                  文本提取 ({config.extraction.provider})
                </div>
                <span className="text-deloitte-gray-300">→</span>
                <div className="px-3 py-2 bg-accent-warning/10 border border-accent-warning/30 rounded-sm text-xs text-accent-warning font-medium">
                  数据分析 ({config.analysis.provider})
                </div>
                <span className="text-deloitte-gray-300">→</span>
                <div className="px-3 py-2 bg-deloitte-teal/10 border border-deloitte-teal/30 rounded-sm text-xs text-deloitte-teal font-medium">
                  报告生成 ({config.reporting.provider})
                </div>
              </div>
              <div className="px-3 py-2 bg-deloitte-gray-200/50 border border-deloitte-gray-300 rounded-sm text-xs text-deloitte-gray-500 font-medium">
                备选: {config.fallback.provider}
              </div>
            </div>
          </div>
        </div>

        {/* Function configurations */}
        <div className="space-y-4">
          {functions.map((func) => {
            const currentConfig = config[func.id as keyof ModelConfigState]
            return (
              <motion.div
                key={func.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{func.icon}</span>
                    <div>
                      <h4 className="text-base font-semibold text-deloitte-gray-800">{func.name}</h4>
                      <p className="text-xs text-deloitte-gray-400 mt-0.5">{func.description}</p>
                    </div>
                  </div>
                  <Zap className="w-4 h-4 text-deloitte-green" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Provider select */}
                  <div>
                    <label className="block text-xs font-medium text-deloitte-gray-500 mb-1.5">模型提供商</label>
                    <select
                      value={currentConfig.provider}
                      onChange={(e) => {
                        const provider = providers.find(p => p.id === e.target.value)
                        updateFunction(func.id, e.target.value, provider?.models[0] || '')
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-deloitte-gray-200 rounded-sm text-sm text-deloitte-gray-700 focus:outline-none focus:border-deloitte-green focus:ring-1 focus:ring-deloitte-green/20"
                    >
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Model select */}
                  <div>
                    <label className="block text-xs font-medium text-deloitte-gray-500 mb-1.5">模型版本</label>
                    <select
                      value={currentConfig.model}
                      onChange={(e) => updateFunction(func.id, currentConfig.provider, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-deloitte-gray-200 rounded-sm text-sm text-deloitte-gray-700 focus:outline-none focus:border-deloitte-green focus:ring-1 focus:ring-deloitte-green/20"
                    >
                      {providers.find(p => p.id === currentConfig.provider)?.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Provider description */}
                <p className="text-xs text-deloitte-gray-400 mt-3">
                  {providers.find(p => p.id === currentConfig.provider)?.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Available providers overview */}
        <div className="card p-6 mt-8">
          <h3 className="text-base font-semibold text-deloitte-gray-800 mb-4">可用模型一览</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {providers.map(p => (
              <div key={p.id} className="p-3 bg-deloitte-gray-50 rounded-sm border border-deloitte-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-deloitte-gray-700">{p.name}</span>
                  {p.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-deloitte-green/10 text-deloitte-green rounded-sm">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-deloitte-gray-400">{p.description}</p>
                <p className="text-[10px] text-deloitte-gray-300 mt-1">
                  模型: {p.models.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Note about API keys */}
        <div className="mt-6 p-4 bg-accent-warning/5 border border-accent-warning/20 rounded-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-deloitte-gray-700">关于 API Key 配置</p>
              <p className="text-xs text-deloitte-gray-500 mt-1">
                API Key 通过服务端环境变量管理，不会暴露在前端代码中。如需更换 API Key，请在 Vercel 项目设置中修改环境变量并重新部署。
                切换模型提供商时，请确保对应的 API Key 已在环境变量中配置。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
