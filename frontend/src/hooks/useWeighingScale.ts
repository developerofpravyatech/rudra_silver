import { useState, useCallback } from 'react';

export function useWeighingScale() {
  const [liveWeight, setLiveWeight] = useState<number>(0.0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectScale = useCallback(async () => {
    try {
      if (!('serial' in navigator)) {
        setError('Web Serial API is not supported in this browser. Please use Google Chrome or Edge.');
        return;
      }

      setError(null);
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
      setIsConnected(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const match = line.match(/[-+]?\s*([0-9]+\.[0-9]+)/);
            if (match) {
              const parsed = parseFloat(match[1]);
              if (!isNaN(parsed)) {
                setLiveWeight(parsed);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setError(err.message || 'Error connecting to weighing scale');
      }
      setIsConnected(false);
    }
  }, []);

  return { liveWeight, isConnected, connectScale, error };
}
