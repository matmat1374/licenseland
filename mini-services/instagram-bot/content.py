import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# DeepSeek setup
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
client = None
if DEEPSEEK_API_KEY:
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com"
    )

FALLBACK_TEMPLATES = {
    "Spotify": "🎧 اکانت پرمیوم اسپاتیفای با بهترین قیمت!\n\nبدون قطعی و با ضمانت کامل.\nهمین الان از سایت liceno.ir خرید کنید.\n\n#اسپاتیفای #موزیک #پرمیوم #لایسنس",
    "ChatGPT": "🤖 چت جی‌پی‌تی پلاس!\n\nدسترسی به جدیدترین مدل‌های هوش مصنوعی.\nخرید آنی از liceno.ir\n\n#هوش_مصنوعی #چت_جی_پی_تی #chatgpt",
    "Netflix": "🎬 نتفلیکس پرمیوم!\n\nجدیدترین فیلم‌ها و سریال‌ها با کیفیت 4K.\nخرید با تحویل فوری در liceno.ir\n\n#نتفلیکس #فیلم #سریال",
    "Canva": "🎨 اکانت پرو کانوا!\n\nطراحی حرفه‌ای بدون محدودیت.\nسفارش از liceno.ir\n\n#کانوا #طراحی #گرافیک",
    "Claude": "🧠 کلود پرو!\n\nهوش مصنوعی قدرتمند کلود برای کارهای حرفه‌ای.\nهمین الان خرید کنید: liceno.ir\n\n#کلود #claude #هوش_مصنوعی",
    "Cursor": "💻 اکانت پرو کرسر!\n\nکدنویسی با سرعت نور به کمک هوش مصنوعی.\nسفارش از liceno.ir\n\n#برنامه_نویسی #کرسر #cursor",
    "default": "🌟 بهترین لایسنس‌های اورجینال را از ما بخواهید!\n\nتحویل فوری و پشتیبانی ۲۴ ساعته.\nلینک سایت در بیو: liceno.ir\n\n#لایسنس #اورجینال #خرید_آنلاین"
}

def generate_post_content(product_name: str, features: str) -> str:
    if client:
        try:
            prompt = f"یک کپشن اینستاگرام جذاب و متقاعدکننده به زبان فارسی برای فروش محصول '{product_name}' بنویس. ویژگی های محصول: {features}. حتما شامل ایموجی، دعوت به اقدام (خرید از liceno.ir) و هشتگ های مرتبط باشد."
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "You are a professional social media manager and copywriter in Persian."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating content with DeepSeek: {e}")
            
    # Fallback
    for key, template in FALLBACK_TEMPLATES.items():
        if key.lower() in product_name.lower():
            return template
            
    return FALLBACK_TEMPLATES["default"]
