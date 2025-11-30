
import React, { useEffect, useRef, useState } from 'react';

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  width?: string;
  className?: string;
}

interface AutoScrollTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: string;
  rowHeight?: number;
  speed?: number; // pixels per frame
  minWidth?: string; // Optional minimum width to force horizontal scrolling
}

export const AutoScrollTable = <T,>({
  data,
  columns,
  height = 'h-64',
  rowHeight = 40,
  speed = 0.5,
  minWidth,
}: AutoScrollTableProps<T>) => {
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const animate = () => {
      // Only scroll if NOT hovered and we have a container
      if (!isHovered && scrollContainer) {
        // Read current scroll position
        let currentScroll = scrollContainer.scrollTop;
        let newScroll = currentScroll + speed;
        
        // Calculate the halfway point (height of one set of data)
        const halfHeight = scrollContainer.scrollHeight / 2;

        // Reset if we've scrolled past the first set
        // Use a small buffer to ensure smooth looping
        if (newScroll >= halfHeight) {
          // Wrap around seamlessly
          newScroll = newScroll - halfHeight;
        }

        scrollContainer.scrollTop = newScroll;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isHovered, speed, data.length]);

  // Duplicate data for seamless looping
  const displayData = [...data, ...data];

  return (
    <div 
      className={`flex flex-col border border-slate-700/50 rounded-lg bg-slate-800/40 backdrop-blur-md shadow-lg overflow-hidden ${height} ring-1 ring-cyan-500/20`}
      // Move hover detection to the ROOT container
      // This ensures that as soon as the user interacts with ANY part of the table (including scrollbar), 
      // the auto-scroll stops and doesn't fight the mouse wheel.
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 
        Horizontal Scroll Wrapper.
        If minWidth is provided, this container allows horizontal scrolling 
        while the inner container enforces the width.
      */}
      <div className="overflow-x-auto h-full w-full custom-scrollbar">
        <div 
          className="flex flex-col h-full" 
          style={{ minWidth: minWidth || '100%' }}
        >
          {/* Header */}
          <div className="flex bg-slate-900/60 border-b border-slate-700 font-bold text-xs text-cyan-400 sticky top-0 z-10 shrink-0 uppercase tracking-wider">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className={`p-3 truncate ${col.width || 'flex-1'} ${col.className || ''}`}
              >
                {col.header}
              </div>
            ))}
          </div>

          {/* Scrolling Body (Vertical only) */}
          <div
            ref={scrollRef}
            className="overflow-y-auto relative custom-scrollbar flex-1"
          >
            <div className="w-full">
              {displayData.map((item, index) => (
                <div
                  key={index}
                  className={`flex border-b border-slate-700/30 text-xs text-slate-300 hover:bg-cyan-900/20 transition-colors`}
                  style={{ height: `${rowHeight}px` }}
                >
                  {columns.map((col, colIdx) => (
                    <div
                      key={colIdx}
                      className={`px-3 truncate flex items-center ${col.width || 'flex-1'} ${col.className || ''}`}
                    >
                      {col.accessor(item)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
