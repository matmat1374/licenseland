import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // ایجاد یا بهروزرسانی دستههای جدید
  await prisma.category.upsert({
    where: { slug: 'virtual-numbers' },
    create: {
      slug: 'virtual-numbers',
      name: 'شماره مجازی و وریفای',
      icon: 'Smartphone',
      color: 'from-emerald-500 to-teal-600',
      sortOrder: 2
    },
    update: {
      name: 'شماره مجازی و وریفای',
      icon: 'Smartphone',
      color: 'from-emerald-500 to-teal-600',
      sortOrder: 2
    }
  })
  
  await prisma.category.upsert({
    where: { slug: 'api-credits' },
    create: {
      slug: 'api-credits',
      name: 'توکن و کردیت API',
      icon: 'Code2',
      color: 'from-blue-500 to-cyan-600',
      sortOrder: 3
    },
    update: {
      name: 'توکن و کردیت API',
      icon: 'Code2',
      color: 'from-blue-500 to-cyan-600',
      sortOrder: 3
    }
  })
  
  // اصلاح sortOrder دستههای موجود
  const updates = [
    { slug: 'ai', sortOrder: 1 },
    { slug: 'streaming', sortOrder: 4 },
    { slug: 'design', sortOrder: 5 },
    { slug: 'software', sortOrder: 6 },
    { slug: 'gaming', sortOrder: 7 },
    { slug: 'social', sortOrder: 8 }
  ]
  for (const u of updates) {
    await prisma.category.updateMany({
      where: { slug: u.slug },
      data: { sortOrder: u.sortOrder }
    })
  }
  console.log('Categories updated!')
}
main().finally(() => prisma.$disconnect())
