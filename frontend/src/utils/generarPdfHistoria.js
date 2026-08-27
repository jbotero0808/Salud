import { jsPDF } from 'jspdf';
import { PALETAS, COLOR_POR_DEFECTO } from '../theme/paletas';

function hexARgb(hex) {
  const limpio = hex.replace('#', '');
  return [
    parseInt(limpio.slice(0, 2), 16),
    parseInt(limpio.slice(2, 4), 16),
    parseInt(limpio.slice(4, 6), 16),
  ];
}

function formatoDeDataUrl(dataUrl) {
  const match = /^data:image\/(\w+);base64,/.exec(dataUrl || '');
  if (!match) return null;
  const tipo = match[1].toLowerCase();
  if (tipo === 'jpg' || tipo === 'jpeg') return 'JPEG';
  if (tipo === 'png') return 'PNG';
  if (tipo === 'webp') return 'WEBP';
  return null;
}

async function urlABase64(url) {
  const respuesta = await fetch(url);
  const blob = await respuesta.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function medirImagen(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ancho: img.naturalWidth, alto: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

const FECHA_LARGA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export async function generarPdfHistoria({ historia, paciente, medico }) {
  const paleta = PALETAS[medico?.color_primario] || PALETAS[COLOR_POR_DEFECTO];
  const [pr, pg, pb] = hexARgb(paleta.primary);
  const [dr, dg, db] = hexARgb(paleta.dark);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margen = 18;
  const margenInferior = 24;
  let y = 20;

  // ---------- Encabezado: logo + empresa + médico ----------
  let xTexto = margen;
  if (medico?.foto_logo_url) {
    try {
      const dataUrl = medico.foto_logo_url.startsWith('data:')
        ? medico.foto_logo_url
        : await urlABase64(medico.foto_logo_url);
      const formato = formatoDeDataUrl(dataUrl) || 'PNG';
      const dims = await medirImagen(dataUrl);
      const cajaW = 24;
      const cajaH = 24;
      let w = cajaW;
      let h = cajaH;
      if (dims && dims.ancho && dims.alto) {
        const ratio = dims.ancho / dims.alto;
        if (ratio > 1) h = cajaW / ratio;
        else w = cajaH * ratio;
      }
      doc.addImage(dataUrl, formato, margen, y - 2, w, h);
      xTexto = margen + cajaW + 6;
    } catch {
      // Si el logo no se puede cargar (ej. bloqueado por CORS), se omite sin romper el PDF.
    }
  }

  doc.setTextColor(dr, dg, db);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(medico?.empresa || 'Historia Clínica', xTexto, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(medico?.nombre || '', xTexto, y + 13);

  y += 26;
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(1.2);
  doc.line(margen, y, anchoPagina - margen, y);
  y += 10;

  // ---------- Título ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.text('Historia Clínica', margen, y);
  y += 10;

  // ---------- Datos del paciente ----------
  const filaInfo = (etiqueta, valor) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(dr, dg, db);
    doc.text(`${etiqueta}:`, margen, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(String(valor ?? '—'), margen + 32, y);
    y += 7;
  };

  filaInfo('Paciente', paciente?.nombre);
  filaInfo('Cédula', paciente?.cedula);
  filaInfo('Celular', paciente?.celular);
  filaInfo('Fecha de la cita', historia?.fecha ? FECHA_LARGA.format(new Date(historia.fecha)) : '—');
  filaInfo('Tipo de consulta', historia?.tipo_consulta);
  if (historia?.proxima_revision) {
    filaInfo('Próxima revisión', FECHA_LARGA.format(new Date(historia.proxima_revision)));
  }

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margen, y, anchoPagina - margen, y);
  y += 10;

  // ---------- Secciones de texto largo ----------
  const seccion = (titulo, contenido) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(pr, pg, pb);
    doc.text(titulo, margen, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const lineas = doc.splitTextToSize(contenido && contenido.trim() ? contenido : '—', anchoPagina - margen * 2);
    doc.text(lineas, margen, y);
    y += lineas.length * 5.5 + 8;
  };

  seccion('Observaciones', historia?.observaciones);
  seccion('Tratamiento', historia?.tratamiento);

  // ---------- Imagen adjunta a la evolución ----------
  if (historia?.imagen_url) {
    try {
      const dataUrl = historia.imagen_url.startsWith('data:')
        ? historia.imagen_url
        : await urlABase64(historia.imagen_url);
      const formato = formatoDeDataUrl(dataUrl) || 'JPEG';
      const dims = await medirImagen(dataUrl);

      const anchoMax = anchoPagina - margen * 2;
      const altoMax = 100;
      let w = anchoMax;
      let h = altoMax;
      if (dims && dims.ancho && dims.alto) {
        h = w / (dims.ancho / dims.alto);
        if (h > altoMax) {
          h = altoMax;
          w = h * (dims.ancho / dims.alto);
        }
      }

      if (y + 7 + h > alturaPagina - margenInferior) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(pr, pg, pb);
      doc.text('Imagen adjunta', margen, y);
      y += 7;

      doc.addImage(dataUrl, formato, margen, y, w, h);
      y += h + 8;
    } catch {
      // Si la imagen no se puede cargar, se omite sin romper el resto del PDF.
    }
  }

  // ---------- Pie de página ----------
  doc.setDrawColor(230, 230, 230);
  doc.line(margen, alturaPagina - 16, anchoPagina - margen, alturaPagina - 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generado el ${FECHA_LARGA.format(new Date())}${medico?.empresa ? ' · ' + medico.empresa : ''}`, margen, alturaPagina - 10);

  const nombreArchivo = `Historia_${(paciente?.nombre || 'paciente').replace(/\s+/g, '_')}_${new Date(historia?.fecha || Date.now()).toISOString().slice(0, 10)}.pdf`;
  doc.save(nombreArchivo);
}
