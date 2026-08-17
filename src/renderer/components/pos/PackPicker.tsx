// src/renderer/components/pos/PackPicker.tsx
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Product } from '@/shared/types/electron';
import { availablePackSizes, packPriceField, packLabel } from '@/shared/packs';
import type { AddMode } from '@/renderer/stores/cart.stores';

interface PackPickerProps {
  product: Product;
  onPick: (mode: AddMode) => void;
  onClose: () => void;
}

/**
 * Modal para elegir en qué formato se carga el producto: suelto o dentro de un
 * pack. Sólo aparecen los packs que el producto tenga precio cargado; si no
 * tiene ninguno, el POS lo carga suelto sin abrir este selector.
 */
export function PackPicker({ product, onPick, onClose }: PackPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const sizes = availablePackSizes(product);

  // Cerrar con Escape
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const money = (value: number) =>
    value.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    });

  return (
    <div
      // Click en el fondo cierra; el click dentro del panel no burbujea
      onMouseDown={(event) => {
        if (!ref.current?.contains(event.target as Node)) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`Elegir precio para ${product.name}`}
        className="w-[20rem] rounded-2xl border border-border bg-popover p-4 shadow-2xl space-y-2"
      >
        <div className="flex items-start justify-between gap-2 pb-1">
          <div>
            <p className="font-semibold leading-tight">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onPick('unit')}
          className="w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 font-medium bg-secondary text-secondary-foreground hover:bg-accent transition-colors whitespace-nowrap"
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
              className="w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
            >
              <span>{packLabel(size)}</span>
              <span className="tabular-nums text-sm">{money(price)} c/u</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
