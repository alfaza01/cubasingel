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

export async function printViaWebBluetooth(data: Uint8Array) {
  try {
    // Standard BLE Serial / Printer UUIDs
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
        { services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] },
        { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ],
      acceptAllDevices: false
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
    const writeCharacteristic = characteristics.find(c => 
      c.properties.writeWithoutResponse || c.properties.write
    );

    if (!writeCharacteristic) throw new Error('No write characteristic found');

    // Split data into chunks of 512 bytes to not overflow BLE MTU limits (sometimes 20, 512 is safe for some, let's use 100)
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
