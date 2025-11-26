import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartDataPoint } from '../types';

interface ResourceChartProps {
  data: ChartDataPoint[];
}

// 固定每个数据点的宽度（像素），确保字体不被压缩
const ITEM_WIDTH = 80;

export const ResourceChart: React.FC<ResourceChartProps> = ({ data }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // 滚动方向：1 为向右，-1 为向左
  const directionRef = useRef<number>(1);
  const animationRef = useRef<number>();

  // 直接使用原始数据，不进行复制，解决“佛山出现多次”的问题
  const displayData = data;

  // 计算图表真实总宽度，保证至少能填满容器
  const totalWidth = Math.max(displayData.length * ITEM_WIDTH, 600); 

  // 自动滚动逻辑：往复运动 (Ping-Pong)
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || displayData.length === 0) return;

    const animateScroll = () => {
      if (!isPaused) {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        
        // 如果内容没有溢出，不需要滚动
        if (maxScroll <= 0) return;

        // 移动滚动条
        scrollContainer.scrollLeft += 0.5 * directionRef.current;

        // 碰到右边缘，反向向左
        if (scrollContainer.scrollLeft >= maxScroll) {
           directionRef.current = -1;
        } 
        // 碰到左边缘，反向向右
        else if (scrollContainer.scrollLeft <= 0) {
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

  // 处理鼠标滚轮事件：将垂直滚动转换为水平滚动
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      // e.deltaY 通常是垂直滚动量，将其加到 scrollLeft 实现横向滚动
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="w-full h-full bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-lg p-1 shadow-lg flex flex-col relative group ring-1 ring-cyan-500/20">
      
      {/* Tech Corners (HUD 边框装饰) */}
      <div className="tech-corner tech-corner-tl" />
      <div className="tech-corner tech-corner-tr" />
      <div className="tech-corner tech-corner-bl" />
      <div className="tech-corner tech-corner-br" />

      {/* 标题栏 */}
      <h3 className="text-cyan-400 font-bold ml-3 mt-2 text-sm tracking-wide flex items-center gap-2 shrink-0">
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></span>
        已登记资源统计趋势 
      </h3>
      
      {/* 
         滚动容器 
         overflow-x-auto: 允许原生横向滚动条
         onWheel: 监听滚轮事件
      */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onWheel={handleWheel}
      >
        {/* 图表容器，设置了具体的像素宽度 */}
        <div style={{ width: `${totalWidth}px`, height: '100%', minHeight: '200px' }}>
          <BarChart
            width={totalWidth}
            height={220} 
            data={displayData}
            margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
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
              <linearGradient id="barLoad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1}/>
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.3}/>
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
              interval={0} // 强制显示所有标签
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
            
            {/* 这里的 Legend 已移除，改为下方固定 HTML */}
            
            <Bar dataKey="storage" name="储能" stackId="a" fill="url(#barStorage)" barSize={20} />
            <Bar dataKey="ev" name="充电" stackId="a" fill="url(#barEv)" barSize={20} />
            <Bar dataKey="pv" name="光伏" stackId="a" fill="url(#barPv)" barSize={20} />
            <Bar dataKey="other" name="其他" stackId="a" fill="url(#barOther)" barSize={20} />
            <Bar dataKey="load" name="空调" stackId="a" fill="url(#barLoad)" barSize={20} radius={[4, 4, 0, 0]} />
          </BarChart>
        </div>
      </div>

      {/* 固定在底部的自定义图例 (Static Legend) */}
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
        <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <span className="w-3 h-3 rounded-sm bg-[#f43f5e] shadow-[0_0_5px_#f43f5e]"></span>
          <span className="text-rose-300">空调(kW)</span>
        </div>
      </div>

    </div>
  );
};