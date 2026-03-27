// src/renderer/services/ticket.service.ts
import { jsPDF } from 'jspdf';

interface TicketItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer';

interface TicketData {
  saleId: number;
  date: Date;
  items: TicketItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  cashReceived?: number;
  change?: number;
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  cuit: string;
  ticketHeader: string;
  ticketFooter: string;
  currencySymbol: string;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transferencia',
};

export class TicketService {
  private formatMoney(amount: number, symbol: string = '$'): string {
    return `${symbol}${amount.toFixed(2)}`;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async generateTicketPDF(ticket: TicketData, business: BusinessInfo): Promise<Blob> {
    // Ticket de 80mm de ancho (típico para impresoras térmicas)
    // 80mm = 226.77 puntos, usamos un poco menos para márgenes
    const pageWidth = 80; // mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, 200], // Alto inicial, se ajustará
    });

    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    const lineHeight = 4;
    const smallLineHeight = 3.5;

    // Configurar fuente
    doc.setFont('helvetica');

    // === ENCABEZADO ===
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(business.name || 'Mi Negocio', pageWidth / 2, y, { align: 'center' });
    y += lineHeight + 1;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    if (business.address) {
      doc.text(business.address, pageWidth / 2, y, { align: 'center' });
      y += smallLineHeight;
    }
    if (business.phone) {
      doc.text(`Tel: ${business.phone}`, pageWidth / 2, y, { align: 'center' });
      y += smallLineHeight;
    }
    if (business.cuit) {
      doc.text(`CUIT: ${business.cuit}`, pageWidth / 2, y, { align: 'center' });
      y += smallLineHeight;
    }

    // Línea separadora
    y += 2;
    doc.setLineWidth(0.1);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;

    // Mensaje de encabezado
    if (business.ticketHeader) {
      doc.setFontSize(8);
      doc.text(business.ticketHeader, pageWidth / 2, y, { align: 'center' });
      y += lineHeight;
    }

    // === INFO DE VENTA ===
    doc.setFontSize(8);
    doc.text(`Ticket #${ticket.saleId.toString().padStart(6, '0')}`, margin, y);
    doc.text(this.formatDate(ticket.date), pageWidth - margin, y, { align: 'right' });
    y += smallLineHeight;

    if (ticket.customerName) {
      doc.text(`Cliente: ${ticket.customerName}`, margin, y);
      y += smallLineHeight;
    }

    // Línea separadora
    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;

    // === ITEMS ===
    doc.setFontSize(8);
    
    for (const item of ticket.items) {
      // Nombre del producto
      const nameLines = doc.splitTextToSize(item.name, contentWidth - 20);
      for (let i = 0; i < nameLines.length; i++) {
        if (i === 0) {
          doc.text(nameLines[i], margin, y);
        } else {
          doc.text(nameLines[i], margin + 2, y);
        }
        y += smallLineHeight;
      }
      
      // Cantidad x Precio = Subtotal
      const qtyPrice = `${item.quantity} x ${this.formatMoney(item.price, business.currencySymbol)}`;
      const subtotalText = this.formatMoney(item.subtotal, business.currencySymbol);
      
      doc.text(qtyPrice, margin + 2, y);
      doc.text(subtotalText, pageWidth - margin, y, { align: 'right' });
      y += lineHeight;
    }

    // Línea separadora
    y += 1;
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;

    // === TOTALES ===
    doc.setFontSize(8);
    
    // Subtotal
    doc.text('Subtotal:', margin, y);
    doc.text(this.formatMoney(ticket.subtotal, business.currencySymbol), pageWidth - margin, y, { align: 'right' });
    y += smallLineHeight;

    // Descuento (si aplica)
    if (ticket.discount > 0) {
      doc.text('Descuento:', margin, y);
      doc.text(`-${this.formatMoney(ticket.discount, business.currencySymbol)}`, pageWidth - margin, y, { align: 'right' });
      y += smallLineHeight;
    }

    // Total
    y += 1;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', margin, y);
    doc.text(this.formatMoney(ticket.total, business.currencySymbol), pageWidth - margin, y, { align: 'right' });
    y += lineHeight + 1;

    // Método de pago
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pago: ${PAYMENT_LABELS[ticket.paymentMethod]}`, margin, y);
    y += smallLineHeight;

    // Cambio (si es efectivo)
    if (ticket.paymentMethod === 'cash' && ticket.cashReceived && ticket.change !== undefined) {
      doc.text(`Recibido: ${this.formatMoney(ticket.cashReceived, business.currencySymbol)}`, margin, y);
      y += smallLineHeight;
      doc.text(`Cambio: ${this.formatMoney(ticket.change, business.currencySymbol)}`, margin, y);
      y += smallLineHeight;
    }

    // Línea separadora
    y += 2;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;

    // === PIE ===
    if (business.ticketFooter) {
      doc.setFontSize(8);
      doc.text(business.ticketFooter, pageWidth / 2, y, { align: 'center' });
      y += lineHeight;
    }

    // Fecha/hora de impresión
    y += 2;
    doc.setFontSize(6);
    doc.text(`Impreso: ${this.formatDate(new Date())}`, pageWidth / 2, y, { align: 'center' });

    return doc.output('blob');
  }

  async printTicket(ticket: TicketData, business: BusinessInfo): Promise<void> {
    try {
      const blob = await this.generateTicketPDF(ticket, business);
      const url = URL.createObjectURL(blob);
      
      // Abrir en nueva ventana para imprimir
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error printing ticket:', error);
      throw error;
    }
  }

  async downloadTicket(ticket: TicketData, business: BusinessInfo): Promise<void> {
    try {
      const blob = await this.generateTicketPDF(ticket, business);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket_${ticket.saleId}_${Date.now()}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ticket:', error);
      throw error;
    }
  }
}

export const ticketService = new TicketService();
