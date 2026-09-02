import { askDeepSeek } from '../src/lib/deepseek';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

async function main() {
  try {
    const result = await askDeepSeek("Hello, are you there?", "You are a helpful assistant.");
    console.log("DeepSeek says:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
