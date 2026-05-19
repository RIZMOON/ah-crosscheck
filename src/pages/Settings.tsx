import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, CheckCircle, Key, BookOpen, Shield, Cpu, AlertTriangle } from 'lucide-react'
import { getAvailableModels } from '@/lib/api'

export default function Settings() {
  const [apiKeys, setApiKeys] = useState<Record<string,string>>({})
  const [saved, setSaved] = useState(false)
  const [providers, setProviders] = useState<any[]>([])

  useEffect(() => {
    // Load saved keys from localStorage
    const saved = localStorage.getItem('crosscheck_api_keys')
    if (saved) setApiKeys(JSON.parse(saved))
    getAvailableModels().then(d => setProviders(d.providers || []))
  }, [])

  const handleSave = () => {
    localStorage.setItem('crosscheck_api_keys', JSON.stringify(apiKeys))
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-deloitte-gray-50">
      <div className="bg-white border-b border-deloitte-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-deloitte-gray-800">设置与指南</h1>
          <p className="text-sm text-deloitte-gray-500 mt-1">API 配置、审计方法论与校验维度说明</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* API Key Configuration */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-deloitte-green" />
              <h2 className="text-lg font-semibold text-deloitte-gray-800">API Key 配置</h2>
            </div>
            <button onClick={handleSave} className="btn-primary text-sm">
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? '已保存' : '保存'}
            </button>
          </div>
          <p className="text-xs text-deloitte-gray-500 mb-4">
            配置您自己的 API Key 来运行分析。留空的字段将使用系统内置的默认 Key。Key 仅存储在您的浏览器本地，不会上传至服务器。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'kimi', label: 'Kimi (月之暗面)', desc: '用于PDF文本提取和报告生成', placeholder: 'sk-...' },
              { key: 'kimiCode', label: 'Kimi Code', desc: '用于数据分析和逻辑比对', placeholder: 'sk-kimi-...' },
              { key: 'minimax', label: 'MiniMax', desc: '备选模型，超长文本支持', placeholder: 'sk-...' },
              { key: 'deepseek', label: 'DeepSeek', desc: '强逻辑推理能力', placeholder: 'sk-...' },
              { key: 'glm', label: 'GLM (智谱)', desc: '国产大模型', placeholder: '' },
              { key: 'qwen', label: '通义千问', desc: '阿里大模型', placeholder: 'sk-...' },
            ].map(item => (
              <div key={item.key} className="p-4 bg-deloitte-gray-50 rounded-sm">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-deloitte-gray-700">{item.label}</label>
                  {apiKeys[item.key] && <span className="text-[10px] text-accent-success">已配置</span>}
                </div>
                <p className="text-[10px] text-deloitte-gray-400 mb-2">{item.desc}</p>
                <input
                  type="password"
                  placeholder={item.placeholder || 'API Key...'}
                  value={apiKeys[item.key] || ''}
                  onChange={e => setApiKeys(prev => ({...prev, [item.key]: e.target.value}))}
                  className="w-full px-3 py-2 text-xs border border-deloitte-gray-200 rounded-sm focus:border-deloitte-green focus:outline-none bg-white"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-deloitte-green/5 border border-deloitte-green/20 rounded-sm">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-deloitte-green flex-shrink-0 mt-0.5" />
              <p className="text-xs text-deloitte-gray-600">
                <strong>安全说明：</strong>您的 API Key 仅存储在浏览器 localStorage 中，通过 HTTPS 加密传输至后端处理，处理完成后立即丢弃，不会被持久化存储。
                系统内置 Key 作为默认选项，确保无需配置即可使用。
              </p>
            </div>
          </div>
        </section>

        {/* Audit Guideline */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-deloitte-green" />
            <h2 className="text-lg font-semibold text-deloitte-gray-800">审计校验方法论 (Guideline)</h2>
          </div>
          <p className="text-sm text-deloitte-gray-600 mb-6">
            CrossCheck 基于以下专业审计方法论对 A/H 股财报进行交叉校验。每个维度可在审计工作台中单独启用或禁用。
          </p>

          <div className="space-y-4">
            {guidelineData.map((section, i) => (
              <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}} className="border border-deloitte-gray-100 rounded-sm overflow-hidden">
                <div className={`px-4 py-3 ${section.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-sm ${section.badgeColor}`}>{section.level}</span>
                      <h3 className="text-sm font-semibold text-deloitte-gray-800">{section.title}</h3>
                    </div>
                    <span className="text-xs text-deloitte-gray-400">{section.fields.length} 个检查项</span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-deloitte-gray-600 mb-3">{section.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {section.fields.map((field, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs text-deloitte-gray-600">
                        <CheckCircle className="w-3 h-3 text-deloitte-green flex-shrink-0" />
                        {field}
                      </div>
                    ))}
                  </div>
                  {section.threshold && (
                    <div className="mt-3 p-2 bg-accent-warning/5 border border-accent-warning/20 rounded-sm">
                      <p className="text-[10px] text-deloitte-gray-600"><AlertTriangle className="w-3 h-3 text-accent-warning inline mr-1" /><strong>阈值标准：</strong>{section.threshold}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Model Architecture */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-deloitte-green" />
            <h2 className="text-lg font-semibold text-deloitte-gray-800">处理流程与模型架构</h2>
          </div>
          <div className="bg-deloitte-gray-50 rounded-sm p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {['PDF上传','→','Kimi文本提取','→','结构化数据抽取','→','Kimi Code比对分析','→','审计报告生成'].map((item,i) => (
                <span key={i} className={item==='→'?'text-deloitte-gray-300':'px-3 py-1.5 bg-white border border-deloitte-gray-200 rounded-sm text-deloitte-gray-700 font-medium'}>{item}</span>
              ))}
            </div>
            <p className="text-[10px] text-deloitte-gray-400 mt-3">每个步骤的进度和中间结果均通过流式输出实时展示，确保过程透明可追溯。</p>
          </div>
        </section>
      </div>
    </div>
  )
}

