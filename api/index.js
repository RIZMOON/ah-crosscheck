/**
 * Vercel Serverless Function - Main API Entry Point
 * Handles all /api/* routes
 */

import { callLLM, callLLMWithFallback, uploadFileToKimi, getKimiFileContent } from './services/llm-client.js';
import { getModelConfig, updateModelConfig, getConfigForFunction } from './services/model-config.js';
import { fetchStockData } from './services/stock-data.js';

export const config = {
  maxDuration: 300,
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api', '');

  try {
    // Health check
    if (path === '/health' || path === '') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Get model config
    if (path === '/models/config' && req.method === 'GET') {
      return res.json(getModelConfig());
    }

    // Update model config
    if (path === '/models/config' && req.method === 'POST') {
      const config = req.body;
      updateModelConfig(config);
      return res.json({ success: true, config: getModelConfig() });
    }

    // Available models
    if (path === '/models/available') {
      return res.json(getAvailableModels());
    }

    // Stock data
    if (path.startsWith('/stock/')) {
      const code = path.replace('/stock/', '');
      const source = url.searchParams.get('source') || 'tushare';
      const data = await fetchStockData(code, source);
      return res.json(data);
    }

    // Analyze reports
    if (path === '/analyze' && req.method === 'POST') {
      return await handleAnalyze(req, res);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Handle file upload and analysis
 */
async function handleAnalyze(req, res) {
  // For Vercel, we need to handle multipart form data
  // The files come as buffers in req.body when using formidable or similar
  
  // Check if we have the files
  if (!req.body && !req.files) {
    return res.status(400).json({ error: '请上传A股和H股报告文件' });
  }

  let aShareBuffer, hShareBuffer;
  let modelConfig = null;

  // Handle multipart form data (Vercel automatically parses with bodyParser)
  if (req.files) {
    aShareBuffer = req.files.aShareReport?.[0]?.buffer || req.files.aShareReport?.buffer;
    hShareBuffer = req.files.hShareReport?.[0]?.buffer || req.files.hShareReport?.buffer;
  } else if (req.body) {
    // If sent as base64 in JSON body
    if (req.body.aShareBase64 && req.body.hShareBase64) {
      aShareBuffer = Buffer.from(req.body.aShareBase64, 'base64');
      hShareBuffer = Buffer.from(req.body.hShareBase64, 'base64');
    }
    if (req.body.modelConfig) {
      modelConfig = typeof req.body.modelConfig === 'string' 
        ? JSON.parse(req.body.modelConfig) 
        : req.body.modelConfig;
    }
  }

  if (!aShareBuffer || !hShareBuffer) {
    return res.status(400).json({ 
      error: '请同时上传A股和H股报告。提示：请使用multipart/form-data格式上传，或发送base64编码的JSON。' 
    });
  }

  // Run analysis pipeline
  const result = await runAnalysisPipeline(aShareBuffer, hShareBuffer, modelConfig);
  return res.json(result);
}

/**
 * Full analysis pipeline
 */
async function runAnalysisPipeline(aShareBuffer, hShareBuffer, customModelConfig) {
  const startTime = Date.now();

  // Step 1: Upload PDFs to Kimi for text extraction
  console.log('[Pipeline] Step 1: Uploading PDFs to Kimi...');
  const [aFileInfo, hFileInfo] = await Promise.all([
    uploadFileToKimi(aShareBuffer, 'a_share_report.pdf'),
    uploadFileToKimi(hShareBuffer, 'h_share_report.pdf'),
  ]);

  // Step 2: Get extracted text
  console.log('[Pipeline] Step 2: Extracting text...');
  const [aShareText, hShareText] = await Promise.all([
    getKimiFileContent(aFileInfo.id),
    getKimiFileContent(hFileInfo.id),
  ]);

  // Step 3: Extract structured data using LLM
  console.log('[Pipeline] Step 3: Extracting structured data...');
  const extractionConfig = customModelConfig?.extraction || getConfigForFunction('extraction');
  
  const [aShareData, hShareData] = await Promise.all([
    extractStructuredData(aShareText, 'A股', extractionConfig),
    extractStructuredData(hShareText, 'H股', extractionConfig),
  ]);

  // Step 4: Cross-compare using analysis model
  console.log('[Pipeline] Step 4: Cross-comparing...');
  const analysisConfig = customModelConfig?.analysis || getConfigForFunction('analysis');
  const comparison = await crossCompareData(aShareData, hShareData, analysisConfig);

  // Step 5: Generate audit report
  console.log('[Pipeline] Step 5: Generating report...');
  const reportingConfig = customModelConfig?.reporting || getConfigForFunction('reporting');
  const report = await generateAuditReport(comparison, aShareData, hShareData, reportingConfig);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Build dimension results
  const AUDIT_DIMENSIONS = [
    { id: 'financial_core', name: '财务报表核心数据', level: '一级' },
    { id: 'financial_ratios', name: '关键财务比率', level: '一级' },
    { id: 'shares_dividend', name: '股份与分红数据', level: '二级' },
    { id: 'branch_detail', name: '分支机构与明细数据', level: '三级' },
    { id: 'disclosure_text', name: '文本与披露口径', level: '四级' },
  ];

  return {
    status: 'completed',
    duration: `${duration}s`,
    aShareData,
    hShareData,
    comparison,
    report,
    dimensions: AUDIT_DIMENSIONS.map(dim => ({
      ...dim,
      status: comparison.dimensionResults?.[dim.id]?.hasDiscrepancies ? 'warning' : 'pass',
      discrepancies: comparison.dimensionResults?.[dim.id]?.discrepancies?.length || 0,
    })),
    summary: {
      totalChecked: comparison.totalChecked || 0,
      discrepancies: comparison.totalDiscrepancies || 0,
      critical: comparison.criticalCount || 0,
      warning: comparison.warningCount || 0,
      passed: (comparison.totalChecked || 0) - (comparison.totalDiscrepancies || 0),
    },
  };
}

/**
 * Extract structured financial data from text
 */
async function extractStructuredData(text, reportType, config) {
  const truncatedText = text.length > 120000 ? text.substring(0, 120000) : text;

  const systemPrompt = `你是一位专业的审计师，精通中国A股和香港H股财务报告的分析。
你的任务是从${reportType}财务报告中提取关键数据。请严格按照JSON格式输出。

提取维度：
1. 财务报表核心数据：资产总额、负债总额、所有者权益、归母权益、营业收入、营业利润、净利润、归母净利润、基本每股收益、经营/投资/筹资活动现金流净额
2. 关键财务比率：加权平均ROE、总资产回报率、净息差、不良贷款率、拨备覆盖率、资本充足率、核心一级资本充足率、杠杆率
3. 股份与分红：普通股总数、H股数量、A股数量、基本/稀释每股收益、每股净资产、每股分红、分红总额、分红比例
4. 分支机构明细：各主要分行/子公司的资产规模、收入、利润（列出所有能找到的）
5. 文本披露：重要会计估计表述、风险描述、报告期间、董事会日期、审计报告日期

注意：数值保留原始单位并标注，未找到的标记为null。`;

  const userPrompt = `请从以下${reportType}财务报告中提取结构化数据，以JSON格式输出：

${truncatedText}

输出JSON格式：
{
  "company": "公司名称",
  "reportType": "${reportType}",
  "reportPeriod": "报告期间",
  "financialCore": {
    "totalAssets": {"value": 数值, "unit": "单位", "page": "页码"},
    "totalLiabilities": {"value": 数值, "unit": "单位", "page": "页码"},
    "totalEquity": {"value": 数值, "unit": "单位", "page": "页码"},
    "parentEquity": {"value": 数值, "unit": "单位", "page": "页码"},
    "revenue": {"value": 数值, "unit": "单位", "page": "页码"},
    "operatingProfit": {"value": 数值, "unit": "单位", "page": "页码"},
    "netProfit": {"value": 数值, "unit": "单位", "page": "页码"},
    "parentNetProfit": {"value": 数值, "unit": "单位", "page": "页码"},
    "eps": {"value": 数值, "unit": "元/股", "page": "页码"},
    "operatingCashFlow": {"value": 数值, "unit": "单位", "page": "页码"},
    "investingCashFlow": {"value": 数值, "unit": "单位", "page": "页码"},
    "financingCashFlow": {"value": 数值, "unit": "单位", "page": "页码"}
  },
  "financialRatios": {
    "roe": {"value": 数值, "unit": "%"},
    "roa": {"value": 数值, "unit": "%"},
    "nim": {"value": 数值, "unit": "%"},
    "nplRatio": {"value": 数值, "unit": "%"},
    "provisionCoverage": {"value": 数值, "unit": "%"},
    "car": {"value": 数值, "unit": "%"},
    "cet1Ratio": {"value": 数值, "unit": "%"},
    "leverageRatio": {"value": 数值, "unit": "%"}
  },
  "sharesDividend": {
    "totalShares": {"value": 数值, "unit": "股"},
    "hShares": {"value": 数值, "unit": "股"},
    "aShares": {"value": 数值, "unit": "股"},
    "eps": {"value": 数值, "unit": "元/股"},
    "dilutedEps": {"value": 数值, "unit": "元/股"},
    "bvps": {"value": 数值, "unit": "元/股"},
    "dps": {"value": 数值, "unit": "元/股"},
    "totalDividend": {"value": 数值, "unit": "单位"},
    "payoutRatio": {"value": 数值, "unit": "%"}
  },
  "branchDetails": [
    {"name": "分支名", "assets": 数值, "revenue": 数值, "profit": 数值, "unit": "单位"}
  ],
  "disclosureText": {
    "accountingEstimates": "重要会计估计表述摘要",
    "riskDescription": "风险描述摘要",
    "reportPeriod": "报告期间",
    "boardDate": "董事会日期",
    "auditDate": "审计报告日期"
  }
}`;

  const result = await callLLMWithFallback(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      temperature: 0.1,
      maxTokens: 16384,
      responseFormat: { type: 'json_object' },
      fallbackProvider: 'minimax',
    }
  );

  try {
    return JSON.parse(result.content);
  } catch (e) {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error(`${reportType}数据提取失败: 无法解析LLM返回的JSON`);
  }
}

/**
 * Cross-compare A-share and H-share data
 */
async function crossCompareData(aShareData, hShareData, config) {
  const systemPrompt = `你是一位资深审计师，专门负责A股和H股财务报告的一致性审核。
你的任务是对比两份报告的数据，找出所有不一致之处。像光大银行2026年事件那样，重点关注：
1. 数值差异（考虑汇率和单位后）
2. 数据行错位（分支机构数据排版错乱）
3. 口径差异
4. 披露遗漏
5. 翻译不一致

风险等级：
- critical：数值差异>5%，或关键指标缺失/错位
- warning：差异1%-5%，或非关键信息不一致
- info：纯格式/翻译差异

输出严格JSON格式。`;

  const userPrompt = `对比以下A股和H股数据：

A股数据：
${JSON.stringify(aShareData, null, 2)}

H股数据：
${JSON.stringify(hShareData, null, 2)}

输出JSON：
{
  "totalChecked": 检查项总数,
  "totalDiscrepancies": 差异总数,
  "criticalCount": 严重数,
  "warningCount": 警告数,
  "dimensionResults": {
    "financial_core": {
      "hasDiscrepancies": true/false,
      "discrepancies": [{"field":"字段","category":"类别","severity":"critical/warning/info","aShareValue":"A股值","hShareValue":"H股值","difference":"差异描述","aSharePage":"页码","hSharePage":"页码","description":"详细说明"}]
    },
    "financial_ratios": {...},
    "shares_dividend": {...},
    "branch_detail": {...},
    "disclosure_text": {...}
  }
}`;

  const result = await callLLMWithFallback(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      temperature: 0.1,
      maxTokens: 16384,
      responseFormat: { type: 'json_object' },
      fallbackProvider: 'minimax',
    }
  );

  try {
    return JSON.parse(result.content);
  } catch (e) {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('比对结果解析失败');
  }
}

/**
 * Generate audit report
 */
async function generateAuditReport(comparison, aShareData, hShareData, config) {
  const systemPrompt = `你是一位德勤级别的高级审计师，负责撰写A/H股财报一致性审核报告。
基于比对结果生成专业审计工作底稿格式报告。要求：
1. 使用专业审计术语
2. 对每个差异给出明确审计意见和建议
3. 按风险等级排序
4. 包含总体结论和建议
5. 标注需进一步核实的事项`;

  const userPrompt = `基于以下比对结果生成审计报告：

比对结果：${JSON.stringify(comparison, null, 2)}
A股公司：${aShareData?.company || '未知'}，报告期：${aShareData?.reportPeriod || '未知'}
H股公司：${hShareData?.company || '未知'}，报告期：${hShareData?.reportPeriod || '未知'}

输出JSON：
{
  "title": "报告标题",
  "company": "公司名称",
  "reportPeriod": "报告期间",
  "auditDate": "${new Date().toISOString().split('T')[0]}",
  "overallConclusion": "总体结论",
  "riskLevel": "high/medium/low",
  "keyFindings": ["发现1", "发现2"],
  "recommendations": ["建议1", "建议2"],
  "detailedFindings": [{"id":1,"dimension":"维度","field":"字段","severity":"级别","finding":"发现","auditOpinion":"意见","suggestedAction":"建议"}],
  "disclaimer": "本报告仅供审计参考，不构成任何投资建议。"
}`;

  const result = await callLLMWithFallback(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      temperature: 0.3,
      maxTokens: 8192,
      responseFormat: { type: 'json_object' },
      fallbackProvider: 'minimax',
    }
  );

  try {
    return JSON.parse(result.content);
  } catch (e) {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { title: '审计报告', overallConclusion: '报告生成异常，请重试', riskLevel: 'unknown' };
  }
}

