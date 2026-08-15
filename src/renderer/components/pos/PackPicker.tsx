// src/renderer/components/pos/PackPicker.tsx
import { useEffect, useRef } from 'react';
import type { Product } from '@/shared/types/electron';
import { availablePackSizes, packPriceField, packLabel } from '@/shared/packs';
import type { AddMode } from '@/renderer/stores/cart.stores';

interface PackPickerProps {
  product: Product;
  onPick: (mode: AddMode) => void;
  onClose: () => void;
}

/**
 * Los "globitos" que aparecen al tocar un producto en el POS: dejan elegir si
 * se carga suelto o dentro de un pack. Sólo aparecen los packs que el producto
 * tenga precio cargado; si no tiene ninguno, el POS lo carga suelto sin abrir
 * este selector.
 */
export function PackPicker({ product, onPick, onClose }: PackPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const sizes = availablePackSizes(product);

  // Cerrar al hacer click afuera o con Escape
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const money = (value: number) =>
    value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Elegir precio para ${product.name}`}
      className="absolute inset-x-2 bottom-2 z-30 rounded-xl border border-border bg-popover p-2 shadow-xl space-y-1"
    >
      <button
        type="button"
        onClick={() => onPick('unit')}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
      >
        <span>Individual</span>
        <span className="tabular-nums">{money(product.price)}</span>
      </button>

      {sizes.map((size) => {
        const price = product[packPriceField(size)] as number;
        return (
          <button
            key={size}
            type="button"
            onClick={() => onPick(size)}
            className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <span>{packLabel(size)}</span>
            <span className="tabular-nums">{money(price)} c/u</span>
          </button>
        );
      })}
    </div>
  );
}
