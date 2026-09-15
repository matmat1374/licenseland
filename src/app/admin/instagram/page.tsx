"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Send, RefreshCcw, Settings, MessageCircle, BarChart3, Wand2, Download, Copy, CalendarClock, Power } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InstagramBannerCanvas, InstagramBannerCanvasRef } from "@/components/admin/instagram/instagram-banner-canvas";

export default function InstagramAdminPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [analytics, setAnalytics] = useState({ followers: 0, impressions: 0, posts_published: 0, dms_replied: 0 });
  const [autopilot, setAutopilot] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const canvasRef = useRef<InstagramBannerCanvasRef>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId) || null;

  useEffect(() => {
    fetchAnalytics();
    fetchProducts();
    fetchQueue();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/instagram?action=analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/instagram?action=products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products");
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/instagram?action=queue");
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (error) {
      console.error("Failed to fetch queue");
    }
  };

  const toggleAutopilot = async () => {
    try {
      const res = await fetch("/api/admin/instagram?action=toggle-autopilot");
      const data = await res.json();
      setAutopilot(data.autopilot);
      toast.success(data.autopilot ? "حالت خودکار فعال شد" : "حالت خودکار غیرفعال شد");
    } catch (error) {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const handleMagicGenerate = async () => {
    if (!selectedProductId) return toast.error("لطفا یک محصول انتخاب کنید");
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-product-content",
          payload: { productId: selectedProductId }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedCaption(data.caption);
        toast.success("محتوا با موفقیت تولید شد!");
      } else {
        toast.error(data.error || "خطا در تولید کپشن");
      }
    } catch (error) {
      toast.error("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBanner = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.exportToPNG();
      if (!dataUrl) return toast.error("تصویر آماده نیست");
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `banner-${selectedProduct?.slug || "instagram"}.png`;
      link.click();
      toast.success("بنر دانلود شد");
    }
  };

  const handleCopyCaption = () => {
    if (!generatedCaption) return;
    navigator.clipboard.writeText(generatedCaption);
    toast.success("کپشن در کلیپ‌بورد کپی شد");
  };

  const handleQueuePost = async () => {
    if (!generatedCaption || !selectedProduct) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "queue-post",
          payload: { productId: selectedProduct.id, caption: generatedCaption }
        })
      });
      if (res.ok) {
        toast.success("پست با موفقیت به صف افزوده شد!");
        fetchQueue();
      } else {
        toast.error("خطا در افزودن به صف");
      }
    } catch (error) {
      toast.error("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">مدیریت هوشمند اینستاگرام</h1>
        <div className="flex items-center gap-2">
          <Button variant={autopilot ? "default" : "outline"} className={autopilot ? "bg-green-600 hover:bg-green-700 text-white" : ""} onClick={toggleAutopilot}>
            <Power className="mr-2 h-4 w-4" />
            {autopilot ? "Autopilot فعال" : "Autopilot خاموش"}
          </Button>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            بروزرسانی
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فالوورها</CardTitle>
            <Instagram className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.followers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ایمپرشن کل</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.impressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پست‌های منتشر شده</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.posts_published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پیام‌های دایرکت</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.dms_replied}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="studio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="studio">استودیو تولید محتوا</TabsTrigger>
          <TabsTrigger value="queue">صف انتشار خودکار</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات پست</CardTitle>
                <CardDescription>محصول مورد نظر را برای تولید پست انتخاب کنید.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">انتخاب محصول</label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="w-full text-right" dir="rtl">
                      <SelectValue placeholder="یک محصول را انتخاب کنید..." />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0" onClick={handleMagicGenerate} disabled={loading || !selectedProductId}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  تولید جادویی (Auto-Generate)
                </Button>

                {generatedCaption && (
                  <div className="mt-6 space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">کپشن اینستاگرام</label>
                        <Button variant="ghost" size="sm" onClick={handleCopyCaption}>
                          <Copy className="h-4 w-4 ml-1" />
                          کپی
                        </Button>
                      </div>
                      <Textarea 
                        className="min-h-[250px] text-right" 
                        dir="rtl"
                        value={generatedCaption} 
                        onChange={e => setGeneratedCaption(e.target.value)} 
                      />
                    </div>
                    
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Button className="flex-1" variant="outline" onClick={handleDownloadBanner}>
                        <Download className="mr-2 h-4 w-4" />
                        دانلود بنر
                      </Button>
                      <Button className="flex-1" onClick={handleQueuePost} disabled={loading}>
                        <Send className="mr-2 h-4 w-4" />
                        افزودن به صف انتشار
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/10">
              <CardHeader>
                <CardTitle>پیش‌نمایش زنده</CardTitle>
                <CardDescription>نمای پست در اینستاگرام</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-[400px] border-[12px] border-black rounded-[40px] overflow-hidden bg-white shadow-2xl relative">
                  {/* Phone Header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden flex items-center justify-center">
                          <span className="text-[10px] font-bold">LL</span>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">liceno.ir</span>
                    </div>
                    <Settings className="w-5 h-5 text-gray-500" />
                  </div>
                  
                  {/* Post Image */}
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                    <InstagramBannerCanvas ref={canvasRef} product={selectedProduct} />
                  </div>
                  
                  {/* Post Actions */}
                  <div className="p-3 bg-white">
                    <div className="flex gap-3 mb-2 text-black">
                      <svg aria-label="Like" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.438-.283-1.791-1.509-4.303-3.752C5.152 14.081 2.5 12.194 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path></svg>
                      <svg aria-label="Comment" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
                      <svg aria-label="Share Post" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
                    </div>
                    {generatedCaption && (
                      <div className="text-sm mt-2 text-right dir-rtl line-clamp-3">
                        <span className="font-bold ml-2">liceno.ir</span>
                        {generatedCaption.split('\n')[0]}...
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>صف انتشار</CardTitle>
              <CardDescription>پست‌های زمان‌بندی شده برای انتشار در اینستاگرام</CardDescription>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground gap-2">
                  <CalendarClock className="h-8 w-8" />
                  <p className="text-sm">هیچ پستی در صف نیست.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queue.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                          <Instagram className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.date}</p>
                        </div>
                      </div>
                      <div className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        {item.status === 'pending' ? 'در انتظار' : item.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات ربات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">هشتگ‌های پیش‌فرض</label>
                <Input defaultValue="#لایسنس #خرید_آنلاین #liceno" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">کد تخفیف کمپین</label>
                <Input defaultValue="INSTA10" />
              </div>
              <Button disabled>
                <Settings className="mr-2 h-4 w-4" />
                ذخیره تنظیمات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
