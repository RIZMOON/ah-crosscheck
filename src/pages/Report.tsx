import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, AlertTriangle, CheckCircle, Download, Eye } from 'lucide-react'

// Mock historical reports for demo
const mockReports = [
  {
    id: 1,
    company: '建设银行',
    period: '2025年度',
    date: '2026-04-15',
    status: 'completed',
    riskLevel: 'low',
    discrepancies: 2,
    critical: 0,
  },
  {
    id: 2,
    company: '光大银行',
    period: '2025年度',
    date: '2026-03-30',
    status: 'completed',
    riskLevel: 'high',
    discrepancies: 40,
    critical: 38,
  },
  {
    id: 3,
    company: '工商银行',
    period: '2025年度',
    date: '2026-04-10',
    status: 'completed',
    riskLevel: 'low',
    discrepancies: 1,
    critical: 0,
  },
]

export default function Report() {
  return (
    <div className="min-h-screen bg-deloitte-gray-50">
      <div className="bg-white border-b border-deloitte-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-deloitte-gray-800">报告中心</h1>
          <p className="text-sm text-deloitte-gray-500 mt-1">查看历史审计报告与分析结果</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="总审计次数" value="3" icon={FileText} />
          <StatCard label="发现差异" value="43" icon={AlertTriangle} />
          <StatCard label="严重问题" value="38" icon={AlertTriangle} color="text-accent-danger" />
          <StatCard label="通过率" value="66.7%" icon={CheckCircle} color="text-accent-success" />
        </div>

        {/* Reports list */}
        <div className="card">
          <div className="p-4 border-b border-deloitte-gray-100">
            <h3 className="text-base font-semibold text-deloitte-gray-800">审计历史</h3>
          </div>
          <div className="divide-y divide-deloitte-gray-100">
            {mockReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-deloitte-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                      report.riskLevel === 'high' ? 'bg-accent-danger/10' : 'bg-accent-success/10'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        report.riskLevel === 'high' ? 'text-accent-danger' : 'text-accent-success'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-deloitte-gray-800">
                        {report.company} {report.period} A/H股一致性审计
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-deloitte-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {report.date}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-sm ${
                          report.riskLevel === 'high'
                            ? 'bg-accent-danger/10 text-accent-danger'
                            : 'bg-accent-success/10 text-accent-success'
                        }`}>
                          {report.riskLevel === 'high' ? '高风险' : '低风险'}
                        </span>
                        <span className="text-xs text-deloitte-gray-400">
                          {report.discrepancies} 项差异 / {report.critical} 项严重
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-deloitte-gray-400 hover:text-deloitte-blue transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-deloitte-gray-400 hover:text-deloitte-green transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-deloitte-gray-400 mt-8">
          注：报告中心将在后续版本中支持持久化存储和导出功能
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color = 'text-deloitte-gray-800' }: {
  label: string; value: string; icon: any; color?: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-deloitte-gray-400">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <Icon className="w-8 h-8 text-deloitte-gray-200" />
      </div>
    </div>
  )
}
