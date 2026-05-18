/**
 * LLM Client - Unified interface for multiple LLM providers
 */

const PROVIDER_CONFIGS = {
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-128k',
  },
  'kimi-code': {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'kimi-code',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  minimax: {
    baseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-Text-01',
  },
  glm: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-plus',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-max',
  },
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-pro-128k',
  },
};

/**
 * Call LLM API with OpenAI-compatible interface
 */
export async function callLLM(messages, options = {}) {
  const {
    provider = 'kimi',
    model,
    apiKey,
    temperature = 0.1,
    maxTokens = 8192,
    responseFormat,
  } = options;

  const config = PROVIDER_CONFIGS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const resolvedModel = model || config.defaultModel;
  const resolvedApiKey = apiKey || getApiKeyForProvider(provider);
  if (!resolvedApiKey) throw new Error(`No API key for provider: ${provider}`);

  const requestBody = {
    model: resolvedModel,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat) {
    requestBody.response_format = responseFormat;
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resolvedApiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error (${provider}/${resolvedModel}): ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
    model: resolvedModel,
    provider,
  };
}

/**
 * Call LLM with automatic fallback
 */
export async function callLLMWithFallback(messages, options = {}) {
  const { fallbackProvider = 'minimax', fallbackApiKey, ...primaryOptions } = options;

  try {
    return await callLLM(messages, primaryOptions);
  } catch (error) {
    console.warn(`Primary LLM failed (${primaryOptions.provider}), falling back to ${fallbackProvider}:`, error.message);
    return await callLLM(messages, {
      ...primaryOptions,
      provider: fallbackProvider,
      apiKey: fallbackApiKey || getApiKeyForProvider(fallbackProvider),
      model: PROVIDER_CONFIGS[fallbackProvider]?.defaultModel,
    });
  }
}

/**
 * Get API key from environment variables
 */
function getApiKeyForProvider(provider) {
  const envMap = {
    'kimi': process.env.KIMI_API_KEY,
    'kimi-code': process.env.KIMI_CODE_API_KEY,
    'deepseek': process.env.DEEPSEEK_API_KEY,
    'minimax': process.env.MINIMAX_API_KEY,
    'glm': process.env.GLM_API_KEY,
    'qwen': process.env.QWEN_API_KEY,
    'doubao': process.env.DOUBAO_API_KEY,
  };
  return envMap[provider] || null;
}

/**
 * Upload file to Kimi for extraction
 */
export async function uploadFileToKimi(buffer, filename) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY not configured');

  // Use Node.js compatible FormData
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  
  const header = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    'Content-Type: application/pdf',
    '',
  ].join('\r\n');
  
  const footer = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\nfile-extract\r\n--${boundary}--`;
  
  const headerBuffer = Buffer.from(header + '\r\n');
  const footerBuffer = Buffer.from(footer);
  const body = Buffer.concat([headerBuffer, buffer, footerBuffer]);

  const response = await fetch('https://api.moonshot.cn/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kimi file upload failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Get file content from Kimi
 */
export async function getKimiFileContent(fileId) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY not configured');

  const response = await fetch(`https://api.moonshot.cn/v1/files/${fileId}/content`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kimi file content failed: ${response.status} - ${errorText}`);
  }

  return await response.text();
}
