import QRCode from 'qrcode';

export async function generateQRDataUrl(payload) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return QRCode.toDataURL(data, { width: 320, margin: 1 });
}
