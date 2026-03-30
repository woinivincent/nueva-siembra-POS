// electron/services/excel.service.ts
import ExcelJS from 'exceljs';
import { dialog } from 'electron';
import { reportsRepository } from '../repositories/reports.repository';

export interface SaleExportData {
  id: number;
  fecha: string;
  hora: string;
  cliente: string;
  cantProductos: number;
  subtotal: number;
  descuento: number;
  total: number;
  efectivo: number;
  debito: number;
  credito: number;
  transferencia: number;
}

// Colores del tema
const COLORS = {
  greenDark: 'FF2E7D32',
  greenLight: 'FF4CAF50',
  purple: 'FF7B1FA2',
  orange: 'FFF57C00',
  yellow: 'FFFFF9C4',
  grayLight: 'FFF5F5F5',
  white: 'FFFFFFFF',
  black: 'FF000000',
};

function applyTitleStyle(cell: ExcelJS.Cell, color: string) {
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color }
  };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

function applyHeaderStyle(cell: ExcelJS.Cell) {
  cell.font = { bold: true, size: 11 };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.grayLight }
  };
  cell.alignment = { vertical: 'middle' };
}

function applyBorders(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
    };
  }
}

export interface ProductExportData {
  productId: number;
  productName: string;
  category: string;
  quantitySold: number;
  avgPrice: number;
  totalRevenue: number;
}

export interface ExpenseExportData {
  id: number;
  date: string;
  time: string;
  concept: string;
  description: string | null;
  amount: number;
  paymentMethod: 'cash' | 'transfer';
}

export interface ReserveExportData {
  id: number;
  date: string;
  time: string;
  type: 'income' | 'expense';
  concept: string;
  category: string | null;
  amount: number;
}