const guidelineData = [
  {
    level: '一级', title: '财务报表核心数据', bgColor: 'bg-accent-danger/5', badgeColor: 'bg-accent-danger/10 text-accent-danger',
    description: '核心财务数据是审计校验的最高优先级。A/H股报告中的资产负债表、利润表、现金流量表核心数据必须完全一致（考虑汇率和单位换算后）。',
    fields: ['资产总额','负债总额','所有者权益','归母权益','营业收入','营业利润','净利润','归母净利润','基本每股收益','经营活动现金流','投资活动现金流','筹资活动现金流'],
    threshold: '数值差异 > 0.1% 标记为严重(Critical)；差异在 0.01%-0.1% 标记为警告(Warning)',
  },
  {
    level: '一级', title: '关键财务比率', bgColor: 'bg-accent-danger/5', badgeColor: 'bg-accent-danger/10 text-accent-danger',
    description: '监管要求的关键比率指标，直接影响投资者决策和监管合规判断。',
    fields: ['加权平均ROE','总资产回报率','净息差','不良贷款率','拨备覆盖率','资本充足率','核心一级资本充足率','杠杆率'],
    threshold: '绝对差异 > 0.01个百分点 标记为严重；比率计算口径不一致标记为警告',
  },
  {
    level: '二级', title: '股份与分红数据', bgColor: 'bg-accent-warning/5', badgeColor: 'bg-accent-warning/10 text-accent-warning',
    description: '股本结构和分红方案直接影响股东权益，需确保A/H股报告中的数据完全一致。',
    fields: ['普通股总数','H股数量','A股数量','基本每股收益','稀释每股收益','每股净资产','每股分红/派息','分红总额','分红比例'],
    threshold: '任何数值差异均标记为严重（分红数据错误可能导致投资者损失）',
  },
  {
    level: '三级', title: '分支机构与明细数据', bgColor: 'bg-accent-warning/5', badgeColor: 'bg-accent-warning/10 text-accent-warning',
    description: '光大银行2026年事件的核心问题：分支机构数据排版错位。需逐行核对各分行/子公司数据。',
    fields: ['各分行资产规模','地区分布收入','地区分布利润','重要子公司资产','重要子公司收入','重要子公司利润','数据行对应关系'],
    threshold: '任何数据行错位标记为严重；单个分支数据差异 > 5% 标记为严重',
  },
  {
    level: '四级', title: '文本与披露口径', bgColor: 'bg-deloitte-blue/5', badgeColor: 'bg-deloitte-blue/10 text-deloitte-blue',
    description: '检查定性披露的一致性，包括会计政策、风险描述、日期等。CAS与IFRS的合理差异不计入异常。',
    fields: ['重要会计估计表述','风险定性描述','报告期间','董事会日期','审计报告日期','关联交易披露','或有事项披露'],
    threshold: '实质性内容矛盾标记为警告；纯翻译/格式差异标记为提示(Info)',
  },
]
