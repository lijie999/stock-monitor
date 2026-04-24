const FINNHUB_API_KEY='cvkm3qpr01qtnb8tgt50cvkm3qpr01qtnb8tgt5g';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const source = url.searchParams.get('source') || 'yahoo';

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Missing symbol parameter' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      let apiUrl, response, data;

      if (source === 'yahoo') {
        // Yahoo Finance API - 美股加密指数
        apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        response = await fetch(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        data = await response.text();
      } else if (source === 'eastmoney') {
        // 东方财富 A股
        response = await fetch(url.searchParams.get('url'), {
          headers: {
            'Referer': 'https://quote.eastmoney.com/',
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
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
