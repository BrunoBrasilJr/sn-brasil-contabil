import { Orbit } from 'lucide-react';

export function SinaIcon({ size = 25 }: { size?: number }) {
  return <Orbit size={size} strokeWidth={1.65} className="sina-symbol" aria-hidden="true" focusable="false" />;
}
