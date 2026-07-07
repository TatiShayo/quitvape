/**
 * Rolling number counter — animates from 0 to a target value on mount (PLAYBOOK 1.4:
 * "counters roll/odometer... on first view only"). This isn't the 60fps-critical
 * signature interaction (that's the panic-button breathing sequence), so a plain
 * JS-driven rAF loop keeps this simple and easy to test rather than reaching for a
 * UI-thread text mutation.
 */
import { useEffect, useRef, useState } from 'react';
import { AppText } from './AppText';
import { ColorToken, TypographyToken } from '@/theme';

interface OdometerProps {
  target: number;
  formatter: (n: number) => string;
  variant?: TypographyToken;
  color?: ColorToken;
  durationMs?: number;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function Odometer({
  target,
  formatter,
  variant = 'displayL',
  color = 'money',
  durationMs = 1200,
}: OdometerProps) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    function tick() {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / durationMs);
      setValue(target * easeOutCubic(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    tick();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when target changes
  }, [target]);

  return (
    <AppText variant={variant} color={color} tabular>
      {formatter(value)}
    </AppText>
  );
}
