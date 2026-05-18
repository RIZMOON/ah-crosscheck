/**
 * Model Configuration Service
 * Manages which model/provider is used for each function
 */

// Default configuration
let currentConfig = {
  extraction: {
    provider: 'kimi',
    model: 'moonshot-v1-128k',
    description: '文本提取与解析',
  },
  analysis: {
    provider: 'kimi-code',
    model: 'kimi-code',
    description: '数据分析与比对',
  },
  reporting: {
    provider: 'kimi',
    model: 'moonshot-v1-128k',
    description: '报告生成与总结',
  },
  fallback: {
    provider: 'minimax',
    model: 'MiniMax-Text-01',
    description: '备选模型',
  },
};

export function getModelConfig() {
  return {
    config: currentConfig,
    availableProviders: [
      { id: 'kimi', name: 'Kimi (月之暗面)', endpoint: 'https://api.moonshot.cn/v1' },
      { id: 'kimi-code', name: 'Kimi Code', endpoint: 'https://api.moonshot.cn/v1' },
      { id: 'deepseek', name: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1' },
      { id: 'minimax', name: 'MiniMax', endpoint: 'https://api.minimax.chat/v1' },
      { id: 'glm', name: 'GLM (智谱)', endpoint: 'https://open.bigmodel.cn/api/paas/v4' },
      { id: 'qwen', name: '通义千问', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
      { id: 'doubao', name: '豆包 (字节)', endpoint: 'https://ark.cn-beijing.volces.com/api/v3' },
    ],
    functions: [
      { id: 'extraction', name: '文本提取', description: 'PDF文档解析与文本提取' },
      { id: 'analysis', name: '数据分析', description: '财务数据比对与差异分析' },
      { id: 'reporting', name: '报告生成', description: '审计报告撰写与总结' },
      { id: 'fallback', name: '备选模型', description: '主模型不可用时自动切换' },
    ],
  };
}

export function updateModelConfig(newConfig) {
  if (!newConfig || typeof newConfig !== 'object') {
    throw new Error('Invalid configuration format');
  }
  const validFunctions = ['extraction', 'analysis', 'reporting', 'fallback'];
  for (const [funcId, funcConfig] of Object.entries(newConfig)) {
    if (validFunctions.includes(funcId) && funcConfig.provider) {
      currentConfig[funcId] = { ...currentConfig[funcId], ...funcConfig };
    }
  }
  return currentConfig;
}

export function getConfigForFunction(funcId) {
  return currentConfig[funcId] || currentConfig.fallback;
}
