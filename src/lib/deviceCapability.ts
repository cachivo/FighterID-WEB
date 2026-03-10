import { useState, useEffect } from 'react';

export interface DeviceProfile {
  score: number;
  memory: number;
  cpuCores: number;
  connection: string;
  rtt: number;
  isLowEnd: boolean;
}

export function getClientCapabilityScore(): DeviceProfile {
  const memory = (navigator as any).deviceMemory || 4;
  const cpu = Math.min(navigator.hardwareConcurrency || 2, 8);

  let networkScore = 4;
  let rtt = 100;
  let connectionType = '4g';

  const conn = (navigator as any).connection;
  if (conn) {
    const map: Record<string, number> = {
      'slow-2g': 1, '2g': 2, '3g': 3, '4g': 4, '5g': 5,
    };
    networkScore = map[conn.effectiveType] || 4;
    rtt = conn.rtt || 100;
    connectionType = conn.effectiveType || '4g';

    if (rtt > 500) networkScore = Math.max(networkScore - 3, 1);
    else if (rtt > 300) networkScore = Math.max(networkScore - 2, 1);
  }

  const score = Math.min(100, Math.round((memory + cpu * 0.5 + networkScore * 2) * 5));

  return {
    score,
    memory,
    cpuCores: cpu,
    connection: connectionType,
    rtt,
    isLowEnd: score < 40 || memory <= 2 || networkScore <= 2,
  };
}

export function useDeviceCapability(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(getClientCapabilityScore);

  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn) return;

    const update = () => setProfile(getClientCapabilityScore());
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  return profile;
}
