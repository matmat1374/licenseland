import sys

content = sys.stdin.read()

start_idx = content.find('  return (')
end_idx = content.find('  );\n}\n', start_idx) + 8

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries")
    sys.exit(1)

new_return = '''  const featuredList = featured.length >= 4 ? featured : [...featured, ...bestsellers.filter(b => !featured.some(f => f.id === b.id))].slice(0, 4);

  return (
    <>
      <CreativeHero content={content} categories={categories} heroProducts={heroProducts} />

      {/* ============ BRANDS MARQUEE ============ */}
      <section className="border-y border-white/5 bg-muted/10 overflow-hidden py-6">
        <div className="container mx-auto px-4 flex">
          <div className="flex animate-marquee gap-12 whitespace-nowrap opacity-60">
            {[...BRANDS, ...BRANDS, ...BRANDS].map((brand, i) => (
              <div key={i} className="text-xl font-black text-muted-foreground">{brand}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeading eyebrow="????????????" title="?? ???? ?? ???? ?????" desc="?????? ????? ?? ?????????? ??????? ?? ???????? ?????" />
        <div className="mt-8 flex overflow-x-auto gap-4 pb-6 px-1 md:grid md:grid-cols-3 lg:grid-cols-6 no-scrollbar snap-x snap-mandatory">
          {categories.map((c) => {
            const Icon = (Icons as any)[c.icon || "Folder"] || Icons.Folder;
            return (
              <Link key={c.id} href={/shop?cat=} className="snap-start shrink-0 w-[110px] md:w-auto">
                <Card className="glass group h-full flex flex-col items-center gap-3 p-4 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg border-white/5 bg-background/40">
                  <div className={lex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br  text-white shadow-lg transition-transform duration-500 group-hover:scale-110}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-[13px] font-bold leading-tight">{c.name}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ FEATURED ============ */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="????" title="??????? ?????" desc="?????? ??????????? ???? ?? ????? ????" align="right" />
            <Button asChild variant="outline" className="shrink-0 glass border-white/10 rounded-xl">
              <Link href="/shop">
                ??? ???????
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-8 px-1 md:grid md:grid-cols-3 lg:grid-cols-4 no-scrollbar snap-x snap-mandatory">
            {featuredList.map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-[260px] md:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BESTSELLERS ============ */}
      <section className="bg-muted/10 py-16 border-y border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="??????????????" title="?????????? ?????????" desc="?????? ?????? ????? ????" />
          <div className="mt-8 flex overflow-x-auto gap-4 pb-8 px-1 md:grid md:grid-cols-3 lg:grid-cols-4 no-scrollbar snap-x snap-mandatory">
            {bestsellers.map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-[260px] md:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ NEWEST ============ */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionHeading eyebrow="???????" title="???????? ???????" align="right" />
            <Button asChild variant="outline" className="shrink-0 glass border-white/10 rounded-xl">
              <Link href="/shop?sort=newest">
                ?????? ???
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-8 px-1 md:grid md:grid-cols-3 lg:grid-cols-4 no-scrollbar snap-x snap-mandatory">
            {newest.map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-[260px] md:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeading eyebrow="???? ????" title="??? ?? ? ????? ????" desc="?? ?????? ?? ?????? ??????? ???? ?? ?? ?????" />
        <div className="mt-8 relative grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = (Icons as any)[s.icon] || Icons.Circle;
            return (
              <Card key={i} className="relative overflow-hidden p-6">
                <div className="absolute -left-4 -top-4 text-7xl font-black text-primary/5">{toFa(i + 1)}</div>
                <div className="relative">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{s.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ============ WHY US & GUARANTEES ============ */}
      <section className="bg-muted/10 py-16 border-y border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="??? ???????" title={content.about_title} desc={content.about_description} />
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((w) => {
              const Icon = (Icons as any)[w.icon] || Icons.Check;
              return (
                <div key={w.title} className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold mb-2">{w.title}</h4>
                  <p className="text-sm leading-6 text-muted-foreground">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS & TRUST ============ */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeading eyebrow="????? ???????" title="?????? ???? ?????? ????" desc="??? ?? ?????? ????? ???? ?? ??????" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="p-5">
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-7 text-foreground/90">«{t.text}»</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 font-bold text-primary-foreground">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ BLOG ============ */}
      {articles.length > 0 && (
        <section className="bg-muted/10 py-16 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <SectionHeading eyebrow="?????" title="????? ??????" desc="??????? ???? ? ????????? ?????" align="right" />
              <Button asChild variant="outline" className="shrink-0">
                <Link href="/blog">
                  ??? ??????
                  <ArrowLeft className="mr-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.id} href={/blog/}>
                  <Card className="group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <ProductCover title={a.title} seed={a.slug} className="aspect-video w-full" />
                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{a.category}</Badge>
                        <span>•</span>
                        <span>{toFa(a.readingMinutes)} ????? ??????</span>
                      </div>
                      <h3 className="mb-2 line-clamp-2 font-bold leading-7 group-hover:text-primary">{a.title}</h3>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{a.excerpt}</p>
                      <div className="mt-3 text-xs text-muted-foreground">{formatJalaliDate(a.createdAt)}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ STATS BAR ============ */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-5xl font-black text-primary mb-2">{toFa(s.value)}</div>
              <div className="text-sm md:text-base text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="container mx-auto px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-8 text-primary-foreground md:p-14">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-right">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">????? ???? ???? ??????</h2>
              <p className="mt-2 text-primary-foreground/80">???? ???? ????? ?????? ??? ?? ?? ????? ???? ?????? ????</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link href="/shop"><CreditCard className="h-4 w-4" /> ???? ????</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <a href={SITE.telegram} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> ?????? ??????</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
'''

new_content = content[:start_idx] + new_return + content[end_idx:]

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)
