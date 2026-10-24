export type CategoryId = 'lamparas' | 'robots' | 'proyeccion' | 'gaming';

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  category: CategoryId;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: string;
  badgeTone?: 'pink' | 'cyan' | 'lime';
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  colors: ColorOption[];
  stock: number;
  isNew?: boolean;
  bestseller?: boolean;
  sales: number;
}

export interface Category {
  id: CategoryId | 'todos';
  label: string;
  short: string;
}

export const CATEGORIES: Category[] = [
  { id: 'todos', label: 'Todo el catálogo', short: 'Todos' },
  { id: 'lamparas', label: 'Lámparas inteligentes', short: 'Lámparas' },
  { id: 'robots', label: 'Robots de compañía', short: 'Robots' },
  { id: 'proyeccion', label: 'Proyección', short: 'Proyección' },
  { id: 'gaming', label: 'Gaming & pixel', short: 'Gaming' }
];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  lamparas: 'Lámpara inteligente',
  robots: 'Robot de compañía',
  proyeccion: 'Proyección',
  gaming: 'Gaming'
};
