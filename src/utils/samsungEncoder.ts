/**
 * Samsung TV String Encoder / Decoder
 * 
 * Samsung TV SQLite databases store strings in UTF-16LE.
 * This utility handles exact lossless decoding to standard UTF-8 and re-encoding for TV storage.
 */

export function decodeSamsungString(raw: unknown): string {
  if (raw == null) return '';

  // If already a typed byte array
  if (raw instanceof Uint8Array || ArrayBuffer.isView(raw)) {
    try {
      const u8 = new Uint8Array(
        raw.buffer,
        raw.byteOffset,
        raw.byteLength
      );
      return new TextDecoder('utf-16le').decode(u8).replace(/\0/g, '').trim();
    } catch {
      // Fallback
    }
  }

  // Convert to string safely
  let strInput: string;
  if (typeof raw === 'string') {
    strInput = raw;
  } else if (typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw);
  } else {
    try {
      strInput = String(raw);
    } catch {
      return '';
    }
  }

  if (!strInput) return '';

  let decoded = '';
  for (let i = 0; i < strInput.length; i++) {
    const code = strInput.charCodeAt(i);
    // Swap high and low bytes
    const swapped = ((code & 0xFF) << 8) | (code >> 8);
    decoded += String.fromCharCode(swapped);
  }

  return decoded.replace(/\0/g, '').trim();
}

export function encodeSamsungString(clean: string): string {
  if (!clean) return '';
  
  let str = '';
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const swapped = ((code & 0xFF) << 8) | (code >> 8);
    str += String.fromCharCode(swapped);
  }
  return str;
}

export function formatFrequency(freqKHzOrHz: number): string {
  if (!freqKHzOrHz || freqKHzOrHz === 0) return '—';
  let mhz = freqKHzOrHz;
  if (freqKHzOrHz > 1000000) {
    mhz = freqKHzOrHz / 1000;
  }
  return `${(mhz / 1000).toFixed(3)} GHz (${Math.round(mhz)} MHz)`;
}

export function calculateSignalScore(sigQa: number, bitErr: number, sigStr: number): number {
  const normalizedBitErr = Math.min(bitErr, 500);
  const score = (sigQa * 2) - (normalizedBitErr * 0.5) + (sigStr * 0.8);
  return Math.round(score * 10) / 10;
}
