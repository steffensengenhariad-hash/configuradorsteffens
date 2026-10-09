import { randomUUID } from 'node:crypto';
import { ATTACHMENT_LIMITS, validateAttachmentMetadata, validateAttachmentName } from './public/model.js';

function invalid(message, status = 400) { return Object.assign(new Error(message), { status }); }
function signatureMatches(bytes, mime) {
  if (mime === 'application/pdf') return /^%PDF-(?:1\.[0-7]|2\.0)/.test(bytes.subarray(0, 8).toString('ascii')) && bytes.subarray(Math.max(0, bytes.length - 1024)).includes(Buffer.from('%%EOF'));
  if (mime === 'image/png') return bytes.length >= 45 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.readUInt32BE(8) === 13 && bytes.subarray(12,16).toString('ascii') === 'IHDR' && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0 && bytes.subarray(-12,-8).equals(Buffer.alloc(4)) && bytes.subarray(-8,-4).toString('ascii') === 'IEND';
  if (mime === 'image/jpeg') return bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
  if (mime === 'image/webp') return bytes.length >= 20 && bytes.subarray(0,4).toString('ascii') === 'RIFF' && bytes.readUInt32LE(4) + 8 === bytes.length && bytes.subarray(8,12).toString('ascii') === 'WEBP' && ['VP8 ','VP8L','VP8X'].includes(bytes.subarray(12,16).toString('ascii'));
  return false;
}

export function prepareAttachment(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('Anexo inválido.');
  let name;
  try { name = validateAttachmentName(input.name, input.mime); } catch (error) { throw invalid(error.message); }
  if (typeof input.data !== 'string' || !input.data.length || input.data.length % 4 !== 0 || input.data.length > Math.ceil(ATTACHMENT_LIMITS.fileBytes / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.data)) throw invalid('Conteúdo de anexo inválido ou maior que 5 MiB.', input.data?.length > Math.ceil(ATTACHMENT_LIMITS.fileBytes / 3) * 4 ? 413 : 400);
  const bytes = Buffer.from(input.data, 'base64');
  if (!bytes.length || bytes.length > ATTACHMENT_LIMITS.fileBytes) throw invalid('O arquivo deve ter até 5 MiB.', 413);
  if (bytes.toString('base64') !== input.data) throw invalid('Conteúdo de anexo inválido.');
  if (!signatureMatches(bytes, input.mime)) throw invalid('O conteúdo do arquivo não corresponde ao tipo informado. Envie um PDF, PNG, JPEG ou WebP válido.');
  const metadata = validateAttachmentMetadata({ id: randomUUID(), name, mime: input.mime, size: bytes.length, createdAt: new Date().toISOString() });
  return { ...metadata, data: input.data };
}

export function attachmentMetadata(row) {
  if (!row) return null;
  return validateAttachmentMetadata({ id: row.id, name: row.name, mime: row.mime, size: Number(row.size), createdAt: row.created_at });
}

export function attachmentResponseBytes(attachment) {
  const bytes = Buffer.from(attachment.data, 'base64');
  if (bytes.length !== attachment.size) throw new Error('Conteúdo do anexo indisponível.');
  return bytes;
}
