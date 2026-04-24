const FINNHUB_API_KEY = 'cvkm3qpr01qrtjej98g0cvkm3qpr01qrtjej98g1';
const TWELVE_DATA_KEY = '7151c83bb0574ba5bdfbdc046196f36a';  // 可换成自己的免费API Key

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

    if (source !== 'eastmoney' && source !== 'tencent' && source !== 'sina' && !symbol) {
      return new Response(JSON.stringify({ error: 'Missing symbol parameter' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      let apiUrl, response, data;

      if (source === 'yahoo') {
        // Twelve Data 作为主要源（Cloudflare IP能访问）
        try {
          const tdResp = await fetch(
            `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_KEY}`,
            { cf: { cacheTtl: 30 } }
          );
          if (tdResp.ok) {
            const tdData = await tdResp.json();
            if (tdData.price) {
              // Twelve Data 返回格式
              return new Response(JSON.stringify({
                chart: {
                  result: [{
                    meta: {
                      regularMarketPrice: parseFloat(tdData.price),
                      chartPreviousClose: parseFloat(tdData.previous_close || tdData.price),
                      regularMarketDayHigh: parseFloat(tdData.high || tdData.price),
                      regularMarketDayLow: parseFloat(tdData.low || tdData.price),
                      symbol: symbol
                    }
                  }]
                }
              }), {
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, OPTIONS'
                }
              });
            }
          }
        } catch (e) {
          // Twelve Data 失败，尝试 Yahoo
        }

        // Yahoo Finance - 遍历多个节点
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
          return new Response(JSON.stringify({ error: 'All endpoints failed' }), {
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
      } else if (source === 'sina') {
        // 新浪财经 A股
        const SinaUrl = url.searchParams.get('url');
        response = await fetch(SinaUrl, {
          headers: {
            'Referer': 'https://finance.sina.com.cn/',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        data = await response.text();
      } else if (source === 'tencent') {
        // 腾讯财经 A股
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

      return new Response(data || '{}', {
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
