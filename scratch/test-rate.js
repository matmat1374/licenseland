const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const sources = [
    {
      name: "Wallex",
      url: "https://api.wallex.ir/v1/markets",
      parse: (d) => {
        const p = Number(d?.result?.symbols?.USDTTMN?.stats?.lastPrice);
        return p > 10000 ? Math.round(p) : null;
      },
    },
    {
      name: "Ramzinex",
      url: "https://publicapi.ramzinex.com/exchange/api/v1.0/exchange/pairs/11",
      parse: (d) => {
        const p = Number(d?.data?.sell || d?.data?.last_price) / 10;
        return p > 10000 ? Math.round(p) : null;
      },
    }
  ];

  for (const src of sources) {
    try {
      const res = await fetch(src.url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(3500)
      });
      const data = await res.json();
      const rate = src.parse(data);
      console.log(src.name, 'Fetched Rate:', rate, 'Toman');
      if (rate) {
        await prisma.setting.upsert({
          where: { key: 'usd_to_toman_rate_auto' },
          create: { key: 'usd_to_toman_rate_auto', value: String(rate) },
          update: { value: String(rate) },
        });
        break;
      }
    } catch(e) {
      console.log(src.name, 'error:', e.message);
    }
  }

  const s = await prisma.setting.findUnique({ where: { key: 'usd_to_toman_rate_auto' } });
  console.log('Saved in DB setting usd_to_toman_rate_auto:', s?.value);
}

test().catch(console.error).finally(() => prisma.$disconnect());
