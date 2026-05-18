/**
 * Stock Data Service
 * Integrates TuShare and AKShare for reference data
 */

const TUSHARE_API_URL = 'http://api.tushare.pro';

/**
 * Fetch stock data from specified source
 */
export async function fetchStockData(stockCode, source = 'tushare') {
  if (source === 'tushare') {
    return await fetchFromTuShare(stockCode);
  } else if (source === 'akshare') {
    return await fetchFromAKShare(stockCode);
  }
  throw new Error(`Unknown data source: ${source}`);
}

/**
 * Fetch data from TuShare API
 */
async function fetchFromTuShare(stockCode) {
  const token = process.env.TUSHARE_API_TOKEN;
  if (!token) {
    throw new Error('TUSHARE_API_TOKEN not configured');
  }

  // Fetch basic company info
  const basicInfo = await tushareRequest(token, 'stock_basic', {
    ts_code: stockCode,
    fields: 'ts_code,symbol,name,area,industry,market,list_date',
  });

  // Fetch latest financial data
  const financialData = await tushareRequest(token, 'fina_indicator', {
    ts_code: stockCode,
    limit: 4,
    fields: 'ts_code,ann_date,end_date,eps,bps,roe,roa,debt_to_assets,netprofit_yoy,or_yoy',
  });

  // Fetch income statement
  const incomeData = await tushareRequest(token, 'income', {
    ts_code: stockCode,
    limit: 4,
    fields: 'ts_code,ann_date,end_date,total_revenue,operate_profit,n_income,n_income_attr_p',
  });

  // Fetch balance sheet
  const balanceData = await tushareRequest(token, 'balancesheet', {
    ts_code: stockCode,
    limit: 4,
    fields: 'ts_code,ann_date,end_date,total_assets,total_liab,total_hldr_eqy_exc_min_int',
  });

  // Fetch dividend data
  const dividendData = await tushareRequest(token, 'dividend', {
    ts_code: stockCode,
    fields: 'ts_code,end_date,ann_date,div_proc,stk_div,cash_div,cash_div_tax,record_date,ex_date,pay_date',
  });

  return {
    source: 'tushare',
    stockCode,
    basicInfo: basicInfo?.data?.items?.[0] || null,
    financialIndicators: formatTuShareData(financialData),
    incomeStatement: formatTuShareData(incomeData),
    balanceSheet: formatTuShareData(balanceData),
    dividend: formatTuShareData(dividendData),
  };
}

/**
 * Make TuShare API request
 */
async function tushareRequest(token, apiName, params) {
  const response = await fetch(TUSHARE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_name: apiName,
      token: token,
      params: params,
    }),
  });

  if (!response.ok) {
    throw new Error(`TuShare API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Format TuShare response data
 */
function formatTuShareData(response) {
  if (!response?.data?.fields || !response?.data?.items) {
    return [];
  }

  const { fields, items } = response.data;
  return items.map(item => {
    const obj = {};
    fields.forEach((field, idx) => {
      obj[field] = item[idx];
    });
    return obj;
  });
}

/**
 * Fetch data from AKShare (via HTTP API)
 * AKShare provides a REST API for Chinese stock market data
 */
async function fetchFromAKShare(stockCode) {
  // AKShare HTTP API endpoint (self-hosted or public)
  const baseUrl = process.env.AKSHARE_API_URL || 'https://akshare.akfamily.xyz';
  
  try {
    // Fetch financial report data
    const symbol = stockCode.replace('.SH', '').replace('.SZ', '');
    
    // Balance sheet
    const balanceRes = await fetch(`${baseUrl}/api/public/stock_financial_report_sina?stock=${symbol}&symbol=balancesheet`);
    const balanceData = balanceRes.ok ? await balanceRes.json() : null;

    // Profit statement
    const profitRes = await fetch(`${baseUrl}/api/public/stock_financial_report_sina?stock=${symbol}&symbol=profit`);
    const profitData = profitRes.ok ? await profitRes.json() : null;

    // Cash flow
    const cashflowRes = await fetch(`${baseUrl}/api/public/stock_financial_report_sina?stock=${symbol}&symbol=cashflow`);
    const cashflowData = cashflowRes.ok ? await cashflowRes.json() : null;

    return {
      source: 'akshare',
      stockCode,
      balanceSheet: balanceData,
      profitStatement: profitData,
      cashFlow: cashflowData,
    };
  } catch (error) {
    console.error('AKShare fetch error:', error.message);
    return {
      source: 'akshare',
      stockCode,
      error: error.message,
      note: 'AKShare数据获取失败，请检查网络连接或API配置',
    };
  }
}

/**
 * Get H-share corresponding stock code
 * Maps A-share code to H-share code for cross-reference
 */
export function getAHPairCode(aShareCode) {
  // Common A+H pairs (can be extended)
  const ahPairs = {
    '601398.SH': '01398.HK', // 工商银行
    '601939.SH': '01939.HK', // 建设银行
    '601288.SH': '01288.HK', // 农业银行
    '601988.SH': '03988.HK', // 中国银行
    '601328.SH': '01328.HK', // 交通银行
    '600036.SH': '03968.HK', // 招商银行
    '601818.SH': '01818.HK', // 光大银行
    '600016.SH': '01988.HK', // 民生银行
    '601166.SH': '06837.HK', // 兴业银行
    '600000.SH': '03958.HK', // 浦发银行
    '601601.SH': '02601.HK', // 中国太保
    '601318.SH': '02318.HK', // 中国平安
    '601628.SH': '02628.HK', // 中国人寿
    '600028.SH': '00386.HK', // 中国石化
    '601857.SH': '00857.HK', // 中国石油
  };
  return ahPairs[aShareCode] || null;
}
