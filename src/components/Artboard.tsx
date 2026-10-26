import React, { useRef, useState, useLayoutEffect } from 'react';

interface ArtboardProps {
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
  fit?: { width: number; height: number };
  children: React.ReactNode;
}

export const Artboard: React.FC<ArtboardProps> = ({
  width,
  height,
  className,
  style,
  fit,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const fitW = fit?.width ?? width;
      const fitH = fit?.height ?? height;
      setScale(Math.min(el.clientWidth / fitW, el.clientHeight / fitH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, fit?.width, fit?.height]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden select-none">
      <div
        className={className}
        style={{
          ...style,
          position: 'absolute',
          left: '50%',
          top: '50%',
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
