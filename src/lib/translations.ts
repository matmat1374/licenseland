export function getProductTitleFa(title: string): { faTitle: string; enTitle: string } {
  let faTitle = title;
  const enTitle = title;

  // Replace common brackets
  faTitle = faTitle.replace(/\[KEY\]/ig, 'لایسنس');
  faTitle = faTitle.replace(/\[Account\]/ig, 'اکانت');

  // Dictionary for simple replacements
  const dict: Record<string, string> = {
    'Auto-renewal': 'تمدید خودکار',
    'Instant Delivery': 'تحویل آنی',
    'Full Warranty': 'با گارانتی کامل',
    'Warranty': 'با گارانتی',
    'Devices': 'دستگاه',
    'Screens': 'کاربر',
    'PC': 'ویندوز',
    'Android': 'اندروید',
    'iOS': 'آیفون',
    'Mac': 'مک',
    'Personal': 'شخصی',
    'Individual': 'شخصی',
    'Private': 'اختصاصی',
    'Shared': 'اشتراکی',
    'Family': 'فمیلی',
  };

  for (const [en, fa] of Object.entries(dict)) {
    const regex = new RegExp(`\\b${en}\\b`, 'ig');
    faTitle = faTitle.replace(regex, fa);
  }
  
  // Handle durations (Months, Years, Days)
  const durationRegex = /(\d+)\s*(Day|Days|Month|Months|Year|Years)/i;
  const durationMatch = faTitle.match(durationRegex);
  
  let durationFa = '';
  if (durationMatch) {
    const num = durationMatch[1];
    const unitRaw = durationMatch[2].toLowerCase();
    let unit = '';
    if (unitRaw.startsWith('day')) unit = 'روزه';
    if (unitRaw.startsWith('month')) unit = 'ماهه';
    if (unitRaw.startsWith('year')) unit = 'ساله';
    
    // Convert English numbers to Persian
    const numFa = num.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
    durationFa = `${numFa} ${unit}`;
    
    // Remove the English duration from title
    faTitle = faTitle.replace(durationMatch[0], '');
  }

  // Type identification
  let typeFa = '';
  const typeRegex = /\b(شخصی|اختصاصی|اشتراکی|فمیلی)\b/i;
  const typeMatch = faTitle.match(typeRegex);
  if (typeMatch) {
    typeFa = typeMatch[1];
    faTitle = faTitle.replace(typeMatch[0], '');
  }

  // Platforms
  const platforms = ['ویندوز', 'اندروید', 'آیفون', 'مک'];
  const foundPlatforms = [];
  for (const p of platforms) {
    const r = new RegExp(`\\b${p}\\b`, 'ig');
    if (r.test(faTitle)) {
      foundPlatforms.push(p);
      faTitle = faTitle.replace(r, '');
    }
  }

  // Extract modifiers like warranty
  let modifiers = [];
  if (faTitle.includes('با گارانتی کامل')) {
    modifiers.push('با گارانتی کامل');
    faTitle = faTitle.replace(/با گارانتی کامل/ig, '');
  } else if (faTitle.includes('با گارانتی')) {
    modifiers.push('با گارانتی');
    faTitle = faTitle.replace(/با گارانتی/ig, '');
  }
  
  if (faTitle.includes('تحویل آنی')) {
    modifiers.push('تحویل آنی');
    faTitle = faTitle.replace(/تحویل آنی/ig, '');
  }
  
  if (faTitle.includes('تمدید خودکار')) {
    modifiers.push('تمدید خودکار');
    faTitle = faTitle.replace(/تمدید خودکار/ig, '');
  }

  // Cleanup extra spaces and hyphens
  faTitle = faTitle.replace(/[\[\]\-]/g, ' ').replace(/\s+/g, ' ').trim();

  // Determine base prefix
  let prefix = '';
  if (faTitle.includes('لایسنس')) {
    prefix = 'لایسنس';
    faTitle = faTitle.replace(/لایسنس/ig, '');
  } else if (faTitle.includes('اکانت')) {
    prefix = 'اشتراک'; // 'اکانت' converts to 'اشتراک' basically
    faTitle = faTitle.replace(/اکانت/ig, '');
  } else {
    prefix = 'اشتراک';
  }
  
  // What's left is the brand
  const brand = faTitle.trim();

  // Re-assemble: "اشتراک ChatGPT Plus یک‌ماهه (اکانت اختصاصی)" or "لایسنس HMA VPN برای اندروید و ویندوز - ۳۰ روزه با گارانتی کامل"
  let finalFa = `${prefix} ${brand}`;
  
  if (foundPlatforms.length > 0) {
    finalFa += ` برای ${foundPlatforms.join(' و ')}`;
  }
  
  if (durationFa || modifiers.length > 0 || typeFa) {
    finalFa += ' -';
  }
  
  if (durationFa) {
    finalFa += ` ${durationFa}`;
  }
  
  if (modifiers.length > 0) {
    finalFa += ` ${modifiers.join(' و ')}`;
  }
  
  if (typeFa) {
    finalFa += ` (اکانت ${typeFa})`;
  }

  finalFa = finalFa.replace(/\s+/g, ' ').replace(/-\s*$/, '').trim();

  return { faTitle: finalFa || title, enTitle };
}
