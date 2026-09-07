// @ts-nocheck
import { db } from "../src/lib/db";
import { getSupplierApiKey, localizeProduct, categorizeProduct } from "../src/lib/supplier";

async function main() {
  const apiKey = await getSupplierApiKey();
  console.log("Fetching supplier products...");
  const res = await fetch("https://api.irmarket.store/api/buyer/products", {
    headers: { "X-API-Key": apiKey }
  });
  
  if (!res.ok) {
    console.error("Failed to fetch supplier products:", await res.text());
    process.exit(1);
  }

  const supplierData = await res.json();
  const spProducts = Array.isArray(supplierData) ? supplierData : (supplierData.data || []);
  const spMap = new Map();
  for (const sp of spProducts) {
    spMap.set(String(sp.id), sp);
  }
  
  console.log(`Loaded ${spMap.size} products from supplier.`);

  const localProducts = await db.product.findMany();
  console.log(`Checking ${localProducts.length} local products...`);

  let updatedCount = 0;
  let outOfAiCount = 0;

  for (const p of localProducts) {
    let spId = p.id;
    let localPriceUsd = 0;
    try {
        const specs = JSON.parse(p.specifications || "{}");
        if (specs.supplier_product_id) spId = String(specs.supplier_product_id);
        if (specs.price_usd) localPriceUsd = Number(specs.price_usd);
    } catch(e) {}
    
    let sp = spMap.get(spId);
    
    if (!sp) {
      sp = spProducts.find((s: any) => p.title.includes(s.name || s.title) || (s.name || s.title).includes(p.title) || p.shortDesc.includes(s.name || s.title));
    }
    
    // We can just use the sp object if available, otherwise just use local product data
    const fakeSp = sp || { title: p.shortDesc || p.title, name: p.shortDesc, category: p.category, price_usd: localPriceUsd };
    
    const cat = categorizeProduct(fakeSp);
    
    // Check if it should be virtual-numbers
    if (cat.slug === "virtual-numbers") {
      const loc = localizeProduct(fakeSp.title || p.title, "virtual-numbers", fakeSp);
      
      const wasAi = p.category === "ai";
      
      const newFeatures = JSON.stringify([
        "دریافت سریع پیامک فعالسازی",
        "اختصاصی برای سرویس انتخابی",
        "گارانتی تعویض در صورت عدم دریافت پیامک"
      ]);

      await db.product.update({
        where: { id: p.id },
        data: {
          category: "virtual-numbers",
          title: loc.title,
          shortDesc: loc.shortDesc,
          description: loc.description,
          duration: "یکبار مصرف (مهلت پیامک: ۲۰ دقیقه)",
          features: newFeatures
        }
      });
      
      updatedCount++;
      if (wasAi) outOfAiCount++;
      
      console.log(`Updated product ${p.id} (${p.title} -> ${loc.title})`);
    }
  }

  console.log("\n--- Audit Summary ---");
  console.log(`Total products updated: ${updatedCount}`);
  console.log(`Removed from AI category: ${outOfAiCount}`);

  // verify product 3073-claude-afghanistan-
  const prod3073 = await db.product.findFirst({ where: { slug: { contains: "3073-claude" } } });
  if (!prod3073) {
    const backupProd = await db.product.findFirst({ where: { id: "3073" } });
    if (backupProd) {
        console.log(`\nVerification of product 3073:\nTitle: ${backupProd.title}\nCategory: ${backupProd.category}\nPrice: ${backupProd.price}\nDescription: ${backupProd.description}`);
    } else {
        console.log("\nCould not find product 3073.");
    }
  } else {
    console.log(`\nVerification of product 3073:\nTitle: ${prod3073.title}\nCategory: ${prod3073.category}\nPrice: ${prod3073.price}\nDescription: ${prod3073.description}`);
  }

  const aiRemaining = await db.product.count({ where: { category: "ai" } });
  console.log(`Remaining products in AI category: ${aiRemaining}`);
  
  const anyVirtualInAi = await db.product.count({
    where: {
      category: "ai",
      title: { contains: "شماره مجازی" }
    }
  });
  console.log(`Are there any virtual numbers remaining in AI category? ${anyVirtualInAi > 0 ? "Yes: " + anyVirtualInAi : "No"}`);
}

main().catch(console.error);
