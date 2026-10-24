import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from './product.model';
import { CatalogService } from './catalog/catalog.service';

export interface CartLine {
  product: Product;
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
const MAX_QTY = 10;

const COUPONS: { [code: string]: number } = {
  LUMI10: 0.1,
  ANIME15: 0.15
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private linesSubject: BehaviorSubject<CartLine[]>;
  private couponSubject = new BehaviorSubject<string | null>(null);
  private drawerSubject = new BehaviorSubject<boolean>(false);

  readonly drawer$: Observable<boolean> = this.drawerSubject.asObservable();

  readonly state$: Observable<CartState>;

  constructor(private catalog: CatalogService) {
    // El catálogo se hidrata de forma síncrona en su constructor, así que aquí
    // ya podemos resolver las líneas guardadas contra los productos reales.
    this.linesSubject = new BehaviorSubject<CartLine[]>(this.restore());

    this.state$ = combineLatest([
      this.linesSubject.asObservable(),
      this.couponSubject.asObservable()
    ]).pipe(map(([lines, coupon]) => this.buildState(lines, coupon)));
  }

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

  add(product: Product, qty: number = 1): void {
    const lines = this.linesSubject.value.slice();
    const existing = lines.find((line) => line.product.id === product.id);

    if (existing) {
      existing.qty = Math.min(existing.qty + qty, MAX_QTY);
    } else {
      lines.push({ product, qty: Math.min(qty, MAX_QTY) });
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
    const lines = this.linesSubject.value.map((item) =>
      item.product.id === line.product.id ? { ...item, qty: Math.min(qty, MAX_QTY) } : item
    );
    this.commit(lines);
  }

  remove(line: CartLine): void {
    this.commit(this.linesSubject.value.filter((item) => item.product.id !== line.product.id));
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
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    const couponRate = coupon ? COUPONS[coupon] || 0 : 0;
    const discount = +(subtotal * couponRate).toFixed(2);
    const payable = subtotal - discount;
    const shipping = subtotal === 0 || payable >= FREE_SHIPPING ? 0 : SHIPPING_COST;
    const total = +(payable + shipping).toFixed(2);
    const remaining = Math.max(0, FREE_SHIPPING - payable);

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
      freeShippingProgress: Math.min(100, Math.round((payable / FREE_SHIPPING) * 100))
    };
  }

  private persist(lines: CartLine[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(lines.map((line) => ({ id: line.product.id, qty: line.qty })))
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
      const stored = JSON.parse(raw) as { id: string; qty: number }[];
      if (!Array.isArray(stored)) {
        return [];
      }
      return stored
        .map((item) => {
          // Ignoramos líneas cuyo producto ya no existe en el catálogo actual.
          const product = this.catalog.byId(item.id);
          if (!product) {
            return null;
          }
          return { product, qty: Math.min(Math.max(1, Number(item.qty) || 1), MAX_QTY) } as CartLine;
        })
        .filter((line): line is CartLine => line !== null);
    } catch {
      return [];
    }
  }
}