export async function generateSalesExcel(
  sales: SaleExportData[],
  startDate: string,
  endDate: string,
  businessName: string = 'NUEVA SIEMBRA',
  expenses: ExpenseExportData[] = [],
  reserveMovements: ReserveExportData[] = [],
  products: ProductExportData[] = []
): Promise<string | null> {
  // Mostrar diálogo para elegir dónde guardar
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Guardar reporte de ventas',
    defaultPath: `reporte_${startDate}_${endDate}.xlsx`,
    filters: [
      { name: 'Excel', extensions: ['xlsx'] }
    ]
  });

  if (canceled || !filePath) {
    return null;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = businessName;
  workbook.created = new Date();

  // Calcular estadísticas
  const totalVentas = sales.reduce((sum, s) => sum + s.total, 0);
  const cantidadVentas = sales.length;
  const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

  const efectivoTotal = sales.reduce((sum, s) => sum + s.efectivo, 0);
  const debitoTotal = sales.reduce((sum, s) => sum + s.debito, 0);
  const creditoTotal = sales.reduce((sum, s) => sum + s.credito, 0);
  const transferenciaTotal = sales.reduce((sum, s) => sum + s.transferencia, 0);

  // Contar ventas por método (considerando el método principal)
  const efectivoCant = sales.filter(s => s.efectivo > 0).length;
  const debitoCant = sales.filter(s => s.debito > 0).length;
  const creditoCant = sales.filter(s => s.credito > 0).length;
  const transferenciaCant = sales.filter(s => s.transferencia > 0).length;

  // ==================== HOJA 1: RESUMEN ====================
  const wsResumen = workbook.addWorksheet('Resumen');
  
  // Título
  wsResumen.mergeCells('A1:D1');
  const titleCell = wsResumen.getCell('A1');
  titleCell.value = `REPORTE DE VENTAS - ${businessName}`;
  applyTitleStyle(titleCell, COLORS.greenDark);
  wsResumen.getRow(1).height = 30;

  // Período
  wsResumen.getCell('A3').value = 'Período:';
  wsResumen.getCell('A3').font = { bold: true };
  wsResumen.getCell('B3').value = `${startDate} a ${endDate}`;

  // Indicadores principales
  wsResumen.getCell('A5').value = 'INDICADORES PRINCIPALES';
  wsResumen.getCell('A5').font = { bold: true, size: 12 };

  wsResumen.getCell('A7').value = 'Total Ventas';
  wsResumen.getCell('B7').value = totalVentas;
  wsResumen.getCell('B7').numFmt = '"$"#,##0.00';
  wsResumen.getCell('B7').font = { color: { argb: COLORS.greenDark } };

  wsResumen.getCell('A9').value = 'Cantidad de Ventas';
  wsResumen.getCell('B9').value = cantidadVentas;
  wsResumen.getCell('B9').alignment = { horizontal: 'right' };

  wsResumen.getCell('A11').value = 'Ticket Promedio';
  wsResumen.getCell('B11').value = ticketPromedio;
  wsResumen.getCell('B11').numFmt = '"$"#,##0.00';

  // Ajustar anchos
  wsResumen.getColumn('A').width = 25;
  wsResumen.getColumn('B').width = 20;
  wsResumen.getColumn('C').width = 15;
  wsResumen.getColumn('D').width = 15;

  // ==================== HOJA 2: DETALLE VENTAS ====================
  const wsVentas = workbook.addWorksheet('Detalle Ventas');
  
  // Título
  wsVentas.mergeCells('A1:L1');
  const titleVentas = wsVentas.getCell('A1');
  titleVentas.value = 'DETALLE DE VENTAS';
  applyTitleStyle(titleVentas, COLORS.greenDark);
  wsVentas.getRow(1).height = 30;

  // Headers
  const headers = ['ID', 'Fecha', 'Hora', 'Cliente', 'Cant. Productos', 'Subtotal', 'Descuento', 'Total', 'Efectivo', 'Débito', 'Crédito', 'Transferencia'];
  const headerRow = wsVentas.getRow(3);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    applyHeaderStyle(cell);
  });
  applyBorders(headerRow, 12);

  // Datos
  sales.forEach((sale, index) => {
    const row = wsVentas.getRow(index + 4);
    row.getCell(1).value = sale.id;
    row.getCell(2).value = sale.fecha;
    row.getCell(3).value = sale.hora;
    row.getCell(4).value = sale.cliente;
    row.getCell(5).value = sale.cantProductos;
    row.getCell(6).value = sale.subtotal;
    row.getCell(7).value = sale.descuento;
    row.getCell(8).value = sale.total;
    row.getCell(9).value = sale.efectivo;
    row.getCell(10).value = sale.debito;
    row.getCell(11).value = sale.credito;
    row.getCell(12).value = sale.transferencia;

    // Formato moneda
    for (let col = 6; col <= 12; col++) {
      row.getCell(col).numFmt = '"$"#,##0.00';
    }

    // Color alternado
    if (index % 2 === 0) {
      for (let col = 1; col <= 12; col++) {
        row.getCell(col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.grayLight }
        };
      }
    }

    applyBorders(row, 12);
  });

  // Fila de totales
  const totalsRowNum = sales.length + 4;
  const totalsRow = wsVentas.getRow(totalsRowNum);
  totalsRow.getCell(1).value = 'TOTALES';
  totalsRow.getCell(1).font = { bold: true };
  totalsRow.getCell(5).value = sales.reduce((sum, s) => sum + s.cantProductos, 0);
  totalsRow.getCell(6).value = sales.reduce((sum, s) => sum + s.subtotal, 0);
  totalsRow.getCell(7).value = sales.reduce((sum, s) => sum + s.descuento, 0);
  totalsRow.getCell(8).value = totalVentas;
  totalsRow.getCell(9).value = efectivoTotal;
  totalsRow.getCell(10).value = debitoTotal;
  totalsRow.getCell(11).value = creditoTotal;
  totalsRow.getCell(12).value = transferenciaTotal;

  for (let col = 6; col <= 12; col++) {
    totalsRow.getCell(col).numFmt = '"$"#,##0.00';
  }

  totalsRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.yellow }
    };
  });
  applyBorders(totalsRow, 12);

  // Anchos de columna
  wsVentas.getColumn(1).width = 8;
  wsVentas.getColumn(2).width = 12;
  wsVentas.getColumn(3).width = 8;
  wsVentas.getColumn(4).width = 22;
  wsVentas.getColumn(5).width = 16;
  for (let col = 6; col <= 12; col++) {
    wsVentas.getColumn(col).width = 14;
  }

  // ==================== HOJA 3: MÉTODOS DE PAGO ====================
  const wsMetodos = workbook.addWorksheet('Métodos Pago');
  
  wsMetodos.mergeCells('A1:C1');
  const titleMetodos = wsMetodos.getCell('A1');
  titleMetodos.value = 'VENTAS POR MÉTODO DE PAGO';
  applyTitleStyle(titleMetodos, COLORS.purple);
  wsMetodos.getRow(1).height = 30;

  // Headers
  const headerMetodos = wsMetodos.getRow(3);
  headerMetodos.getCell(1).value = 'Método de Pago';
  headerMetodos.getCell(2).value = 'Cantidad';
  headerMetodos.getCell(3).value = 'Total';
  headerMetodos.eachCell((cell) => applyHeaderStyle(cell));
  applyBorders(headerMetodos, 3);

  // Datos
  const metodosData = [
    { nombre: 'Efectivo', cantidad: efectivoCant, total: efectivoTotal },
    { nombre: 'Débito', cantidad: debitoCant, total: debitoTotal },
    { nombre: 'Crédito', cantidad: creditoCant, total: creditoTotal },
    { nombre: 'Transferencia', cantidad: transferenciaCant, total: transferenciaTotal },
  ].filter(m => m.total > 0);

  metodosData.forEach((metodo, index) => {
    const row = wsMetodos.getRow(index + 4);
    row.getCell(1).value = metodo.nombre;
    row.getCell(2).value = metodo.cantidad;
    row.getCell(3).value = metodo.total;
    row.getCell(3).numFmt = '"$"#,##0.00';
    applyBorders(row, 3);
  });

  wsMetodos.getColumn(1).width = 20;
  wsMetodos.getColumn(2).width = 15;
  wsMetodos.getColumn(3).width = 18;

  // ==================== HOJA 4: POR FECHA ====================
  const wsFechas = workbook.addWorksheet('Por Fecha');
  
  wsFechas.mergeCells('A1:D1');
  const titleFechas = wsFechas.getCell('A1');
  titleFechas.value = 'VENTAS POR FECHA';
  applyTitleStyle(titleFechas, COLORS.orange);
  wsFechas.getRow(1).height = 30;

  // Headers
  const headerFechas = wsFechas.getRow(3);
  headerFechas.getCell(1).value = 'Fecha';
  headerFechas.getCell(2).value = 'Cantidad Ventas';
  headerFechas.getCell(3).value = 'Total';
  headerFechas.getCell(4).value = 'Ticket Promedio';
  headerFechas.eachCell((cell) => applyHeaderStyle(cell));
  applyBorders(headerFechas, 4);

  // Agrupar por fecha
  const ventasPorFecha = sales.reduce((acc, sale) => {
    if (!acc[sale.fecha]) {
      acc[sale.fecha] = { cantidad: 0, total: 0 };
    }
    acc[sale.fecha].cantidad++;
    acc[sale.fecha].total += sale.total;
    return acc;
  }, {} as Record<string, { cantidad: number; total: number }>);

  Object.entries(ventasPorFecha).forEach(([fecha, datos], index) => {
    const row = wsFechas.getRow(index + 4);
    row.getCell(1).value = fecha;
    row.getCell(2).value = datos.cantidad;
    row.getCell(3).value = datos.total;
    row.getCell(3).numFmt = '"$"#,##0.00';
    row.getCell(4).value = datos.total / datos.cantidad;
    row.getCell(4).numFmt = '"$"#,##0.00';
    applyBorders(row, 4);
  });

  wsFechas.getColumn(1).width = 15;
  wsFechas.getColumn(2).width = 18;
  wsFechas.getColumn(3).width = 18;
  wsFechas.getColumn(4).width = 18;

  // ==================== HOJA 5: PRODUCTOS ====================
  const wsProductos = workbook.addWorksheet('Productos');

  wsProductos.mergeCells('A1:F1');
  const titleProductos = wsProductos.getCell('A1');
  titleProductos.value = 'DETALLE DE PRODUCTOS VENDIDOS';
  applyTitleStyle(titleProductos, COLORS.greenLight);
  wsProductos.getRow(1).height = 30;

  wsProductos.getCell('A3').value = 'Período:';
  wsProductos.getCell('A3').font = { bold: true };
  wsProductos.getCell('B3').value = `${startDate} a ${endDate}`;

  const headerProductos = wsProductos.getRow(5);
  ['#', 'Producto', 'Categoría', 'Cant. Vendida', 'Precio Prom.', 'Total'].forEach((h, i) => {
    const cell = headerProductos.getCell(i + 1);
    cell.value = h;
    applyHeaderStyle(cell);
  });
  applyBorders(headerProductos, 6);

  products.forEach((p, idx) => {
    const row = wsProductos.getRow(idx + 6);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = p.productName;
    row.getCell(3).value = p.category;
    row.getCell(4).value = p.quantitySold;
    row.getCell(5).value = p.avgPrice;
    row.getCell(5).numFmt = '"$"#,##0.00';
    row.getCell(6).value = p.totalRevenue;
    row.getCell(6).numFmt = '"$"#,##0.00';

    if (idx % 2 === 0) {
      for (let col = 1; col <= 6; col++) {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.grayLight } };
      }
    }
    applyBorders(row, 6);
  });

  if (products.length === 0) {
    wsProductos.getCell('A6').value = 'Sin productos vendidos en el período';
    wsProductos.getCell('A6').font = { italic: true, color: { argb: 'FF999999' } };
  } else {
    const totProdRow = wsProductos.getRow(products.length + 6);
    totProdRow.getCell(1).value = 'TOTAL';
    totProdRow.getCell(4).value = products.reduce((s, p) => s + p.quantitySold, 0);
    totProdRow.getCell(6).value = products.reduce((s, p) => s + p.totalRevenue, 0);
    totProdRow.getCell(6).numFmt = '"$"#,##0.00';
    totProdRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
    });
    applyBorders(totProdRow, 6);
  }

  wsProductos.getColumn(1).width = 6;
  wsProductos.getColumn(2).width = 30;
  wsProductos.getColumn(3).width = 18;
  wsProductos.getColumn(4).width = 15;
  wsProductos.getColumn(5).width = 15;
  wsProductos.getColumn(6).width = 15;

  // ==================== HOJA 6: EGRESOS ====================
  const wsEgresos = workbook.addWorksheet('Egresos');

  wsEgresos.mergeCells('A1:F1');
  const titleEgresos = wsEgresos.getCell('A1');
  titleEgresos.value = 'EGRESOS DE CAJA';
  applyTitleStyle(titleEgresos, 'FFC62828');
  wsEgresos.getRow(1).height = 30;

  // Resumen egresos
  const totalEgresos = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEgresosCash = expenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + e.amount, 0);
  const totalEgresosTransfer = expenses.filter(e => e.paymentMethod === 'transfer').reduce((sum, e) => sum + e.amount, 0);

  wsEgresos.getCell('A3').value = 'Período:';
  wsEgresos.getCell('A3').font = { bold: true };
  wsEgresos.getCell('B3').value = `${startDate} a ${endDate}`;

  wsEgresos.getCell('A5').value = 'Total Egresos';
  wsEgresos.getCell('B5').value = totalEgresos;
  wsEgresos.getCell('B5').numFmt = '"$"#,##0.00';
  wsEgresos.getCell('B5').font = { bold: true, color: { argb: 'FFC62828' } };

  wsEgresos.getCell('A6').value = 'Egresos Efectivo';
  wsEgresos.getCell('B6').value = totalEgresosCash;
  wsEgresos.getCell('B6').numFmt = '"$"#,##0.00';

  wsEgresos.getCell('A7').value = 'Egresos Transferencia';
  wsEgresos.getCell('B7').value = totalEgresosTransfer;
  wsEgresos.getCell('B7').numFmt = '"$"#,##0.00';

  // Headers detalle
  const headerEgresos = wsEgresos.getRow(10);
  ['Fecha', 'Hora', 'Concepto', 'Descripción', 'Medio de Pago', 'Monto'].forEach((h, i) => {
    const cell = headerEgresos.getCell(i + 1);
    cell.value = h;
    applyHeaderStyle(cell);
  });
  applyBorders(headerEgresos, 6);

  // Datos egresos
  expenses.forEach((e, idx) => {
    const row = wsEgresos.getRow(idx + 11);
    row.getCell(1).value = e.date;
    row.getCell(2).value = e.time;
    row.getCell(3).value = e.concept;
    row.getCell(4).value = e.description || '';
    row.getCell(5).value = e.paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo';
    row.getCell(6).value = e.amount;
    row.getCell(6).numFmt = '"$"#,##0.00';

    if (idx % 2 === 0) {
      for (let col = 1; col <= 6; col++) {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8F8' } };
      }
    }
    applyBorders(row, 6);
  });

  if (expenses.length === 0) {
    wsEgresos.getCell('A11').value = 'Sin egresos en el período';
    wsEgresos.getCell('A11').font = { italic: true, color: { argb: 'FF999999' } };
  } else {
    // Fila de total
    const totEgresosRow = wsEgresos.getRow(expenses.length + 11);
    totEgresosRow.getCell(1).value = 'TOTAL';
    totEgresosRow.getCell(6).value = totalEgresos;
    totEgresosRow.getCell(6).numFmt = '"$"#,##0.00';
    totEgresosRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
    });
    applyBorders(totEgresosRow, 6);
  }

  wsEgresos.getColumn(1).width = 12;
  wsEgresos.getColumn(2).width = 8;
  wsEgresos.getColumn(3).width = 28;
  wsEgresos.getColumn(4).width = 25;
  wsEgresos.getColumn(5).width = 16;
  wsEgresos.getColumn(6).width = 14;

  // ==================== HOJA 6: CAJA RESERVA ====================
  const wsReserva = workbook.addWorksheet('Caja Reserva');

  wsReserva.mergeCells('A1:F1');
  const titleReserva = wsReserva.getCell('A1');
  titleReserva.value = 'MOVIMIENTOS CAJA RESERVA';
  applyTitleStyle(titleReserva, 'FF7B1FA2');
  wsReserva.getRow(1).height = 30;

  const totalReservaIn = reserveMovements.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalReservaOut = reserveMovements.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

  wsReserva.getCell('A3').value = 'Período:';
  wsReserva.getCell('A3').font = { bold: true };
  wsReserva.getCell('B3').value = `${startDate} a ${endDate}`;

  wsReserva.getCell('A5').value = 'Total Ingresos Reserva';
  wsReserva.getCell('B5').value = totalReservaIn;
  wsReserva.getCell('B5').numFmt = '"$"#,##0.00';
  wsReserva.getCell('B5').font = { color: { argb: 'FF2E7D32' } };

  wsReserva.getCell('A6').value = 'Total Egresos Reserva';
  wsReserva.getCell('B6').value = totalReservaOut;
  wsReserva.getCell('B6').numFmt = '"$"#,##0.00';
  wsReserva.getCell('B6').font = { color: { argb: 'FFC62828' } };

  wsReserva.getCell('A7').value = 'Balance del período';
  wsReserva.getCell('B7').value = totalReservaIn - totalReservaOut;
  wsReserva.getCell('B7').numFmt = '"$"#,##0.00';
  wsReserva.getCell('B7').font = { bold: true };

  // Headers
  const headerReserva = wsReserva.getRow(10);
  ['Fecha', 'Hora', 'Tipo', 'Concepto', 'Categoría', 'Monto'].forEach((h, i) => {
    const cell = headerReserva.getCell(i + 1);
    cell.value = h;
    applyHeaderStyle(cell);
  });
  applyBorders(headerReserva, 6);

  // Datos reserva
  reserveMovements.forEach((r, idx) => {
    const row = wsReserva.getRow(idx + 11);
    row.getCell(1).value = r.date;
    row.getCell(2).value = r.time;
    row.getCell(3).value = r.type === 'income' ? 'Ingreso' : 'Egreso';
    row.getCell(4).value = r.concept;
    row.getCell(5).value = r.category || 'Sin categoría';
    row.getCell(6).value = r.type === 'income' ? r.amount : -r.amount;
    row.getCell(6).numFmt = '"$"#,##0.00';

    const bgColor = r.type === 'income' ? 'FFE8F5E9' : 'FFFFEBEE';
    for (let col = 1; col <= 6; col++) {
      row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    }
    applyBorders(row, 6);
  });

  if (reserveMovements.length === 0) {
    wsReserva.getCell('A11').value = 'Sin movimientos en el período';
    wsReserva.getCell('A11').font = { italic: true, color: { argb: 'FF999999' } };
  }

  wsReserva.getColumn(1).width = 12;
  wsReserva.getColumn(2).width = 8;
  wsReserva.getColumn(3).width = 10;
  wsReserva.getColumn(4).width = 28;
  wsReserva.getColumn(5).width = 18;
  wsReserva.getColumn(6).width = 14;

  // Guardar
  await workbook.xlsx.writeFile(filePath);
  
  return filePath;
}
export interface CashMovementExport {
  id: number;
  type: 'income' | 'expense' | 'sale';
  amount: number;
  concept: string;
  description: string | null;
  createdAt: Date;
}

