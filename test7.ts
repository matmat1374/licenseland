import { getProducts } from './src/lib/queries';

async function main() {
  const aiProducts = await getProducts({ category: "ai", sort: "popular", limit: 50 });
  console.log('AI Products:', aiProducts.map(p => p.title));
}

main().catch(console.error);
