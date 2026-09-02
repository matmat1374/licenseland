const fs = require('fs');

const catUI = `
      {/* ============ QUICK CATEGORIES ============ */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/shop?cat=ai" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-emerald-500 text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
            <span className="text-4xl font-black mb-2 opacity-90 group-hover:scale-110 transition-transform">G</span>
            <span className="font-bold text-sm">چت جی‌پی‌تی</span>
          </Link>
          <Link href="/shop?cat=music" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-green-500 text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
            <span className="text-4xl font-black mb-2 opacity-90 group-hover:scale-110 transition-transform">S</span>
            <span className="font-bold text-sm">اسپاتیفای</span>
          </Link>
          <Link href="/shop?cat=movies" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-red-600 text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
            <span className="text-4xl font-black mb-2 opacity-90 group-hover:scale-110 transition-transform">N</span>
            <span className="font-bold text-sm">نتفلیکس</span>
          </Link>
          <Link href="/shop?cat=gaming" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-amber-500 text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
            <span className="text-4xl font-black mb-2 opacity-90 group-hover:scale-110 transition-transform">UC</span>
            <span className="font-bold text-sm">پابجی یوسی</span>
          </Link>
          <Link href="/shop?cat=gift-cards" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900 text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
            <Icons.Gift className="h-10 w-10 mb-2 opacity-90 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">گیفت کارت اپل</span>
          </Link>
          <Link href="/shop?cat=number" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-indigo-500 text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
            <Icons.Smartphone className="h-10 w-10 mb-2 opacity-90 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">شماره مجازی</span>
          </Link>
        </div>
      </section>
`;

let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// Insert after </section> <!-- HERO -->
page = page.replace('</section>\n\n      {/* ============ FEATURED PRODUCTS ============ */}', '</section>\n' + catUI + '\n      {/* ============ FEATURED PRODUCTS ============ */}');

fs.writeFileSync('src/app/page.tsx', page, 'utf8');
console.log('Homepage categories added.');