export interface CashSummaryExport {
  openingAmount: number;
  salesCash: number;
  income: number;
  expense: number;
  expected: number;
  salesDebit: number;
  salesCredit: number;
  salesTransfer: number;
}

export async function generateCashRegisterExcel(
  movements: CashMovementExport[],
  summary: CashSummaryExport,
  registerDate: string
): Promise<string | null> {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Guardar reporte de caja',
    defaultPath: `caja_${registerDate}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });

  if (canceled || !filePath) return null;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nueva Siembra POS';
  workbook.created = new Date();

  // === HOJA 1: RESUMEN ===
  const wsResumen = workbook.addWorksheet('Resumen');
  
  wsResumen.mergeCells('A1:C1');
  const titleCell = wsResumen.getCell('A1');
  titleCell.value = 'RESUMEN DE CAJA';
  titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsResumen.getRow(1).height = 30;

  wsResumen.getCell('A3').value = 'Fecha:';
  wsResumen.getCell('A3').font = { bold: true };
  wsResumen.getCell('B3').value = registerDate;

  // Efectivo
  wsResumen.getCell('A5').value = 'MOVIMIENTOS EN EFECTIVO';
  wsResumen.getCell('A5').font = { bold: true, size: 12 };

  const cashData = [
    ['Monto inicial', summary.openingAmount],
    ['Ventas en efectivo', summary.salesCash],
    ['Ingresos manuales', summary.income],
    ['Egresos', -summary.expense],
    ['Total esperado', summary.expected],
  ];

  cashData.forEach((row, idx) => {
    const rowNum = 7 + idx;
    wsResumen.getCell(`A${rowNum}`).value = row[0];
    wsResumen.getCell(`B${rowNum}`).value = row[1];
    wsResumen.getCell(`B${rowNum}`).numFmt = '"$"#,##0.00';
    if (idx === cashData.length - 1) {
      wsResumen.getCell(`A${rowNum}`).font = { bold: true };
      wsResumen.getCell(`B${rowNum}`).font = { bold: true };
      wsResumen.getCell(`A${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
      wsResumen.getCell(`B${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
    }
  });

  // Electrónico
  wsResumen.getCell('A14').value = 'VENTAS ELECTRÓNICAS';
  wsResumen.getCell('A14').font = { bold: true, size: 12 };

  const electronicData = [
    ['Débito', summary.salesDebit],
    ['Crédito', summary.salesCredit],
    ['Transferencia', summary.salesTransfer],
    ['Total electrónico', summary.salesDebit + summary.salesCredit + summary.salesTransfer],
  ];

  electronicData.forEach((row, idx) => {
    const rowNum = 16 + idx;
    wsResumen.getCell(`A${rowNum}`).value = row[0];
    wsResumen.getCell(`B${rowNum}`).value = row[1];
    wsResumen.getCell(`B${rowNum}`).numFmt = '"$"#,##0.00';
    if (idx === electronicData.length - 1) {
      wsResumen.getCell(`A${rowNum}`).font = { bold: true };
      wsResumen.getCell(`B${rowNum}`).font = { bold: true };
    }
  });

  // Total general
  wsResumen.getCell('A21').value = 'TOTAL GENERAL';
  wsResumen.getCell('A21').font = { bold: true, size: 12 };
  wsResumen.getCell('B21').value = summary.expected + summary.salesDebit + summary.salesCredit + summary.salesTransfer;
  wsResumen.getCell('B21').numFmt = '"$"#,##0.00';
  wsResumen.getCell('B21').font = { bold: true, size: 12, color: { argb: 'FF2E7D32' } };

  wsResumen.getColumn('A').width = 25;
  wsResumen.getColumn('B').width = 18;

  // === HOJA 2: MOVIMIENTOS ===
  const wsMovimientos = workbook.addWorksheet('Movimientos');

  wsMovimientos.mergeCells('A1:E1');
  const titleMov = wsMovimientos.getCell('A1');
  titleMov.value = 'DETALLE DE MOVIMIENTOS';
  titleMov.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
  titleMov.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
  titleMov.alignment = { horizontal: 'center', vertical: 'middle' };
  wsMovimientos.getRow(1).height = 30;

  // Headers
  const headers = ['Fecha/Hora', 'Tipo', 'Concepto', 'Descripción', 'Monto'];
  const headerRow = wsMovimientos.getRow(3);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    };
  });

  // Data
  movements.forEach((m, idx) => {
    const row = wsMovimientos.getRow(idx + 4);
    row.getCell(1).value = new Date(m.createdAt).toLocaleString('es-AR');
    row.getCell(2).value = m.type === 'sale' ? 'Venta' : m.type === 'income' ? 'Ingreso' : 'Egreso';
    row.getCell(3).value = m.concept;
    row.getCell(4).value = m.description || '';
    row.getCell(5).value = m.type === 'expense' ? -m.amount : m.amount;
    row.getCell(5).numFmt = '"$"#,##0.00';

    // Color por tipo
    const typeColors: Record<string, string> = {
      sale: 'FFE8F5E9',
      income: 'FFE3F2FD',
      expense: 'FFFFEBEE',
    };
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: typeColors[m.type] || 'FFFFFFFF' } };
    });
  });

  wsMovimientos.getColumn(1).width = 18;
  wsMovimientos.getColumn(2).width = 10;
  wsMovimientos.getColumn(3).width = 30;
  wsMovimientos.getColumn(4).width = 25;
  wsMovimientos.getColumn(5).width = 14;

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

export interface ReserveMovementExport {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  concept: string;
  category: string | null;
  description: string | null;
  createdAt: Date;
}

export interface ReserveSummaryExport {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export async function generateReserveExcel(
  movements: ReserveMovementExport[],
  summary: ReserveSummaryExport
): Promise<string | null> {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Guardar reporte de caja reserva',
    defaultPath: `caja_reserva_${new Date().toISOString().split('T')[0]}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });

  if (canceled || !filePath) return null;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nueva Siembra POS';
  workbook.created = new Date();

  // === HOJA 1: RESUMEN ===
  const wsResumen = workbook.addWorksheet('Resumen');

  wsResumen.mergeCells('A1:B1');
  const titleCell = wsResumen.getCell('A1');
  titleCell.value = 'CAJA RESERVA - RESUMEN';
  titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD84315' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsResumen.getRow(1).height = 30;

  wsResumen.getCell('A3').value = 'Fecha de reporte:';
  wsResumen.getCell('A3').font = { bold: true };
  wsResumen.getCell('B3').value = new Date().toLocaleDateString('es-AR');

  wsResumen.getCell('A5').value = 'Total Ingresos';
  wsResumen.getCell('B5').value = summary.totalIncome;
  wsResumen.getCell('B5').numFmt = '"$"#,##0.00';
  wsResumen.getCell('B5').font = { color: { argb: 'FF2E7D32' } };

  wsResumen.getCell('A6').value = 'Total Egresos';
  wsResumen.getCell('B6').value = -summary.totalExpense;
  wsResumen.getCell('B6').numFmt = '"$"#,##0.00';
  wsResumen.getCell('B6').font = { color: { argb: 'FFC62828' } };

  wsResumen.getCell('A8').value = 'BALANCE';
  wsResumen.getCell('A8').font = { bold: true, size: 12 };
  wsResumen.getCell('B8').value = summary.balance;
  wsResumen.getCell('B8').numFmt = '"$"#,##0.00';
  wsResumen.getCell('B8').font = { bold: true, size: 12, color: { argb: summary.balance >= 0 ? 'FF2E7D32' : 'FFC62828' } };

  wsResumen.getColumn('A').width = 20;
  wsResumen.getColumn('B').width = 18;

  // === HOJA 2: MOVIMIENTOS ===
  const wsMovimientos = workbook.addWorksheet('Movimientos');

  wsMovimientos.mergeCells('A1:F1');
  const titleMov = wsMovimientos.getCell('A1');
  titleMov.value = 'DETALLE DE MOVIMIENTOS';
  titleMov.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
  titleMov.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD84315' } };
  titleMov.alignment = { horizontal: 'center', vertical: 'middle' };
  wsMovimientos.getRow(1).height = 30;

  // Headers
  const headers = ['Fecha/Hora', 'Tipo', 'Concepto', 'Categoría', 'Descripción', 'Monto'];
  const headerRow = wsMovimientos.getRow(3);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  });

  // Data
  movements.forEach((m, idx) => {
    const row = wsMovimientos.getRow(idx + 4);
    row.getCell(1).value = new Date(m.createdAt).toLocaleString('es-AR');
    row.getCell(2).value = m.type === 'income' ? 'Ingreso' : 'Egreso';
    row.getCell(3).value = m.concept;
    row.getCell(4).value = m.category || 'Sin categoría';
    row.getCell(5).value = m.description || '';
    row.getCell(6).value = m.type === 'income' ? m.amount : -m.amount;
    row.getCell(6).numFmt = '"$"#,##0.00';

    const bgColor = m.type === 'income' ? 'FFE8F5E9' : 'FFFFEBEE';
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    });
  });

  wsMovimientos.getColumn(1).width = 18;
  wsMovimientos.getColumn(2).width = 10;
  wsMovimientos.getColumn(3).width = 25;
  wsMovimientos.getColumn(4).width = 15;
  wsMovimientos.getColumn(5).width = 25;
  wsMovimientos.getColumn(6).width = 14;

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}