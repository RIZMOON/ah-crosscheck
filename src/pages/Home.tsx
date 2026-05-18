import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileCheck, ArrowRight, Upload, Search, GitCompare, ShieldCheck,
  BarChart3, AlertTriangle, CheckCircle, Zap, Lock, Server
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const flowSteps = [
  {
    icon: Upload,
    title: '双通道上传',
    desc: '同时上传 A股（上交所）与 H股（港交所）PDF 年报，支持拖拽上传。',
    tag: '支持 100MB PDF',
  },
  {
    icon: Search,
    title: 'AI 智能解析',
    desc: 'Kimi 大模型自动提取财务报表、分支机构明细、分红方案等核心数据。',
    tag: '长文本深度理解',
  },
  {
    icon: GitCompare,
    title: '逐项比对',
    desc: '基于会计科目与语义理解，逐行匹配 A/H 股数据，标记偏差与矛盾。',
    tag: '5大维度全覆盖',
  },
  {
    icon: ShieldCheck,
    title: '生成报告',
    desc: '输出结构化差异报告：风险分级、原始定位、审计建议，支持导出。',
    tag: '审计工作底稿格式',
  },
]

const features = [
  {
    icon: Zap,
    title: '多模型协同',
    desc: '支持 Kimi、DeepSeek、MiniMax 等多模型切换，针对不同任务选择最优模型。',
  },
  {
    icon: BarChart3,
    title: '数据参照',
    desc: '集成 TuShare/AKShare 金融数据，自动获取上市公司公开财务数据作为交叉验证参照。',
  },
  {
    icon: Lock,
    title: '安全合规',
    desc: 'API Key 通过环境变量管理，文件处理后即时清除，不留存任何客户数据。',
  },
  {
    icon: Server,
    title: '灵活部署',
    desc: '支持 Vercel Serverless 部署，也可私有化部署至企业内网环境。',
  },
]

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-deloitte-charcoal overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Green accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-deloitte-green" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-deloitte-green/10 border border-deloitte-green/30 mb-8"
            >
              <FileCheck className="w-4 h-4 text-deloitte-green" />
              <span className="text-xs text-deloitte-green font-medium">A+H股年报智能交叉审计工具</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
            >
              智能比对，
              <br />
              <span className="text-deloitte-green">让 A/H 股披露零偏差</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-deloitte-gray-300 leading-relaxed max-w-2xl"
            >
              2026 年光大银行年报事件表明：排版错位可导致 40 家分支机构数据严重失真。
              CrossCheck 自动识别 A股与 H股报告中的数值矛盾、口径差异与披露遗漏，
              为审计师构建可信赖的最后一道防线。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Link to="/dashboard" className="btn-primary text-base px-8 py-4">
                立即开始审计
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/settings" className="btn-secondary text-base px-8 py-4 border-deloitte-gray-600 text-white hover:border-deloitte-green hover:text-deloitte-green">
                配置模型
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {[
                { value: '5', label: '审计维度' },
                { value: '50+', label: '检查字段' },
                { value: '6+', label: '支持模型' },
                { value: '<5min', label: '分析耗时' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-deloitte-green">{stat.value}</div>
                  <div className="text-xs text-deloitte-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Case Study Banner */}
      <section className="bg-accent-danger/5 border-y border-accent-danger/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-accent-danger flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-deloitte-gray-800">
                <span className="text-accent-danger font-semibold">真实案例警示：</span>
                2026年3月，光大银行A/H股年报中47家分支机构数据出现40处严重错位，最大偏差达11.2倍。
                本工具旨在帮助审计团队在报告发布前发现此类问题。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="section-title"
            >
              四步完成 A/H 股一致性审计
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0.1}
              className="section-subtitle mx-auto"
            >
              从上传到报告，全程 AI 驱动，审计师只需复核关键差异
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {flowSteps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.1}
                  className="card p-6 relative group"
                >
                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-4xl font-bold text-deloitte-gray-100 group-hover:text-deloitte-green/20 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  
                  <div className="w-12 h-12 bg-deloitte-green/10 rounded-sm flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-deloitte-green" />
                  </div>
                  <h3 className="text-lg font-semibold text-deloitte-gray-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-deloitte-gray-500 leading-relaxed mb-4">{step.desc}</p>
                  <span className="inline-flex items-center px-2 py-1 bg-deloitte-gray-50 text-xs text-deloitte-gray-500 rounded-sm">
                    {step.tag}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-deloitte-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">核心能力</h2>
            <p className="section-subtitle mx-auto">
              基于大语言模型的智能审计引擎，为专业审计师量身打造
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.1}
                  className="card p-8 flex gap-5"
                >
                  <div className="w-12 h-12 bg-deloitte-green/10 rounded-sm flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-deloitte-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-deloitte-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-sm text-deloitte-gray-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-deloitte-charcoal relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-deloitte-green" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            在报告发布前，发现每一处差异
          </h2>
          <p className="text-deloitte-gray-300 text-lg mb-8">
            CrossCheck 帮助审计团队在 A/H 股年报正式披露前完成一致性校验，避免信息披露事故。
          </p>
          <Link to="/dashboard" className="btn-primary text-lg px-10 py-4">
            立即开始审计
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