function getAvailableModels() {
  return {
    providers: [
      { id: 'kimi', name: 'Kimi (月之暗面)', models: [
        { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', context: 128000, type: 'general' },
        { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', context: 32000, type: 'general' },
      ]},
      { id: 'kimi-code', name: 'Kimi Code', models: [
        { id: 'kimi-code', name: 'Kimi Code', context: 128000, type: 'code' },
      ]},
      { id: 'deepseek', name: 'DeepSeek', models: [
        { id: 'deepseek-chat', name: 'DeepSeek V3', context: 128000, type: 'general' },
        { id: 'deepseek-reasoner', name: 'DeepSeek R1', context: 64000, type: 'reasoning' },
      ]},
      { id: 'minimax', name: 'MiniMax', models: [
        { id: 'MiniMax-Text-01', name: 'MiniMax Text 01', context: 1000000, type: 'general' },
      ]},
      { id: 'glm', name: 'GLM (智谱)', models: [
        { id: 'glm-4-plus', name: 'GLM-4 Plus', context: 128000, type: 'general' },
      ]},
      { id: 'qwen', name: '通义千问', models: [
        { id: 'qwen-max', name: 'Qwen Max', context: 32000, type: 'general' },
        { id: 'qwen-plus', name: 'Qwen Plus', context: 131072, type: 'general' },
      ]},
      { id: 'doubao', name: '豆包 (字节)', models: [
        { id: 'doubao-pro-128k', name: '豆包 Pro 128K', context: 128000, type: 'general' },
      ]},
    ],
  };
}
