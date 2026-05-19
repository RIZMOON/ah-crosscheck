/**
 * Vercel Serverless Function - CrossCheck API
 * Supports: user API keys, streaming output, configurable audit dimensions
 */

export const config = {
  maxDuration: 300,
};

// ─── Provider Configs ───
const PROVIDER_CONFIGS = {
  kimi: { baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-128k' },
  'kimi-code': { baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'kimi-code' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  minimax: { baseUrl: 'https://api.minimax.chat/v1', defaultModel: 'MiniMax-Text-01' },
  glm: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-plus' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-max' },
  doubao: { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'doubao-pro-128k' },
};

// ─── Default Audit Dimensions ───
const DEFAULT_DIMENSIONS = [
  { id: 'financial_core', name: '财务报表核心数据', enabled: true, fields: ['资产总额','负债总额','所有者权益','归母权益','营业收入','营业利润','净利润','归母净利润','基本每股收益','经营活动现金流','投资活动现金流','筹资活动现金流'] },
  { id: 'financial_ratios', name: '关键财务比率', enabled: true, fields: ['加权平均ROE','总资产回报率','净息差','不良贷款率','拨备覆盖率','资本充足率','核心一级资本充足率','杠杆率'] },
  { id: 'shares_dividend', name: '股份与分红数据', enabled: true, fields: ['普通股总数','H股数量','A股数量','基本每股收益','稀释每股收益','每股净资产','每股分红','分红总额','分红比例'] },
  { id: 'branch_detail', name: '分支机构与明细数据', enabled: true, fields: ['各分行资产规模','地区分布收入','地区分布利润','重要子公司数据'] },
  { id: 'disclosure_text', name: '文本与披露口径', enabled: true, fields: ['重要会计估计表述','风险定性描述','报告期间','董事会日期','审计报告日期','关联交易披露'] },
];

// ─── Main Handler ───
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api', '') || '/';

  try {
    if (path === '/health' || path === '/') return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    if (path === '/dimensions') return res.json({ dimensions: DEFAULT_DIMENSIONS });
    if (path === '/models/available') return res.json(getAvailableModels());
    if (path === '/analyze' && req.method === 'POST') return await handleAnalyzeStream(req, res);
    if (path.startsWith('/stock/')) return await handleStock(req, res, path);
    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ─── Streaming Analysis Handler ───
async function handleAnalyzeStream(req, res) {
  const body = req.body;
  if (!body?.aShareBase64 || !body?.hShareBase64) {
    return res.status(400).json({ error: '请上传A股和H股报告' });
  }

  // Set up SSE for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    const aShareBuffer = Buffer.from(body.aShareBase64, 'base64');
    const hShareBuffer = Buffer.from(body.hShareBase64, 'base64');
    const userApiKeys = body.apiKeys || {};
    const dimensions = body.dimensions || DEFAULT_DIMENSIONS;
    const startTime = Date.now();

    // Resolve API keys: user-provided > env defaults
    const apiKeys = resolveApiKeys(userApiKeys);

    // Step 1: Upload to Kimi
    sendEvent('progress', { step: 1, total: 5, message: '正在上传PDF至Kimi进行文本提取...', percent: 10 });
    const [aFileInfo, hFileInfo] = await Promise.all([
      uploadFileToKimi(aShareBuffer, 'a_share.pdf', apiKeys.kimi),
      uploadFileToKimi(hShareBuffer, 'h_share.pdf', apiKeys.kimi),
    ]);

    // Step 2: Extract text
    sendEvent('progress', { step: 2, total: 5, message: '正在提取PDF文本内容...', percent: 25 });
    const [aText, hText] = await Promise.all([
      getKimiFileContent(aFileInfo.id, apiKeys.kimi),
      getKimiFileContent(hFileInfo.id, apiKeys.kimi),
    ]);
    sendEvent('extraction', { aLength: aText.length, hLength: hText.length, message: `A股报告: ${aText.length}字, H股报告: ${hText.length}字` });

    // Step 3: Structured extraction
    sendEvent('progress', { step: 3, total: 5, message: '正在使用AI提取结构化财务数据...', percent: 45 });
    const enabledDims = dimensions.filter(d => d.enabled);
    const [aData, hData] = await Promise.all([
      extractStructuredData(aText, 'A股', enabledDims, apiKeys),
      extractStructuredData(hText, 'H股', enabledDims, apiKeys),
    ]);
    sendEvent('extracted_data', { aShareData: aData, hShareData: hData });

    // Step 4: Cross-compare
    sendEvent('progress', { step: 4, total: 5, message: '正在执行A/H股数据交叉比对...', percent: 70 });
    const comparison = await crossCompareData(aData, hData, enabledDims, apiKeys);
    sendEvent('comparison', { comparison });

    // Step 5: Generate report
    sendEvent('progress', { step: 5, total: 5, message: '正在生成审计报告...', percent: 90 });
    const report = await generateReport(comparison, aData, hData, apiKeys);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Final result
    const result = {
      status: 'completed',
      duration: `${duration}s`,
      aShareData: aData,
      hShareData: hData,
      comparison,
      report,
      dimensions: enabledDims.map(dim => ({
        ...dim,
        status: comparison.dimensionResults?.[dim.id]?.hasDiscrepancies ? 'warning' : 'pass',
        discrepancyCount: comparison.dimensionResults?.[dim.id]?.discrepancies?.length || 0,
      })),
      summary: {
        totalChecked: comparison.totalChecked || 0,
        discrepancies: comparison.totalDiscrepancies || 0,
        critical: comparison.criticalCount || 0,
        warning: comparison.warningCount || 0,
        passed: (comparison.totalChecked || 0) - (comparison.totalDiscrepancies || 0),
      },
    };

    sendEvent('complete', { result });
    sendEvent('progress', { step: 5, total: 5, message: '分析完成', percent: 100 });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    sendEvent('error', { message: error.message });
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

// ─── Resolve API Keys ───
function resolveApiKeys(userKeys) {
  return {
    kimi: userKeys.kimi || process.env.KIMI_API_KEY,
    'kimi-code': userKeys['kimi-code'] || userKeys.kimiCode || process.env.KIMI_CODE_API_KEY,
    minimax: userKeys.minimax || process.env.MINIMAX_API_KEY,
    deepseek: userKeys.deepseek || process.env.DEEPSEEK_API_KEY,
    glm: userKeys.glm || process.env.GLM_API_KEY,
    qwen: userKeys.qwen || process.env.QWEN_API_KEY,
    doubao: userKeys.doubao || process.env.DOUBAO_API_KEY,
  };
}

// ─── LLM Call ───
async function callLLM(messages, provider, apiKey, options = {}) {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  if (!apiKey) throw new Error(`No API key for ${provider}`);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: options.model || config.defaultModel,
      messages,
      temperature: options.temperature || 0.1,
      max_tokens: options.maxTokens || 16384,
      ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM error (${provider}): ${response.status} - ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Kimi File Upload ───
async function uploadFileToKimi(buffer, filename, apiKey) {
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`;
  const footer = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\nfile-extract\r\n--${boundary}--`;

  const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

  const response = await fetch('https://api.moonshot.cn/v1/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });

  if (!response.ok) throw new Error(`Kimi upload failed: ${response.status} - ${await response.text()}`);
  return await response.json();
}

async function getKimiFileContent(fileId, apiKey) {
  const response = await fetch(`https://api.moonshot.cn/v1/files/${fileId}/content`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`Kimi content failed: ${response.status}`);
  return await response.text();
}

// ─── Extract Structured Data ───
async function extractStructuredData(text, reportType, dimensions, apiKeys) {
  const truncated = text.length > 100000 ? text.substring(0, 100000) : text;
  const dimList = dimensions.map(d => `- ${d.name}: ${d.fields.join('、')}`).join('\n');

  const result = await callLLM([
    { role: 'system', content: `你是专业审计师，从${reportType}财报中提取数据。严格输出JSON。` },
    { role: 'user', content: `从以下${reportType}报告提取数据:\n\n检查维度:\n${dimList}\n\n报告内容:\n${truncated}\n\n输出JSON格式，包含company、reportPeriod和各维度数据。数值保留原始单位。` },
  ], 'kimi', apiKeys.kimi, { responseFormat: { type: 'json_object' } });

  try { return JSON.parse(result); } catch { const m = result.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { error: 'parse_failed' }; }
}

// ─── Cross Compare ───
async function crossCompareData(aData, hData, dimensions, apiKeys) {
  const provider = apiKeys['kimi-code'] ? 'kimi-code' : 'kimi';
  const key = apiKeys['kimi-code'] || apiKeys.kimi;

  const result = await callLLM([
    { role: 'system', content: `你是资深审计师，对比A/H股数据。重点关注：数值差异、数据行错位、口径差异、披露遗漏。风险等级：critical(>5%差异)、warning(1-5%)、info(格式差异)。输出JSON。` },
    { role: 'user', content: `对比数据:\nA股:${JSON.stringify(aData)}\nH股:${JSON.stringify(hData)}\n\n输出:{totalChecked,totalDiscrepancies,criticalCount,warningCount,dimensionResults:{维度id:{hasDiscrepancies,discrepancies:[{field,severity,aShareValue,hShareValue,difference,description}]}}}` },
  ], provider, key, { responseFormat: { type: 'json_object' } });

  try { return JSON.parse(result); } catch { const m = result.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { totalChecked: 0, totalDiscrepancies: 0, criticalCount: 0, warningCount: 0, dimensionResults: {} }; }
}

// ─── Generate Report ───
async function generateReport(comparison, aData, hData, apiKeys) {
  const result = await callLLM([
    { role: 'system', content: '你是德勤级审计师，撰写A/H股一致性审核报告。专业术语、风险分级、建议处理方式。输出JSON。' },
    { role: 'user', content: `比对结果:${JSON.stringify(comparison)}\nA股:${aData?.company},期间:${aData?.reportPeriod}\nH股:${hData?.company}\n\n输出:{title,company,reportPeriod,auditDate:"${new Date().toISOString().split('T')[0]}",overallConclusion,riskLevel,keyFindings:[],recommendations:[],detailedFindings:[{id,dimension,field,severity,finding,auditOpinion,suggestedAction}],disclaimer}` },
  ], 'kimi', apiKeys.kimi, { responseFormat: { type: 'json_object' }, temperature: 0.3, maxTokens: 8192 });

  try { return JSON.parse(result); } catch { const m = result.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { title: '审计报告', overallConclusion: '生成异常' }; }
}

// ─── Stock Data ───
async function handleStock(req, res, path) {
  const code = path.replace('/stock/', '');
  const token = process.env.TUSHARE_API_TOKEN;
  if (!token) return res.json({ error: 'TUSHARE not configured' });

  const resp = await fetch('http://api.tushare.pro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_name: 'fina_indicator', token, params: { ts_code: code, limit: 4 } }),
  });
  return res.json(await resp.json());
}

// ─── Available Models ───
function getAvailableModels() {
  return { providers: [
    { id: 'kimi', name: 'Kimi (月之暗面)', models: ['moonshot-v1-128k','moonshot-v1-32k'], recommended: '文本提取' },
    { id: 'kimi-code', name: 'Kimi Code', models: ['kimi-code'], recommended: '数据分析' },
    { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat','deepseek-reasoner'], recommended: '逻辑推理' },
    { id: 'minimax', name: 'MiniMax', models: ['MiniMax-Text-01'], recommended: '超长文本' },
    { id: 'glm', name: 'GLM (智谱)', models: ['glm-4-plus','glm-4-long'], recommended: '中文理解' },
    { id: 'qwen', name: '通义千问', models: ['qwen-max','qwen-plus'], recommended: '综合能力' },
    { id: 'doubao', name: '豆包', models: ['doubao-pro-128k'], recommended: '性价比' },
  ]};
}
