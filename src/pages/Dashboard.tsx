import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Loader2, Settings2 } from 'lucide-react'
import { analyzeReportsStream, getAuditDimensions, type StreamEvent, type AuditDimension, type UserApiKeys } from '@/lib/api'
import { formatBytes } from '@/lib/api'

interface UploadedFile { file: File; name: string; size: string }

export default function Dashboard() {
  const [aFile, setAFile] = useState<UploadedFile | null>(null)
  const [hFile, setHFile] = useState<UploadedFile | null>(null)
  const [state, setState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [dimensions, setDimensions] = useState<AuditDimension[]>([])
  const [showDimConfig, setShowDimConfig] = useState(false)
  const [userKeys, setUserKeys] = useState<UserApiKeys>({})
  const [showApiConfig, setShowApiConfig] = useState(false)

  useEffect(() => { getAuditDimensions().then(setDimensions) }, [])

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const handleStart = async () => {
    if (!aFile || !hFile) return
    setState('running'); setProgress(0); setError(''); setResult(null); setLogs([])
    addLog('开始分析...')

    try {
      await analyzeReportsStream(aFile.file, hFile.file, { apiKeys: userKeys, dimensions }, (event: StreamEvent) => {
        switch (event.type) {
          case 'progress':
            setProgress(event.percent || 0)
            setProgressMsg(event.message || '')
            addLog(event.message || '')
            break
          case 'extraction':
            addLog(`文本提取完成: ${event.message}`)
            break
          case 'extracted_data':
            addLog('结构化数据提取完成')
            break
          case 'comparison':
            addLog(`比对完成: 发现 ${event.comparison?.totalDiscrepancies || 0} 项差异`)
            break
          case 'complete':
            setResult(event.result)
            setState('completed')
            addLog('分析完成!')
            break
          case 'error':
            setError(event.message)
            setState('error')
            addLog(`错误: ${event.message}`)
            break
        }
      })
    } catch (err: any) {
      setError(err.message); setState('error'); addLog(`错误: ${err.message}`)
    }
  }

  const handleReset = () => { setAFile(null); setHFile(null); setState('idle'); setProgress(0); setResult(null); setError(''); setLogs([]) }

  return (
    <div className="min-h-screen bg-deloitte-gray-50">
      <div className="bg-white border-b border-deloitte-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-deloitte-gray-800">审计工作台</h1>
              <p className="text-sm text-deloitte-gray-500 mt-1">上传 A/H 股财报，AI 自动完成交叉校验（流式输出）</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowApiConfig(!showApiConfig)} className="btn-secondary text-xs px-3 py-2">
                <Settings2 className="w-3.5 h-3.5" /> API 配置
              </button>
              {state === 'completed' && <button onClick={handleReset} className="btn-secondary text-xs px-3 py-2">新建任务</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Config Panel */}
        <AnimatePresence>
          {showApiConfig && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mb-6">
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-deloitte-gray-700 mb-3">自定义 API Key（留空则使用系统内置）</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[{key:'kimi',label:'Kimi API Key'},{key:'kimiCode',label:'Kimi Code API Key'},{key:'deepseek',label:'DeepSeek'},{key:'minimax',label:'MiniMax'},{key:'glm',label:'GLM (智谱)'},{key:'qwen',label:'通义千问'}].map(item => (
                    <div key={item.key}>
                      <label className="text-xs text-deloitte-gray-500">{item.label}</label>
                      <input type="password" placeholder="sk-..." className="w-full mt-1 px-3 py-2 text-xs border border-deloitte-gray-200 rounded-sm focus:border-deloitte-green focus:outline-none"
                        value={(userKeys as any)[item.key] || ''} onChange={e => setUserKeys(prev => ({...prev, [item.key]: e.target.value}))} />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-deloitte-gray-400 mt-2">API Key 仅在本次会话中使用，不会被存储或传输到第三方。</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dimension Config */}
        {state === 'idle' && (
          <div className="mb-6">
            <button onClick={() => setShowDimConfig(!showDimConfig)} className="flex items-center gap-2 text-sm text-deloitte-gray-600 hover:text-deloitte-green">
              <Settings2 className="w-4 h-4" /> 审计维度配置 {showDimConfig ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
            </button>
            <AnimatePresence>
              {showDimConfig && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mt-3">
                  <div className="card p-4">
                    <p className="text-xs text-deloitte-gray-500 mb-3">选择需要校验的维度（取消勾选可跳过该维度）</p>
                    <div className="space-y-2">
                      {dimensions.map((dim, i) => (
                        <div key={dim.id} className="flex items-start gap-3 p-3 bg-deloitte-gray-50 rounded-sm">
                          <input type="checkbox" checked={dim.enabled} onChange={() => {
                            const updated = [...dimensions]; updated[i] = {...dim, enabled: !dim.enabled}; setDimensions(updated)
                          }} className="mt-0.5 accent-deloitte-green" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-deloitte-gray-700">{dim.name}</p>
                            <p className="text-xs text-deloitte-gray-400 mt-0.5">{dim.fields.join(' · ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Upload */}
        {state !== 'completed' && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileDropzone label="上传 A股年报" color="bg-deloitte-blue" file={aFile} onSelect={setAFile} />
              <FileDropzone label="上传 H股年报" color="bg-deloitte-teal" file={hFile} onSelect={setHFile} />
            </div>
            {state === 'idle' && (
              <div className="mt-6 flex justify-center">
                <button onClick={handleStart} disabled={!aFile || !hFile} className={`btn-primary text-base px-10 py-4 ${(!aFile||!hFile)?'opacity-50 cursor-not-allowed':''}`}>
                  开始 AI 审计分析
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress + Logs */}
        {state === 'running' && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-deloitte-green animate-spin" />
              <div><p className="text-base font-semibold text-deloitte-gray-800">分析进行中</p><p className="text-sm text-deloitte-gray-500">{progressMsg}</p></div>
            </div>
            <div className="w-full bg-deloitte-gray-100 rounded-full h-2 mb-4">
              <motion.div className="bg-deloitte-green h-2 rounded-full" animate={{width:`${progress}%`}} transition={{duration:0.5}} />
            </div>
            {/* Live log */}
            <div className="bg-deloitte-gray-800 rounded-sm p-3 max-h-48 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="text-deloitte-green/80 py-0.5">{log}</motion.div>
              ))}
              <motion.span animate={{opacity:[1,0,1]}} transition={{repeat:Infinity,duration:1}} className="text-deloitte-green">▌</motion.span>
            </div>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="card p-6 mb-6 border-accent-danger/30">
            <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-accent-danger" /><p className="text-sm text-accent-danger">{error}</p></div>
            <button onClick={handleReset} className="mt-3 btn-secondary text-sm">重新开始</button>
          </div>
        )}

        {/* Results */}
        {state === 'completed' && result && <ResultsView result={result} logs={logs} />}
      </div>
    </div>
  )
}

// ─── File Dropzone ───
function FileDropzone({label, color, file, onSelect}: {label:string; color:string; file:UploadedFile|null; onSelect:(f:UploadedFile)=>void}) {
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = (f: File) => { if(f.type==='application/pdf') onSelect({file:f, name:f.name, size:formatBytes(f.size)}) }

  return (
    <div className={`card overflow-hidden ${drag?'ring-2 ring-deloitte-green':''} ${file?'border-deloitte-green/30':''}`}
      onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);e.dataTransfer.files[0]&&handleFile(e.dataTransfer.files[0])}}
      onClick={()=>!file&&ref.current?.click()}>
      <div className={`h-1 ${color}`}/>
      <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>
      {!file ? (
        <div className="p-8 flex flex-col items-center justify-center cursor-pointer min-h-[180px]">
          <Upload className={`w-8 h-8 ${drag?'text-deloitte-green':'text-deloitte-gray-300'} mb-3`}/>
          <p className="text-sm font-medium text-deloitte-gray-700">{label}</p>
          <p className="text-xs text-deloitte-gray-400 mt-1">点击或拖拽 PDF (最大100MB)</p>
        </div>
      ) : (
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-7 h-7 text-accent-danger"/>
            <div><p className="text-sm font-medium text-deloitte-gray-800 truncate max-w-[180px]">{file.name}</p><p className="text-xs text-deloitte-gray-400">{file.size}</p></div>
          </div>
          <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-accent-success"/><span className="text-xs text-accent-success">就绪</span></div>
        </div>
      )}
    </div>
  )
}

// ─── Results View ───
function ResultsView({result, logs}: {result:any; logs:string[]}) {
  const [expandedId, setExpandedId] = useState<number|null>(null)
  const [showLogs, setShowLogs] = useState(false)

  const allDisc: any[] = []
  if(result.comparison?.dimensionResults) Object.values(result.comparison.dimensionResults).forEach((d:any)=>{if(d.discrepancies)allDisc.push(...d.discrepancies)})

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="检查项" value={result.summary.totalChecked} color="text-deloitte-gray-800"/>
        <StatCard label="差异总数" value={result.summary.discrepancies} color="text-accent-warning"/>
        <StatCard label="严重" value={result.summary.critical} color="text-accent-danger"/>
        <StatCard label="警告" value={result.summary.warning} color="text-accent-warning"/>
        <StatCard label="通过" value={result.summary.passed} color="text-accent-success"/>
      </div>

      {/* Report */}
      {result.report && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-deloitte-gray-800 mb-2">{result.report.title||'审计报告'}</h3>
          <p className="text-sm text-deloitte-gray-600 leading-relaxed mb-4">{result.report.overallConclusion}</p>
          {result.report.keyFindings?.length>0 && <div className="mb-3"><h4 className="text-xs font-semibold text-deloitte-gray-500 mb-1">关键发现</h4>{result.report.keyFindings.map((f:string,i:number)=><p key={i} className="text-sm text-deloitte-gray-600">• {f}</p>)}</div>}
          {result.report.recommendations?.length>0 && <div><h4 className="text-xs font-semibold text-deloitte-gray-500 mb-1">建议</h4>{result.report.recommendations.map((r:string,i:number)=><p key={i} className="text-sm text-deloitte-gray-600">→ {r}</p>)}</div>}
        </div>
      )}

      {/* Dimensions */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-deloitte-gray-800 mb-3">检查维度结果</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.dimensions?.map((d:any)=>(
            <div key={d.id} className={`p-3 rounded-sm border ${d.status==='pass'?'border-accent-success/30 bg-accent-success/5':'border-accent-warning/30 bg-accent-warning/5'}`}>
              <div className="flex items-center justify-between"><span className="text-sm font-medium text-deloitte-gray-700">{d.name}</span>
                {d.status==='pass'?<CheckCircle className="w-4 h-4 text-accent-success"/>:<AlertTriangle className="w-4 h-4 text-accent-warning"/>}</div>
              <p className="text-xs text-deloitte-gray-400 mt-1">{d.discrepancyCount>0?`${d.discrepancyCount} 项差异`:'全部通过'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Discrepancies */}
      {allDisc.length>0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-deloitte-gray-800 mb-3">差异详情 ({allDisc.length})</h3>
          <div className="space-y-2">{allDisc.map((item,i)=>(
            <div key={i} className="border border-deloitte-gray-200 rounded-sm p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-sm ${item.severity==='critical'?'bg-accent-danger/10 text-accent-danger':item.severity==='warning'?'bg-accent-warning/10 text-accent-warning':'bg-deloitte-blue/10 text-deloitte-blue'}`}>
                    {item.severity==='critical'?'严重':item.severity==='warning'?'警告':'提示'}</span>
                  <span className="text-sm text-deloitte-gray-700">{item.field}</span>
                </div>
                <button onClick={()=>setExpandedId(expandedId===i?null:i)} className="text-deloitte-gray-400">{expandedId===i?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}</button>
              </div>
              {expandedId===i && (
                <motion.div initial={{height:0}} animate={{height:'auto'}} className="mt-2 pt-2 border-t border-deloitte-gray-100">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-deloitte-gray-50 p-2 rounded-sm"><p className="text-[10px] text-deloitte-gray-400">A股</p><p className="text-xs text-deloitte-gray-700">{item.aShareValue}</p></div>
                    <div className="bg-deloitte-gray-50 p-2 rounded-sm"><p className="text-[10px] text-deloitte-gray-400">H股</p><p className="text-xs text-deloitte-gray-700">{item.hShareValue}</p></div>
                  </div>
                  <p className="text-xs text-deloitte-gray-600">{item.description}</p>
                </motion.div>
              )}
            </div>
          ))}</div>
        </div>
      )}

      {/* Process Log */}
      <div className="card p-4">
        <button onClick={()=>setShowLogs(!showLogs)} className="flex items-center gap-2 text-sm text-deloitte-gray-600">
          处理日志 ({logs.length}) {showLogs?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}
        </button>
        {showLogs && <div className="mt-2 bg-deloitte-gray-800 rounded-sm p-3 max-h-40 overflow-y-auto font-mono text-[10px]">
          {logs.map((l,i)=><div key={i} className="text-deloitte-green/70">{l}</div>)}
        </div>}
      </div>

      <p className="text-center text-xs text-deloitte-gray-400">分析耗时: {result.duration}</p>
    </motion.div>
  )
}

function StatCard({label,value,color}:{label:string;value:number;color:string}) {
  return <div className="card p-4 text-center"><div className={`text-2xl font-bold ${color}`}>{value}</div><div className="text-xs text-deloitte-gray-400 mt-1">{label}</div></div>
}
