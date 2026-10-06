/**
 * Web Bluetooth Thermal ESC/POS Printer Service
 * Handles Web Bluetooth API connections, GATT service discovery,
 * byte chunk writing, and Canvas Raster Graphics (GS v 0) for 100% visual fidelity printing.
 */
import html2canvas from 'html2canvas';

// Common Bluetooth GATT Service UUIDs used by thermal printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common 58mm/80mm Serial UART Service (HM-10 / POS-58)
  '00004953-0739-427c-922c-072302b16707', // ISSC Serial Port
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Generic POS Printer
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip/ISSC UART
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
];

const STORAGE_KEY_PRINTER = 'nirman_bt_printer_name';
const STORAGE_KEY_PAPER = 'nirman_bt_printer_paper';

class BluetoothPrinterService {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.paperWidth = localStorage.getItem(STORAGE_KEY_PAPER) || '80mm'; // '80mm' (Epson TM-T82X-II 3-inch) or '58mm'
  }

  /**
   * Check if Web Bluetooth API is supported by current browser and environment
   */
  isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Check if currently connected to a GATT printer characteristic
   */
  isConnected() {
    return !!(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  /**
   * Get connected printer name or last saved printer name
   */
  getPrinterName() {
    if (this.device && this.device.name) {
      return this.device.name;
    }
    return localStorage.getItem(STORAGE_KEY_PRINTER) || null;
  }

  /**
   * Get selected paper width ('58mm' or '80mm')
   */
  getPaperWidth() {
    return this.paperWidth;
  }

  /**
   * Save selected paper width
   */
  setPaperWidth(width) {
    this.paperWidth = width;
    localStorage.setItem(STORAGE_KEY_PAPER, width);
  }

  /**
   * Prompt user to select and connect a Bluetooth Printer device
   */
  async connect() {
    if (!this.isSupported()) {
      throw new Error('तुमच्या ब्राऊझरमध्ये Web Bluetooth सपोर्ट नाही. कृपया Google Chrome किंवा Microsoft Edge वापरा.');
    }

    try {
      // Request device with printer service filters and acceptAllDevices fallback
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (!this.device) {
        throw new Error('कोणताही ब्लूटूथ प्रिंटर निवडला नाही.');
      }

      // Handle disconnection event
      this.device.addEventListener('gattserverdisconnected', () => {
        this.characteristic = null;
        this.server = null;
      });

      // Connect to GATT Server
      this.server = await this.device.gatt.connect();

      // Find primary service and writable characteristic
      this.characteristic = await this.findWritableCharacteristic(this.server);

      if (!this.characteristic) {
        throw new Error('प्रिंटरची ब्लूटूथ राइटिंग सर्व्हिस सापडली नाही. प्रिंटर चालू असल्याची खात्री करा.');
      }

      // Save connected device name
      if (this.device.name) {
        localStorage.setItem(STORAGE_KEY_PRINTER, this.device.name);
      }

      return {
        success: true,
        deviceName: this.device.name || 'Bluetooth Thermal Printer',
      };
    } catch (err) {
      this.disconnect();
      if (err.name === 'NotFoundError') {
        throw new Error('ब्लूटूथ प्रिंटर निवड रद्द करण्यात आली.');
      }
      throw new Error(err.message || 'ब्लूटूथ प्रिंटर कनेक्ट करताना त्रुटी आली.');
    }
  }

  /**
   * Disconnect current printer connection
   */
  disconnect() {
    try {
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
    } catch (e) {
      console.warn('Error during printer disconnect:', e);
    } finally {
      this.device = null;
      this.server = null;
      this.characteristic = null;
    }
  }

  /**
   * Search through available GATT primary services for a writable characteristic
   */
  async findWritableCharacteristic(server) {
    // 1. Try known printer UUIDs first
    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();

        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        }
      } catch (e) {
        // Service not supported on this specific device, try next
      }
    }

    // 2. Fallback: Get all primary services
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to retrieve all GATT services:', e);
    }

    return null;
  }

  /**
   * Send binary data buffer to printer in chunks (prevents buffer overflow on cheap thermal printers)
   */
  async printBuffer(buffer) {
    if (!this.isConnected()) {
      await this.connect();
    }

    if (!this.characteristic) {
      throw new Error('ब्लूटूथ प्रिंटर कनेक्ट केलेला नाही.');
    }

    const CHUNK_SIZE = 80; // 80 bytes per packet
    const totalLength = buffer.length;

    for (let i = 0; i < totalLength; i += CHUNK_SIZE) {
      const chunk = buffer.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValueWithResponse(chunk);
      }
      // Small pause to allow printer's internal serial buffer to process
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }

  /**
   * Convert an HTML Receipt DOM Element directly to ESC/POS Raster Bit Image (GS v 0)
   * Guarantees 100% exact visual match (Marathi Devanagari fonts, layout, borders & prices)
   */
  async printReceiptElement(elementOrId) {
    if (!this.isSupported()) {
      throw new Error('तुमच्या ब्राऊझरमध्ये Web Bluetooth सपोर्ट नाही. कृपया Chrome किंवा Edge वापरा.');
    }

    if (!this.isConnected()) {
      await this.connect();
    }

    let elem = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!elem) {
      elem = document.getElementById('pos-bill-receipt-paper') || document.getElementById('history-bill-receipt-paper');
    }

    if (!elem) {
      throw new Error('पावतीचा लेआऊट सापडला नाही.');
    }

    // 1. Render DOM element to canvas with high resolution scale
    const canvas = await html2canvas(elem, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    // 2. Convert Canvas pixels into ESC/POS monochrome bit graphics
    let targetWidth = 576; // Default 80mm (3-inch)
    if (this.paperWidth === '100mm') {
      targetWidth = 800; // 4-inch roll
    } else if (this.paperWidth === '58mm') {
      targetWidth = 384; // 2-inch roll
    }
    const rasterBuffer = this.canvasToEscPosRaster(canvas, targetWidth);

    // 3. Print raster bytes over Bluetooth
    await this.printBuffer(rasterBuffer);
    return true;
  }

  /**
   * Convert Canvas Image into ESC/POS GS v 0 Raster Bit Image Buffer
   */
  canvasToEscPosRaster(canvas, targetWidth = 384) {
    const scale = targetWidth / canvas.width;
    const targetHeight = Math.round(canvas.height * scale);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = targetWidth;
    offCanvas.height = targetHeight;
    const ctx = offCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    const widthBytes = Math.ceil(targetWidth / 8);
    const rasterData = [];

    // Reset Printer & Center Align
    rasterData.push(0x1B, 0x40); // ESC @
    rasterData.push(0x1B, 0x61, 1); // Center Align

    // Process image in slices of max 192px height for smooth GATT transfer
    const MAX_SLICE_HEIGHT = 192;
    for (let sliceY = 0; sliceY < targetHeight; sliceY += MAX_SLICE_HEIGHT) {
      const sliceHeight = Math.min(MAX_SLICE_HEIGHT, targetHeight - sliceY);

      // GS v 0 0 xL xH yL yH
      rasterData.push(
        0x1D, 0x76, 0x30, 0x00,
        widthBytes & 0xFF, (widthBytes >> 8) & 0xFF,
        sliceHeight & 0xFF, (sliceHeight >> 8) & 0xFF
      );

      for (let y = sliceY; y < sliceY + sliceHeight; y++) {
        for (let b = 0; b < widthBytes; b++) {
          let byteVal = 0;
          for (let bit = 0; bit < 8; bit++) {
            const x = b * 8 + bit;
            if (x < targetWidth) {
              const idx = (y * targetWidth + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const bVal = data[idx + 2];
              const alpha = data[idx + 3];
              // Luminance threshold for crisp black & white thermal print
              const brightness = (r * 0.299 + g * 0.587 + bVal * 0.114);
              const isBlack = alpha > 128 && brightness < 200;
              if (isBlack) {
                byteVal |= (128 >> bit);
              }
            }
          }
          rasterData.push(byteVal);
        }
      }
    }

    // Feed lines & Tear indicator
    rasterData.push(0x1B, 0x64, 3); // Feed 3 lines
    rasterData.push(0x1D, 0x56, 66, 0); // GS V 66 0 Cut

    return new Uint8Array(rasterData);
  }

  /**
   * Primary method to print bill (Uses Canvas Raster for 100% exact design match)
   */
  async printBill(billData, elementId = null) {
    if (!this.isSupported()) {
      throw new Error('तुमच्या ब्राऊझरमध्ये Web Bluetooth सपोर्ट नाही. कृपया Chrome किंवा Edge वापरा.');
    }

    if (!this.isConnected()) {
      await this.connect();
    }

    // Find rendered receipt DOM element on screen
    const targetId = elementId || (document.getElementById('pos-bill-receipt-paper') ? 'pos-bill-receipt-paper' : 'history-bill-receipt-paper');
    const elem = typeof targetId === 'string' ? document.getElementById(targetId) : targetId;

    if (elem) {
      return await this.printReceiptElement(elem);
    }

    // Fallback: ESC/POS text format if element not in DOM
    const escPosBuffer = this.generateBillEscPos(billData);
    await this.printBuffer(escPosBuffer);
    return true;
  }

  /**
   * Print a quick test receipt to verify Bluetooth printer connection
   */
  async printTestPage() {
    if (!this.isSupported()) {
      throw new Error('तुमच्या ब्राऊझरमध्ये Web Bluetooth सपोर्ट नाही.');
    }

    if (!this.isConnected()) {
      await this.connect();
    }

    // Check if receipt paper element is available on screen
    const elem = document.getElementById('pos-bill-receipt-paper') || document.getElementById('history-bill-receipt-paper');
    if (elem) {
      return await this.printReceiptElement(elem);
    }

    const dummyBill = {
      billId: 'TEST-001',
      createdAt: new Date().toISOString(),
      customerName: 'रोख ग्राहक',
      customerPhone: '',
      items: [
        { name: 'उडीद डाळ', quantity: 1, unit: 'kg', sellingPrice: 132, subtotal: 132 },
        { name: 'इंद्रायणी तांदूळ', quantity: 1, unit: 'kg', sellingPrice: 75, subtotal: 75 },
      ],
      totalAmount: 207,
      amountPaid: 207,
      paymentStatus: 'PAID',
      paymentType: 'CASH',
    };

    const escPosBuffer = this.generateBillEscPos(dummyBill);
    await this.printBuffer(escPosBuffer);
    return true;
  }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothPrinterService();
export default bluetoothPrinter;
