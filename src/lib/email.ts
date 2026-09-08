import nodemailer from "nodemailer";
import { db } from "./db";
import { openKey } from "./licenses";
import { toToman } from "./format";
import { signOrderAccessToken } from "./order-access";

// Activation instructions dictionary by brand / keyword
export function getProductActivationGuide(title: string, brand?: string | null): string {
  const t = `${brand || ""} ${title}`.toLowerCase();

  if (t.includes("canva") || t.includes("کنوا")) {
    return `دستور فعال‌سازی کنوا پرو (Canva Pro):
۱. وارد سایت canva.com شوید یا اپلیکیشن Canva را باز کنید.
۲. با ایمیل شخصی خود لاگین کنید.
۳. روی لینک دعوت یا لایسنس ارسال‌شده کلیک نمایید تا اکانت شما بلافاصله به پلن رسمی پرو ارتقا یابد.
۴. اکنون دسترسی به تمام ابزارهای هوش مصنوعی و المان‌های پریمیوم کنوا فعال است.`;
  }

  if (t.includes("chatgpt") || t.includes("openai") || t.includes("چت جی پی تی")) {
    return `دستور استفاده و فعال‌سازی ChatGPT Plus / Team:
۱. وارد سایت chatgpt.com شوید.
۲. با اطلاعات اکانت ارسال‌شده (ایمیل و رمز عبور) لاگین نمایید.
۳. در صورت دریافت کد دو مرحله‌ای، کد به ایمیل ارسال شده و در دسترس است.
۴. دسترسی نامحدود به GPT-4o، Canvas و ساخت تصاویر برای شما فعال است.`;
  }

  if (t.includes("claude") || t.includes("anthropic") || t.includes("کلاود")) {
    return `دستور استفاده از اکانت Claude Pro:
۱. با ابزار تغییر آی‌پی مناسب وارد سایت claude.ai شوید.
۲. با ایمیل و رمز ارسال‌شده وارد اکانت اختصاصی خود شوید.
۳. دسترسی به مدل قدرتمند Claude 3.5 Sonnet بدون محدودیت فعال است.`;
  }

  if (t.includes("netflix") || t.includes("نتفلیکس")) {
    return `دستور استفاده از اکانت نتفلیکس ۴K Ultra HD:
۱. اپلیکیشن یا وب‌سایت netflix.com را باز کنید.
۲. با ایمیل و پسورد ارسالی لاگین نمایید.
۳. وارد پروفایل اختصاصی خود شوید و از کیفیت 4K و زبان فارسی لذت ببرید.
نکته مهم: از تغییر مشخصات و پسورد اکانت خودداری فرمایید تا گارانتی تعویض حفظ شود.`;
  }

  if (t.includes("adobe") || t.includes("ادوبی")) {
    return `دستور فعال‌سازی ادوبی (Adobe Creative Cloud):
۱. وارد سایت adobe.com شده و نرم‌افزار Creative Cloud Desktop را باز کنید.
۲. با اطلاعات دریافتی وارد شوید.
۳. دسترسی به تمام نرم‌افزارهای انتخابی با لایسنس قانونی برای شما فعال است.`;
  }

  if (t.includes("spotify") || t.includes("اسپاتیفای")) {
    return `دستور فعال‌سازی اسپاتیفای پریمیوم:
۱. با لینک فمیلی یا اکانت ارسال‌شده وارد حساب اسپاتیفای شوید.
۲. در صورت لینک فمیلی، آدرس کشور را مطابق دستورالعمل تایید کنید.
۳. تمام قابلیت‌های پریمیوم (پخش آفلاین، بدون تبلیغات و کیفیت بالا) فعال می‌شود.`;
  }

  if (t.includes("cursor") || t.includes("کورسور")) {
    return `دستور استفاده از کورسور پرو (Cursor Pro):
۱. نرم‌افزار Cursor را باز کنید.
۲. از بخش تنظیمات با اطلاعات ارسال‌شده لاگین نمایید.
۳. قابلیت‌های Agent، Tab و Fast Request به طور کامل برای شما فعال خواهد بود.`;
  }

  // Default universal digital license activation guide
  return `دستورالعمل استفاده از لایسنس:
۱. کد لایسنس یا اطلاعات کاربری درج‌شده در این پیام را کپی نمایید.
۲. وارد وب‌سایت یا نرم‌افزار مربوطه شده و در بخش فعال‌سازی یا ورود، اطلاعات را وارد فرمایید.
۳. در صورت بروز هرگونه سوال یا نیاز به راهنمایی، پشتیبانی لایسنس‌لند از طریق تلگرام و تیکت همراه شماست.`;
}

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendOrderFulfillmentEmail(orderId: string): Promise<boolean> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            licenses: true,
          },
        },
      },
    });

    if (!order) return false;

    const recipientEmail = order.guestEmail || order.user?.email;
    if (!recipientEmail) {
      console.log(`[email] Order ${order.code} has no email address. Skipping.`);
      return false;
    }

    const token = signOrderAccessToken(order.id);
    const trackingUrl = `https://liceno.ir/order/${order.id}?token=${token}`;

    // Format products and licenses
    let itemsHtml = "";
    let itemsText = "";

    for (const item of order.items) {
      const guide = getProductActivationGuide(item.product.title, item.product.brand);
      
      const licenseList = item.licenses.map((lic) => {
        try {
          return openKey(item.productId, lic.key);
        } catch {
          return lic.key;
        }
      });

      const licenseDisplay = licenseList.length > 0
        ? licenseList.join("\n")
        : "لایسنس در حال آماده‌سازی آنی توسط سرور است و تا چند لحظه دیگر در پنل ثبت می‌شود.";

      itemsText += `
---------------------------------------------
📦 محصول: ${item.product.title} (${item.quantity} عدد)
🔑 لایسنس / اطلاعات دسترسی:
${licenseDisplay}

📋 راهنمای فعال‌سازی:
${guide}
---------------------------------------------
`;

      itemsHtml += `
        <div style="background: #181f1b; border: 1px solid #2e3831; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #10b981; margin-top: 0; font-size: 18px;">📦 ${item.product.title}</h3>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 12px 0;">تعداد: ${item.quantity} عدد | قیمت: ${toToman(item.price)} تومان</p>
          
          <div style="background: #0f1412; border: 1px solid #10b981; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
            <div style="color: #10b981; font-weight: bold; font-size: 12px; margin-bottom: 6px;">🔑 لایسنس / کد دسترسی شما:</div>
            <pre style="color: #ffffff; font-family: monospace; font-size: 14px; margin: 0; white-space: pre-wrap; word-break: break-all;">${licenseDisplay}</pre>
          </div>

          <div style="background: #131916; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.8; color: #cbd5e1;">
            <strong style="color: #38bdf8;">📋 راهنمای فعال‌سازی و دستورالعمل:</strong>
            <div style="white-space: pre-line; margin-top: 6px;">${guide}</div>
          </div>
        </div>
      `;
    }

    const emailSubject = `تحویل لایسنس و سفارش شما #${order.code} - لایسنس لند`;

    const htmlBody = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Tahoma, 'Vazirmatn', Arial, sans-serif; background-color: #0a0f0d; color: #e2e8f0; margin: 0; padding: 30px 15px; direction: rtl; text-align: right;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #121815; border: 1px solid #232d26; border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #232d26; padding-bottom: 20px;">
            <h1 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 900;">LICENO | لایسنس‌لند</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">سفارش شما با موفقیت تکمیل و لایسنس‌ها صادر شدند</p>
          </div>

          <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.8;">
            <p>کاربر گرامی، با سپاس از خرید شما از <strong>لایسنس‌لند</strong>، جزئیات سفارش و لایسنس‌های اختصاصی شما در ادامه تقدیم می‌گردد:</p>
            <div style="background: #181f1b; padding: 12px 16px; border-radius: 8px; margin: 15px 0;">
              <div><strong>کد پیگیری سفارش:</strong> <span style="color: #10b981; font-family: monospace;">${order.code}</span></div>
              <div><strong>مبلغ پرداختی:</strong> ${toToman(order.total)} تومان</div>
              <div><strong>تاریخ ثبت:</strong> ${new Date(order.createdAt).toLocaleDateString("fa-IR")}</div>
            </div>
          </div>

          ${itemsHtml}

          <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
            <a href="${trackingUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">مشاهده و پیگیری سفارش در سایت</a>
          </div>

          <div style="border-top: 1px solid #232d26; padding-top: 15px; text-align: center; font-size: 12px; color: #64748b;">
            این ایمیل به صورت خودکار صادر شده است. پشتیبانی ۲۴/۷ لایسنس‌لند از طریق تیکت و تلگرام در دسترس شماست.
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = getSmtpTransporter();

    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"لایسنس‌لند" <support@liceno.ir>',
        to: recipientEmail,
        subject: emailSubject,
        text: `سفارش #${order.code}\n${itemsText}\nلینک پیگیری: ${trackingUrl}`,
        html: htmlBody,
      });
      console.log(`[email] Order fulfillment email sent successfully to ${recipientEmail} for order ${order.code}`);
    } else {
      console.log(`[email:simulated] SMTP credentials not set in .env. Email content prepared for ${recipientEmail}:`);
      console.log(`[email:simulated] Subject: ${emailSubject}`);
      console.log(`[email:simulated] Content:\n${itemsText}`);
    }

    return true;
  } catch (error) {
    console.error("[email] Error sending order fulfillment email:", error);
    return false;
  }
}
