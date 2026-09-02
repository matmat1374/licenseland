export async function askDeepSeek(prompt: string, systemPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-v4-pro-0813',
      provider: {
        order: ["StreamLake"]
      },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from OpenRouter: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateProductDescription(title: string, brand: string, category: string) {
  const systemPrompt = "You are a product description generator. Create an engaging and accurate description based on the provided title, brand, and category.";
  const prompt = `Title: ${title}\nBrand: ${brand}\nCategory: ${category}`;
  return askDeepSeek(prompt, systemPrompt);
}

export async function translateAndEnhanceTitle(rawTitle: string) {
  const systemPrompt = "You are a translator and enhancer. Translate the raw title to English if needed, and enhance it to be more catchy and SEO-friendly.";
  const prompt = `Raw Title: ${rawTitle}`;
  return askDeepSeek(prompt, systemPrompt);
}
