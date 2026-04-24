// Cloudflare Worker - Finnhub API 代理
// 部署到 Cloudflare Workers，免费额度足够个人使用

const FINNHUB_API_KEY = 'cvkm3qpr01qtnb8tgt50cvkm3qpr01qtnb8tgt5g';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const endpoint = url.searchParams.get('endpoint') || 'quote';

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Missing symbol parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      let apiUrl;
      
      if (endpoint === 'quote') {
        apiUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      } else if (endpoint === 'companyProfile') {
        apiUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      } else if (endpoint === 'metrics') {
        apiUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`;
      } else {
        return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch(apiUrl);
      const data = await response.text();
      
      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
