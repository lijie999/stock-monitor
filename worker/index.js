const FINNHUB_API_KEY = 'cvkm3qpr01qrtjej98g0cvkm3qpr01qrtjej98g1';

const YAHOO_ENDPOINTS = [
  'https://query1.finance.yahoo.com',
  'https://query2.finance.yahoo.com',
  'https://finance.pae.baidu.com'
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const source = url.searchParams.get('source') || 'yahoo';

    if (source !== 'eastmoney' && source !== 'tencent' && !symbol) {
      return new Response(JSON.stringify({ error: 'Missing symbol parameter' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      let apiUrl, response, data;

      if (source === 'yahoo') {
        // Yahoo Finance API - 遍历多个节点，找一个能用的
        const symbolEncoded = encodeURIComponent(symbol);
        for (const base of YAHOO_ENDPOINTS) {
          try {
            apiUrl = `${base}/v8/finance/chart/${symbolEncoded}?interval=1d&range=1d`;
            response = await fetch(apiUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              cf: { cacheTtl: 60 }
            });
            if (response.ok) {
              data = await response.text();
              break;
            }
          } catch (e) {
            continue;
          }
        }
        if (!data) {
          return new Response(JSON.stringify({ error: 'All Yahoo endpoints failed' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      } else if (source === 'eastmoney') {
        // 东方财富 A股
        response = await fetch(url.searchParams.get('url'), {
          headers: {
            'Referer': 'https://quote.eastmoney.com/',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        data = await response.text();
      } else if (source === 'tencent') {
        // 腾讯财经 A股 - 直接代理
        const TencentUrl = url.searchParams.get('url');
        response = await fetch(TencentUrl, {
          headers: {
            'Referer': 'https://finance.qq.com/',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        data = await response.text();
      } else {
        // Finnhub 默认
        apiUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        response = await fetch(apiUrl);
        data = await response.text();
      }

      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
