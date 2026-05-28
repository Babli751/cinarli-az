import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  qty: number;
  credit_months?: number;
}

const KEY = "cinarli_cart";

function load(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => { save(items); }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "qty"> & { qty?: number }) => {
    setItems(prev => {
      const existing = prev.find(x => x.id === item.id);
      if (existing) {
        return prev.map(x => x.id === item.id ? { ...x, qty: x.qty + (item.qty || 1) } : x);
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(x => x.id !== id));
  }, []);

  const updateQty = useCallback((id: number, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(x => x.id === id ? { ...x, qty } : x));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((s, x) => s + x.price * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);

  return { items, addItem, removeItem, updateQty, clearCart, total, count };
}
