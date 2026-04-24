import dgram from 'dgram';

export function wakeOnLan(macAddress) {
    return new Promise((resolve, reject) => {
        const macBytes = macAddress.split(':').map(hex => parseInt(hex, 16));
        
        if (macBytes.length !== 6 || macBytes.some(isNaN)) {
            return reject(new Error('Endereço MAC inválido'));
        }

        const magicPacket = Buffer.alloc(102);
        // 6 bytes de 0xFF
        for (let i = 0; i < 6; i++) {
            magicPacket[i] = 0xFF;
        }
        
        // 16 cópias do endereço MAC
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 6; j++) {
                magicPacket[6 + i * 6 + j] = macBytes[j];
            }
        }

        const client = dgram.createSocket('udp4');
        client.on('error', (err) => {
            client.close();
            reject(err);
        });

        client.bind(() => {
            client.setBroadcast(true);
            client.send(magicPacket, 0, magicPacket.length, 9, '255.255.255.255', (err) => {
                client.close();
                if (err) reject(err);
                else resolve();
            });
        });
    });
}
