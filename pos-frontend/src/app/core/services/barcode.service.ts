import { Injectable } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Injectable({ providedIn: 'root' })
export class BarcodeService {

  /**
   * Generates a CODE128 barcode and returns it as a base64 PNG data URL.
   * Used for label preview before printing.
   */
  generateBarcode(value: string): string {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, value, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 6,
        background: '#ffffff',
        lineColor: '#000000'
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Barcode generation failed:', err);
      return '';
    }
  }

  /**
   * Generates a unique barcode for a new product.
   * Format: GH + 10-digit timestamp
   * e.g. GH1718234567890 (trimmed to 13 chars total)
   */
  generateUniqueBarcode(): string {
    const ts = Date.now().toString().slice(-10);
    return `GH${ts}`;
  }

  /**
   * Validates that a string is a plausible barcode:
   * alphanumeric, 4–30 characters.
   */
  isBarcode(value: string): boolean {
    return /^[A-Za-z0-9\-\.]{4,30}$/.test(value);
  }

  /**
   * Returns true if the input was likely typed by a scanner:
   * - All digits OR GH-prefixed alphanumeric
   * - Arrived faster than 100ms (caller checks timing)
   */
  looksLikeBarcode(value: string): boolean {
    return /^\d{6,}$/.test(value) || /^GH\d{8,}$/i.test(value) || this.isBarcode(value);
  }
}
