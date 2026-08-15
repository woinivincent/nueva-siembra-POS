// src/shared/packs.ts
// Definición de los tamaños de pack disponibles por categoría.
// Es la única fuente de verdad: la usan tanto el formulario de inventario
// (para saber qué precios pedir) como el POS (para saber qué globitos mostrar).

export type PackSize = 3 | 4 | 5 | 10;

/** Todos los tamaños que la base de datos sabe almacenar. */
export const ALL_PACK_SIZES: PackSize[] = [3, 4, 5, 10];

/** Tamaños que se ofrecen cuando la categoría no tiene una regla propia. */
export const DEFAULT_PACK_SIZES: PackSize[] = [3, 5, 10];

/**
 * Reglas por categoría. Las claves se comparan en minúscula y sin acentos,
 * así "Viandas", "viandas" y "VIANDAS" caen en la misma regla.
 */
const PACK_SIZES_BY_CATEGORY: Record<string, PackSize[]> = {
  viandas: [3, 5, 10],
  tartas: [3, 5, 10],
  hamburguesas: [4],
};

function normalize(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Tamaños de pack que se ofrecen para una categoría dada. */
export function packSizesFor(category: string): PackSize[] {
  return PACK_SIZES_BY_CATEGORY[normalize(category)] ?? DEFAULT_PACK_SIZES;
}

/** Nombre de la columna/campo donde vive el precio de cada tamaño. */
export function packPriceField(size: PackSize): 'pricePack3' | 'pricePack4' | 'pricePack5' | 'pricePack10' {
  return `pricePack${size}` as 'pricePack3' | 'pricePack4' | 'pricePack5' | 'pricePack10';
}

/** Etiqueta que ve el usuario. */
export function packLabel(size: PackSize): string {
  return `Pack x${size}`;
}

export interface PackPrices {
  pricePack3: number | null;
  pricePack4: number | null;
  pricePack5: number | null;
  pricePack10: number | null;
}

/**
 * Tamaños que un producto puede realmente vender: los de su categoría
 * que además tengan un precio cargado. Si devuelve vacío, el producto
 * se vende únicamente por unidad.
 */
export function availablePackSizes(product: { category: string } & Partial<PackPrices>): PackSize[] {
  return packSizesFor(product.category).filter((size) => {
    const price = product[packPriceField(size)];
    return typeof price === 'number' && price > 0;
  });
}
