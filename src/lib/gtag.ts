export const trackSelectItem = (product: { id: string | number; title: string; price: number; category?: string }) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "select_item", {
      currency: "IRT",
      value: product.price,
      items: [
        {
          item_id: String(product.id),
          item_name: product.title,
          item_category: product.category || "General",
          price: product.price,
          quantity: 1,
        },
      ],
    });
  }
};

export const trackViewItem = (product: { id: string | number; title: string; price: number; category?: string }) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "view_item", {
      currency: "IRT",
      value: product.price,
      items: [
        {
          item_id: String(product.id),
          item_name: product.title,
          item_category: product.category || "General",
          price: product.price,
          quantity: 1,
        },
      ],
    });
  }
};
