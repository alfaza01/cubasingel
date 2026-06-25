export class EscPosEncoder {
  private buffer: number[] = [];

  initialize() {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1B, 0x61, 0x01);
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1B, 0x61, 0x00);
    return this;
  }

  alignRight() {
    this.buffer.push(0x1B, 0x61, 0x02);
    return this;
  }

  bold(on: boolean) {
    this.buffer.push(0x1B, 0x45, on ? 1 : 0);
    return this;
  }

  text(str: string) {
    for (let i = 0; i < str.length; i++) {
      // Basic ASCII mapping, ignoring complex unicode for simplification
      const charCode = str.charCodeAt(i);
      this.buffer.push(charCode > 255 ? 63 : charCode);
    }
    return this;
  }

  newline() {
    this.buffer.push(0x0A);
    return this;
  }

  line(char: string = '-', length: number = 32) {
    this.text(char.repeat(length));
    this.newline();
    return this;
  }

  textLine(str: string) {
    this.text(str);
    this.newline();
    return this;
  }

  printAndFeed(lines: number = 4) {
    this.buffer.push(0x1B, 0x64, lines);
    return this;
  }

  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export function printViaRawBT(data: Uint8Array) {
  return new Promise<boolean>((resolve, reject) => {
    try {
      let binary = '';
      const len = data.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
      }
      const base64Data = btoa(binary);
      
      // Must prefix with 'base64,' so RawBT parses the data as binary ESC/POS
      const intentUrl = `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      
      // Use an invisible anchor tag to ensure the intent is launched successfully
      // within Capacitor/Cordova WebViews and standard browsers.
      const link = document.createElement('a');
      link.href = intentUrl;
      // Target _system guarantees native handling in hybrid apps like Capacitor
      link.target = '_system';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        resolve(true);
      }, 500);
    } catch (err: any) {
      reject(new Error('Gagal mencetak via RawBT: ' + err.message));
    }
  });
}

export async function printViaWebBluetooth(data: Uint8Array) {
  try {
    // 1. NATIVE BLUETOOTH (CAPACITOR / CORDOVA PLUGIN)
    if ((window as any).bluetoothSerial) {
      const macAddress = localStorage.getItem('bluetooth_printer_mac');
      if (!macAddress) {
        throw new Error('Printer belum dikonfigurasi. Silakan hubungkan printer di menu "Pengaturan Pos" terlebih dahulu.');
      }

      return new Promise((resolve, reject) => {
        const writeData = () => {
          (window as any).bluetoothSerial.write(
            data.buffer, // Send as ArrayBuffer
            () => resolve(true),
            (err: any) => reject(new Error('Gagal mengirim data cetak: ' + err))
          );
        };

        const executeConnection = () => {
          // Cek apakah sudah terhubung
          (window as any).bluetoothSerial.isConnected(
            () => {
              writeData();
            },
            () => {
              // Jika belum terhubung, coba reconnect otomatis
              (window as any).bluetoothSerial.connect(
                macAddress,
                () => {
                  writeData();
                },
                (err: any) => {
                  // Fallback to connectInsecure
                  (window as any).bluetoothSerial.connectInsecure(
                    macAddress,
                    () => {
                      writeData();
                    },
                    (err2: any) => {
                      reject(new Error(`Gagal terhubung ulang ke printer:\nNormal: ${err}\nInsecure: ${err2}`));
                    }
                  );
                }
              );
            }
          );
        };

        const permissions = (window as any).cordova?.plugins?.permissions;
        if (!permissions) {
          executeConnection();
          return;
        }

        const permsToRequest = [
          permissions.BLUETOOTH_CONNECT,
          permissions.BLUETOOTH_SCAN,
          permissions.ACCESS_FINE_LOCATION,
          permissions.ACCESS_COARSE_LOCATION
        ].filter(Boolean);

        permissions.requestPermissions(permsToRequest, (status: any) => {
          executeConnection(); // Proceed regardless, let native gracefully error if still false
        }, () => executeConnection());
      });
    }

    // 2. FALLBACK KE WEB BLUETOOTH (BROWSER / PWA)
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    });

    if (!device.gatt) throw new Error('Device does not support GATT');

    const server = await device.gatt.connect();
    
    // Find the primary service that matched
    const services = await server.getPrimaryServices();
    if (services.length === 0) throw new Error('No services found');
    
    const service = services[0]; // Just take the first available typical service
    const characteristics = await service.getCharacteristics();
    if (characteristics.length === 0) throw new Error('No characteristics found');
    
    // Typically the write characteristic supports 'writeWithoutResponse' or 'write'
    const writeCharacteristic = characteristics.find((c: any) => 
      c.properties.writeWithoutResponse || c.properties.write
    );

    if (!writeCharacteristic) throw new Error('No write characteristic found');

    // Split data into chunks of 100 bytes to not overflow BLE MTU limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (writeCharacteristic.properties.writeWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await writeCharacteristic.writeValue(chunk);
      }
    }

    device.gatt.disconnect();
    return true;
  } catch (error) {
    console.error('Bluetooth Print Error:', error);
    throw error;
  }
}
