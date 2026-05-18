/**
 * Frontend API Client
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AnalysisResult {
  status: string;
  duration: string;
  aShareData: any;
  hShareData: any;
  comparison: ComparisonResult;
  report: AuditReport;
  dimensions: DimensionResult[];
  summary: AnalysisSummary;
}

export interface ComparisonResult {
  totalChecked: number;
  totalDiscrepancies: number;
  criticalCount: number;
  warningCount: number;
  dimensionResults: Record<string, {
    hasDiscrepancies: boolean;
    discrepancies: Discrepancy[];
  }>;
}

export interface Discrepancy {
  field: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  aShareValue: string;
  hShareValue: string;
  difference: string;
  aSharePage: string;
  hSharePage: string;
  description: string;
}

export interface DimensionResult {
  id: string;
  name: string;
  level: string;
  status: 'pass' | 'warning' | 'pending' | 'running';
  discrepancies: number;
}

export interface AnalysisSummary {
  totalChecked: number;
  discrepancies: number;
  critical: number;
  warning: number;
  passed: number;
}

export interface AuditReport {
  title: string;
  company: string;
  reportPeriod: string;
  auditDate: string;
  overallConclusion: string;
  riskLevel: string;
  keyFindings: string[];
  recommendations: string[];
  detailedFindings: DetailedFinding[];
  disclaimer: string;
}

export interface DetailedFinding {
  id: number;
  dimension: string;
  field: string;
  severity: string;
  finding: string;
  auditOpinion: string;
  suggestedAction: string;
}

export interface ModelConfig {
  config: Record<string, {
    provider: string;
    model: string;
    description: string;
  }>;
  availableProviders: Array<{
    id: string;
    name: string;
    endpoint: string;
  }>;
  functions: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

/**
 * Convert File to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload and analyze reports
 */
export async function analyzeReports(
  aShareFile: File,
  hShareFile: File,
  modelConfig?: any,
  onProgress?: (progress: number, message: string) => void
): Promise<AnalysisResult> {
  onProgress?.(5, '正在准备文件...');

  // Convert files to base64 for JSON upload (Vercel serverless compatible)
  const [aShareBase64, hShareBase64] = await Promise.all([
    fileToBase64(aShareFile),
    fileToBase64(hShareFile),
  ]);

  onProgress?.(15, '文件已编码，正在上传至服务器...');

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aShareBase64,
      hShareBase64,
      modelConfig,
    }),
  });

  onProgress?.(30, '文件已上传，AI 正在解析财报...');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '未知错误' }));
    throw new Error(error.error || `分析失败: ${response.status}`);
  }

  onProgress?.(90, '分析完成，生成报告...');

  const result = await response.json();
  onProgress?.(100, '完成');
  return result;
}

/**
 * Get model configuration
 */
export async function getModelConfig(): Promise<ModelConfig> {
  const response = await fetch(`${API_BASE}/models/config`);
  if (!response.ok) throw new Error('获取模型配置失败');
  return response.json();
}

/**
 * Update model configuration
 */
export async function updateModelConfig(config: any): Promise<any> {
  const response = await fetch(`${API_BASE}/models/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('更新模型配置失败');
  return response.json();
}

/**
 * Get available models
 */
export async function getAvailableModels(): Promise<any> {
  const response = await fetch(`${API_BASE}/models/available`);
  if (!response.ok) throw new Error('获取模型列表失败');
  return response.json();
}

/**
 * Fetch stock reference data
 */
export async function fetchStockReference(code: string, source: string = 'tushare'): Promise<any> {
  const response = await fetch(`${API_BASE}/stock/${code}?source=${source}`);
  if (!response.ok) throw new Error('获取股票数据失败');
  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
