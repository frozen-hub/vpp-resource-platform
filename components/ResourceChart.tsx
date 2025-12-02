
import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint } from '../types';

interface ResourceChartProps {
  data: ChartDataPoint[];
}

// Fixed width per item to ensure labels are readable
const ITEM_WIDTH = 80;

export const ResourceChart: React.FC<ResourceChartProps> = ({ data }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // 1 = Right, -1 = Left
  const directionRef = useRef<number>(1);
  const animationRef = useRef<number>();

  const displayData = data;
  const totalWidth = Math.max(displayData.length * ITEM_WIDTH, 600); 

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || displayData.length === 0) return;

    const animateScroll = () => {
      if (!isPaused) {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (maxScroll <= 0) return;

        scrollContainer.scrollLeft += 0.5 * directionRef.current;

        if (scrollContainer.scrollLeft >= maxScroll) {
           directionRef.current = -1;
        } else if (scrollContainer.scrollLeft <= 0) {
           directionRef.current = 1;
        }
      }
      animationRef.current = requestAnimationFrame(animateScroll);
    };

    animationRef.current = requestAnimationFrame(animateScroll);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, displayData.length]);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="w-full h-full bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-lg p-1 shadow-lg flex flex-col relative group ring-1 ring-cyan-500/20">
      
      {/* Tech Corners */}
      <div className="tech-corner tech-corner-tl" />
      <div className="tech-corner tech-corner-tr" />
      <div className="tech-corner tech-corner-bl" />
      <div className="tech-corner tech-corner-br" />

      {/* Header */}
      {/* REDUCED MOBILE FONT SIZE: text-xs instead of text-sm */}
      <h3 className="text-cyan-100 font-bold ml-3 mt-2 text-xs lg:text-lg tracking-wide flex items-center gap-2 shrink-0">
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></span>
        已登记资源统计趋势
      </h3>
      
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative mt-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onWheel={handleWheel}
      >
        {/* 
          Inner Container:
          Width is calculated based on data length.
          Height is 100% to fill the parent (flex-1).
        */}
        <div style={{ width: `${totalWidth}px`, height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barGap={2}
            >
              <defs>
                <linearGradient id="barPv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="barStorage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="barEv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#eab308" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="barOther" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 500 }} 
                axisLine={{ stroke: '#475569' }}
                tickLine={false}
                interval={0}
              />
              
              <YAxis 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                axisLine={false}
                tickLine={false}
              />
              
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #334155', 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  color: '#f1f5f9',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ fontSize: '12px' }}
              />
              
              <Bar dataKey="storage" name="储能" stackId="a" fill="url(#barStorage)" barSize={20} />
              <Bar dataKey="ev" name="充电" stackId="a" fill="url(#barEv)" barSize={20} />
              <Bar dataKey="pv" name="光伏" stackId="a" fill="url(#barPv)" barSize={20} />
              <Bar dataKey="other" name="其他" stackId="a" fill="url(#barOther)" barSize={20} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center flex-wrap gap-3 py-2 text-xs border-t border-slate-700/50 bg-slate-900/20 shrink-0 select-none">
        <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <span className="w-3 h-3 rounded-sm bg-[#22c55e] shadow-[0_0_5px_#22c55e]"></span>
          <span className="text-green-300">储能(MWh)</span>
        </div>
        <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <span className="w-3 h-3 rounded-sm bg-[#eab308] shadow-[0_0_5px_#eab308]"></span>
          <span className="text-yellow-300">充电桩(kW)</span>
        </div>
        <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <span className="w-3 h-3 rounded-sm bg-[#6366f1] shadow-[0_0_5px_#6366f1]"></span>
          <span className="text-indigo-300">光伏(kW)</span>
        </div>
        <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <span className="w-3 h-3 rounded-sm bg-[#06b6d4] shadow-[0_0_5px_#06b6d4]"></span>
          <span className="text-cyan-300">其他(MW)</span>
        </div>
      </div>

    </div>
  );
};
