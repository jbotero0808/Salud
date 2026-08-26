import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addDays, addMonths, addWeeks, isSameDay, isSameMonth, format as formatFns,
} from 'date-fns';
import { es } from 'date-fns/locale';

export function format(date, pattern) {
  return formatFns(date, pattern, { locale: es });
}

export function diasDelMes(fechaRef) {
  const inicio = startOfWeek(startOfMonth(fechaRef), { weekStartsOn: 1 });
  const fin = endOfWeek(endOfMonth(fechaRef), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: inicio, end: fin });
}

export function diasDeLaSemana(fechaRef) {
  const inicio = startOfWeek(fechaRef, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: inicio, end: addDays(inicio, 6) });
}

export function rangoParaVista(vista, fechaRef) {
  if (vista === 'mes') {
    const dias = diasDelMes(fechaRef);
    return { desde: dias[0], hasta: dias[dias.length - 1] };
  }
  if (vista === 'semana') {
    const dias = diasDeLaSemana(fechaRef);
    return { desde: dias[0], hasta: dias[dias.length - 1] };
  }
  return { desde: fechaRef, hasta: fechaRef };
}

export function avanzar(vista, fechaRef, direccion) {
  if (vista === 'mes') return addMonths(fechaRef, direccion);
  if (vista === 'semana') return addWeeks(fechaRef, direccion);
  return addDays(fechaRef, direccion);
}

export { isSameDay, isSameMonth, es };
