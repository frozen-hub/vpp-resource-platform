import React, { useState, useEffect } from 'react';
import { AutoScrollTable } from './components/AutoScrollTable';
import { ResourceChart } from './components/ResourceChart';
import { RegistrationModal } from './components/RegistrationModal';
import { supabase } from './supabaseClient';
import { RegionStat, Customer, ChartDataPoint, FormData } from './types';
import { MOCK_CUSTOMERS } from './constants';
import { Plus } from 'lucide-react';

// Helper for masking name: 张三 -> 张**
const maskName = (name: string) => {
  if (!name) return '';
  return name.charAt(0) + '**';
};

// Helper for masking phone: 13800138000 -> 138****8000
const maskPhone = (phone: string) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Initialize with empty array, waiting for DB fetch
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Derived State (Calculated from customers)
  const [regionStats, setRegionStats] = useState<RegionStat[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // --- Data Aggregation Logic ---
  useEffect(() => {
    if (customers.length === 0) {
      setRegionStats([]);
      setChartData([]);
      return;
    }

    // 1. Group by City
    const cityMap = new Map<string, {
      site_count: number;
      pv_mw: number;
      storage_mw: number;
      ev_mw: number;
      other_mw: number;
      total_mw: number;
    }>();

    customers.forEach(cust => {
      const city = cust.city;
      const cap = Number(cust.capacity_mw) || 0;
      const type = cust.demand_type || '';

      if (!cityMap.has(city)) {
        cityMap.set(city, { site_count: 0, pv_mw: 0, storage_mw: 0, ev_mw: 0, other_mw: 0, total_mw: 0 });
      }

      const entry = cityMap.get(city)!;
      entry.site_count += 1;
      entry.total_mw += cap;

      if (type.includes('光伏')) {
        entry.pv_mw += cap;
      } else if (type.includes('储能')) {
        entry.storage_mw += cap;
      } else if (type.includes('充电')) {
        entry.ev_mw += cap;
      } else {
        entry.other_mw += cap;
      }
    });

    // 2. Convert to RegionStat Array
    const newRegionStats: RegionStat[] = Array.from(cityMap.entries()).map(([city, data]) => ({
      city,
      ...data
    })).sort((a, b) => b.total_mw - a.total_mw);

    // 3. Convert to ChartDataPoint Array
    const newChartData: ChartDataPoint[] = Array.from(cityMap.entries()).map(([city, data]) => ({
      name: city,
      pv: data.pv_mw,
      storage: data.storage_mw,
      ev: data.ev_mw,
      other: data.other_mw
    })).sort((a, b) => (b.pv + b.storage + b.ev + b.other) - (a.pv + a.storage + a.ev + a.other));

    setRegionStats(newRegionStats);
    setChartData(newChartData);

  }, [customers]);


  // --- Fetch Data from Supabase ---
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vpp_customers_netlify')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, falling back to mock data:', error.message);
        setCustomers(MOCK_CUSTOMERS);
      } else {
        if (data && data.length > 0) {
          const mappedCustomers: Customer[] = data.map(d => ({
            id: d.id,
            company_name: d.company_name,
            province: d.province,
            city: d.city,
            capacity_mw: Number(d.capacity_mw),
            demand_type: d.demand_type,
            industry: d.industry || '',
            contact: d.contact_name || '',
            phone: d.contact_phone || ''
          }));
          setCustomers(mappedCustomers);
        } else {
          console.log('Supabase returned empty, using mock data for demo.');
          setCustomers(MOCK_CUSTOMERS);
        }
      }
    } catch (err) {
      console.warn('Supabase connection error, falling back to mock data.');
      setCustomers(MOCK_CUSTOMERS);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRegistration = async (data: FormData) => {
    const capacity = parseFloat(data.capacity) || 0;
    const demandTypeString = data.demandType === '其他' && data.demandTypeOther 
      ? `其他-${data.demandTypeOther}` 
      : data.demandType;

    const dbPayload = {
      company_name: data.companyName,
      province: data.province,
      city: data.city,
      address: data.address,
      capacity_mw: capacity,
      demand_type: demandTypeString,
      industry: data.industryType,
      contact_name: data.contactName,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail
    };

    try {
        const { error } = await supabase
        .from('vpp_customers_netlify')
        .insert([dbPayload]);

        if (error) {
            console.warn('DB Insert failed, updating local state only:', error.message);
            updateLocalState(dbPayload);
            alert('注意：由于数据库连接未配置或失败，数据仅在当前会话保存。');
        } else {
            await fetchCustomers();
        }
    } catch (e) {
        console.warn('DB Connection failed, updating local state only');
        updateLocalState(dbPayload);
        alert('注意：由于数据库连接未配置或失败，数据仅在当前会话保存。');
    }
  };

  const updateLocalState = (payload: any) => {
      const newCustomer: Customer = {
          id: Math.random().toString(),
          company_name: payload.company_name,
          province: payload.province,
          city: payload.city,
          capacity_mw: payload.capacity_mw,
          demand_type: payload.demand_type,
          industry: payload.industry,
          contact: payload.contact_name,
          phone: payload.contact_phone
      };
      setCustomers(prev => [newCustomer, ...prev]);
  };

  return (
    // MAIN LAYOUT
    // Use dvh (Dynamic Viewport Height) to handle mobile browser address bars better than h-screen
    <div className="fixed inset-0 w-screen h-[100dvh] bg-[#0f172a] text-gray-200 flex flex-col overflow-hidden relative font-sans">
      
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 perspective-container pointer-events-none z-0 overflow-hidden">
        <div className="cyber-floor"></div>
        <div className="ambient-glow"></div>
      </div>
      <div className="absolute inset-0 pointer-events-none z-0 scanline"></div>

      {/* HEADER */}
      {/* Increased height from h-10 to h-14 for mobile visibility */}
      <header className="relative z-20 flex items-center justify-between px-3 lg:px-6 py-1 lg:py-4 border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-md shadow-[0_4px_20px_-5px_rgba(8,145,178,0.3)] shrink-0 h-14 lg:h-auto">
        <div className="flex flex-col justify-center">
           {/* Increased text size slightly on mobile */}
           <h1 className="text-xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-[0.1em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase truncate max-w-[220px] lg:max-w-none">
            虚拟电厂资源整合平台
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center gap-1.5 lg:gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-1.5 px-3 lg:px-4 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all hover:scale-105 border border-red-400/30 text-[11px] lg:text-base shrink-0"
        >
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
          <Plus size={14} className="text-white lg:w-[18px] lg:h-[18px]" />
          <span>登记资源</span>
        </button>
      </header>

      {/* DASHBOARD CONTENT */}
      {/* 
         LAYOUT STRATEGY:
         Mobile: Vertical Stack. 
                 Top Section (Stats + Chart) = 60% height (More balanced).
                 Bottom Section (Customers) = 40% height.
         Desktop: Horizontal Split. Left 65%, Right 35%.
      */}
      <main className="relative z-10 flex-1 w-full p-1 lg:p-6 overflow-hidden flex flex-col lg:flex-row gap-1 lg:gap-6 min-h-0">
        
        {/* LEFT COLUMN (Mobile: TOP SECTION) */}
        {/* Mobile: 60% height. Desktop: Full height, 65% width. */}
        <div className="w-full flex flex-col gap-1 lg:gap-6 shrink-0 h-[60%] lg:h-full lg:w-[65%] min-h-0">
          
          {/* STATS TABLE */}
          {/* Takes remaining space in Top Section after Chart */}
          <div className="flex-1 flex flex-col bg-slate-800/20 rounded-lg overflow-hidden min-h-0">
            <div className="flex items-center gap-2 mb-0.5 lg:mb-2 shrink-0 px-1 pt-1">
              <div className="w-1 h-1 lg:w-2 lg:h-2 bg-cyan-400 rotate-45 shadow-[0_0_5px_#22d3ee]"></div>
              <h2 className="text-sm lg:text-lg font-bold text-cyan-100 tracking-wide text-shadow">各地需求量统计</h2>
            </div>
            
            <div className="flex-1 overflow-hidden relative shadow-lg rounded-lg h-full">
              <AutoScrollTable
                data={regionStats}
                height="h-full"
                minWidth="100%"
                rowHeight={28}
                columns={[
                  { header: '城市', accessor: (d: RegionStat) => <span className="font-medium text-cyan-200">{d.city}</span>, className: 'flex-1 text-[9px] lg:text-xs' },
                  { header: '站点', accessor: (d: RegionStat) => <span className="text-white">{d.site_count}</span>, className: 'w-8 lg:w-16 text-[9px] lg:text-xs' },
                  { header: '光伏', accessor: (d: RegionStat) => <span className="text-indigo-300">{d.pv_mw.toFixed(1)}</span>, className: 'flex-1 text-[9px] lg:text-xs' },
                  { header: '储能', accessor: (d: RegionStat) => <span className="text-green-300">{d.storage_mw.toFixed(1)}</span>, className: 'flex-1 text-[9px] lg:text-xs' },
                  { header: '充电', accessor: (d: RegionStat) => <span className="text-yellow-300">{d.ev_mw.toFixed(1)}</span>, className: 'flex-1 text-[9px] lg:text-xs' },
                  { header: '合计', accessor: (d: RegionStat) => <span className="font-bold text-cyan-400">{d.total_mw.toFixed(1)}</span>, className: 'flex-1 text-[9px] lg:text-xs' },
                ]}
              />
            </div>
          </div>

          {/* CHART AREA */}
          {/* Increased height to 200px for better visibility */}
          <div className="h-[200px] lg:h-80 shrink-0 flex flex-col">
             <ResourceChart data={chartData} />
          </div>

        </div>

        {/* RIGHT COLUMN (Mobile: BOTTOM SECTION) */}
        {/* Mobile: Remaining space (approx 40%). Desktop: Full height, 35% width. */}
        <div className="w-full lg:w-[35%] flex flex-col h-full lg:h-full flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-0.5 lg:mb-2 shrink-0 px-1">
            <div className="w-1 h-1 lg:w-2 lg:h-2 bg-purple-400 rotate-45 shadow-[0_0_5px_#a855f7]"></div>
            <h2 className="text-sm lg:text-lg font-bold text-cyan-100 tracking-wide">客户列表</h2>
          </div>
          <div className="flex-1 overflow-hidden relative shadow-lg rounded-lg h-full min-h-0"> 
            <AutoScrollTable
              data={customers}
              height="h-full"
              rowHeight={32}
              minWidth="100%"
              columns={[
                { 
                  header: '企业名称', 
                  accessor: (d: Customer) => <span className="font-medium text-slate-200 truncate block hover:text-cyan-300 transition-colors" title={d.company_name}>{d.company_name}</span>, 
                  className: 'flex-[2] text-[9px] lg:text-xs truncate' 
                },
                { 
                  header: '城市', 
                  accessor: (d: Customer) => d.city, 
                  className: 'w-10 lg:w-14 text-slate-400 text-[9px] lg:text-xs truncate' 
                },
                { 
                  header: '容量', 
                  accessor: (d: Customer) => <span className="text-cyan-400 font-bold">{d.capacity_mw}</span>, 
                  className: 'w-8 lg:w-14 text-[9px] lg:text-xs truncate' 
                },
                { 
                  header: '类型', 
                  accessor: (d: Customer) => (
                    <span className={`px-0.5 lg:px-1.5 py-0.5 rounded-sm text-[8px] lg:text-[10px] border whitespace-nowrap ${
                      d.demand_type.includes('光伏') 
                        ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' 
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    }`}>
                      {d.demand_type}
                    </span>
                  ), 
                  className: 'w-10 lg:w-16 text-[9px] lg:text-xs truncate' 
                },
                { 
                  header: '行业', 
                  accessor: (d: Customer) => <span className="text-slate-400 truncate" title={d.industry}>{d.industry}</span>, 
                  className: 'flex-1 text-[9px] lg:text-xs truncate' 
                },
                { 
                  header: '联系人', 
                  accessor: (d: Customer) => maskName(d.contact), 
                  className: 'w-10 lg:w-16 text-slate-400 text-[9px] lg:text-xs truncate' 
                },
                { 
                  header: '电话', 
                  accessor: (d: Customer) => maskPhone(d.phone), 
                  className: 'w-16 lg:w-24 text-slate-400 font-mono text-[8px] lg:text-[10px] truncate' 
                },
              ]}
            />
          </div>
        </div>

      </main>

      {/* Registration Modal */}
      <RegistrationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleNewRegistration}
      />

    </div>
  );
}

export default App;