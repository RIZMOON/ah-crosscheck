/**
 * Frontend API Client - Supports SSE streaming
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AnalysisResult {
  status: string; duration: string; aShareData: any; hShareData: any;
  comparison: any; report: any; dimensions: any[]; summary: AnalysisSummary;
}
export interface AnalysisSummary { totalChecked: number; discrepancies: number; critical: number; warning: number; passed: number; }
export interface StreamEvent { type: string; [key: string]: any; }
export interface AuditDimension { id: string; name: string; enabled: boolean; fields: string[]; }
export interface UserApiKeys { kimi?: string; kimiCode?: string; deepseek?: string; minimax?: string; glm?: string; qwen?: string; doubao?: string; }

/**
 * Streaming analysis with SSE
 */
export async function analyzeReportsStream(
  aShareFile: File, hShareFile: File,
  options: { apiKeys?: UserApiKeys; dimensions?: AuditDimension[]; },
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const [aBase64, hBase64] = await Promise.all([fileToBase64(aShareFile), fileToBase64(hShareFile)]);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aShareBase64: aBase64, hShareBase64: hBase64,
      apiKeys: options.apiKeys || {},
      dimensions: options.dimensions,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Failed: ${response.status}`);
  }

  // Check if SSE
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try { onEvent(JSON.parse(data)); } catch {}
        }
      }
    }
  } else {
    // Fallback: non-streaming JSON response
    const result = await response.json();
    onEvent({ type: 'complete', result });
  }
}

/**
 * Get default audit dimensions
 */
export async function getAuditDimensions(): Promise<AuditDimension[]> {
  try {
    const res = await fetch(`${API_BASE}/dimensions`);
    const data = await res.json();
    return data.dimensions;
  } catch {
    return [
      { id: 'financial_core', name: '财务报表核心数据', enabled: true, fields: ['资产总额','负债总额','所有者权益','归母权益','营业收入','净利润','归母净利润','基本每股收益','经营活动现金流'] },
      { id: 'financial_ratios', name: '关键财务比率', enabled: true, fields: ['ROE','ROA','净息差','不良贷款率','拨备覆盖率','资本充足率','核心一级资本充足率'] },
      { id: 'shares_dividend', name: '股份与分红数据', enabled: true, fields: ['普通股总数','H股数量','A股数量','每股收益','每股净资产','每股分红','分红比例'] },
      { id: 'branch_detail', name: '分支机构与明细数据', enabled: true, fields: ['各分行资产规模','地区分布收入','地区分布利润','重要子公司数据'] },
      { id: 'disclosure_text', name: '文本与披露口径', enabled: true, fields: ['会计估计表述','风险描述','报告期间','董事会日期','审计报告日期'] },
    ];
  }
}

export async function getAvailableModels(): Promise<any> {
  const res = await fetch(`${API_BASE}/models/available`);
  return res.ok ? res.json() : { providers: [] };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
