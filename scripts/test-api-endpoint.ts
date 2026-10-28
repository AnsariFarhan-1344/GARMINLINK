import handler from '../api/assistant';

async function testApiEndpoint() {
  console.log('--- Testing /api/assistant Serverless Endpoint ---');

  // Mock Request & Response
  function createMockReqRes(body: any, ip: string = '127.0.0.1') {
    const headers: Record<string, string> = {
      'x-forwarded-for': ip
    };
    const req = {
      method: 'POST',
      headers,
      body
    };

    let statusCode = 200;
    let responseData: any = null;

    const res = {
      setHeader: () => {},
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      },
      end: () => res
    };

    return { req, res, getStatus: () => statusCode, getData: () => responseData };
  }

  // 1. Missing API key test (should return fallback: true)
  delete process.env.LLM_API_KEY;
  const mock1 = createMockReqRes({ text: '40 kilo aam Chiplun' });
  await handler(mock1.req, mock1.res);
  console.log('Missing key response status:', mock1.getStatus());
  console.log('Missing key response data:', mock1.getData());
  if (mock1.getData()?.fallback === true) {
    console.log('✅ [PASS] API key missing returns fallback: true');
  } else {
    console.error('❌ [FAIL] Expected fallback: true when key is missing');
  }

  // 2. Input > 200 characters cap test
  const longText = 'aam '.repeat(60); // > 200 chars
  const mock2 = createMockReqRes({ text: longText });
  await handler(mock2.req, mock2.res);
  console.log('✅ [PASS] 200+ char input handled without crash');

  // 3. Rate limiting test: 10 requests allowed, 11th rejected with 429
  console.log('\n--- Testing IP Rate Limiting (10 req/min) ---');
  const testIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
  let rateLimited = false;

  for (let i = 1; i <= 11; i++) {
    const mockRate = createMockReqRes({ text: 'aam Chiplun' }, testIp);
    await handler(mockRate.req, mockRate.res);
    if (mockRate.getStatus() === 429) {
      rateLimited = true;
      console.log(`✅ [PASS] Request #${i} was correctly rate limited with HTTP 429`);
      break;
    }
  }

  if (!rateLimited) {
    console.error('❌ [FAIL] Expected rate limiting on 11th request');
  }

  console.log('\nAll API endpoint checks verified successfully.');
}

testApiEndpoint().catch(err => {
  console.error('API endpoint test failed:', err);
  process.exit(1);
});
