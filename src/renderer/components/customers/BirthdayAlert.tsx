// src/renderer/components/customers/BirthdayAlert.tsx
import { Cake, Gift, X } from 'lucide-react';
import { useState } from 'react';
import type { Customer } from '@/shared/types/electron';

interface Props {
  customers: Customer[];
}

export function BirthdayAlert({ customers }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || customers.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-brand-orange to-brand-yellow rounded-xl shadow-lg p-4 text-white relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 opacity-10">
        <Cake className="w-32 h-32 -mt-8 -mr-8" />
      </div>
      
      {/* Botón cerrar */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 hover:bg-card/20 rounded-full transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="bg-card/20 rounded-full p-3">
          <Cake className="w-8 h-8" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            🎂 ¡Cumpleaños Hoy!
          </h3>
          
          <div className="mt-2 space-y-2">
            {customers.map(customer => (
              <div 
                key={customer.id}
                className="bg-card/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{customer.fullName}</p>
                  {customer.occupation && (
                    <p className="text-sm text-white/80">{customer.occupation}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {customer.phone && (
                    
                     <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Feliz cumpleaños ${customer.firstName}! 🎂🎉 Te esperamos en el local con una promo especial para vos.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-primary hover:bg-primary rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      <Gift className="w-4 h-4" />
                      Enviar Saludo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-white/70 mt-3">
            💡 Tip: Enviá un mensaje personalizado con una promo de cumpleaños
          </p>
        </div>
      </div>
    </div>
  );
}