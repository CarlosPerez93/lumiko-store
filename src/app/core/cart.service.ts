import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from './product.model';
import { PRODUCTS } from './products.data';

export interface CartLine {
  product: Product;
  color: string;
  qty: number;
}

export interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon: string | null;
  couponRate: number;
  freeShippingRemaining: number;
  freeShippingProgress: number;
}

const STORAGE_KEY = 'lumiko.cart.v1';
const FREE_SHIPPING = 49;
const SHIPPING_COST = 4.95;

const COUPONS: { [code: string]: number } = {
  LUMI10: 0.1,
  ANIME15: 0.15
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private linesSubject = new BehaviorSubject<CartLine[]>(this.restore());
  private couponSubject = new BehaviorSubject<string | null>(null);
  private drawerSubject = new BehaviorSubject<boolean>(false);

  readonly drawer$: Observable<boolean> = this.drawerSubject.asObservable();

  readonly state$: Observable<CartState> = combineLatest([this.linesSubject, this.couponSubject]).pipe(
    map(([lines, coupon]) => this.buildState(lines, coupon))
  );

  get snapshot(): CartState {
    return this.buildState(this.linesSubject.value, this.couponSubject.value);
  }

  openDrawer(): void {
    this.drawerSubject.next(true);
  }

  closeDrawer(): void {
    this.drawerSubject.next(false);
  }

  toggleDrawer(): void {
    this.drawerSubject.next(!this.drawerSubject.value);
  }

  add(product: Product, colorName?: string, qty: number = 1): void {
    const color = colorName || product.colors[0].name;
    const lines = [...this.linesSubject.value];
    const existing = lines.find((l) => l.product.id === product.id && l.color === color);

    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 10);
    } else {
      lines.push({ product, color, qty: Math.min(qty, 10) });
    }
    this.commit(lines);
  }

  increment(line: CartLine): void {
    this.setQty(line, line.qty + 1);
  }

  decrement(line: CartLine): void {
    this.setQty(line, line.qty - 1);
  }

  setQty(line: CartLine, qty: number): void {
    if (qty <= 0) {
      this.remove(line);
      return;
    }
    const lines = this.linesSubject.value.map((l) =>
      l.product.id === line.product.id && l.color === line.color ? { ...l, qty: Math.min(qty, 10) } : l
    );
    this.commit(lines);
  }

  remove(line: CartLine): void {
    const lines = this.linesSubject.value.filter(
      (l) => !(l.product.id === line.product.id && l.color === line.color)
    );
    this.commit(lines);
  }

  clear(): void {
    this.commit([]);
    this.couponSubject.next(null);
  }

  applyCoupon(rawCode: string): { ok: boolean; message: string } {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) {
      return { ok: false, message: 'Escribe un código de descuento.' };
    }
    if (!COUPONS[code]) {
      return { ok: false, message: `El código "${code}" no es válido.` };
    }
    this.couponSubject.next(code);
    return { ok: true, message: `Código ${code} aplicado: -${Math.round(COUPONS[code] * 100)}%` };
  }

  removeCoupon(): void {
    this.couponSubject.next(null);
  }

  private commit(lines: CartLine[]): void {
    this.linesSubject.next(lines);
    this.persist(lines);
  }

  private buildState(lines: CartLine[], coupon: string | null): CartState {
    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const couponRate = coupon ? COUPONS[coupon] || 0 : 0;
    const discount = +(subtotal * couponRate).toFixed(2);
    const shipping = subtotal === 0 || subtotal - discount >= FREE_SHIPPING ? 0 : SHIPPING_COST;
    const total = +(subtotal - discount + shipping).toFixed(2);
    const remaining = Math.max(0, FREE_SHIPPING - (subtotal - discount));

    return {
      lines,
      count,
      subtotal: +subtotal.toFixed(2),
      discount,
      shipping,
      total,
      coupon,
      couponRate,
      freeShippingRemaining: +remaining.toFixed(2),
      freeShippingProgress: Math.min(100, Math.round(((subtotal - discount) / FREE_SHIPPING) * 100))
    };
  }

  private persist(lines: CartLine[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(lines.map((l) => ({ id: l.product.id, color: l.color, qty: l.qty })))
        );
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private restore(): CartLine[] {
    try {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const stored = JSON.parse(raw) as { id: string; color: string; qty: number }[];
      if (!Array.isArray(stored)) {
        return [];
      }
      return stored
        .map((item) => {
          const product = PRODUCTS.find((p) => p.id === item.id);
          if (!product) {
            return null;
          }
          const color = product.colors.some((c) => c.name === item.color)
            ? item.color
            : product.colors[0].name;
          return { product, color, qty: Math.min(Math.max(1, Number(item.qty) || 1), 10) };
        })
        .filter((line): line is CartLine => line !== null);
    } catch {
      return [];
    }
  }
}
