
export interface RegionStat {
  city: string;
  site_count: number;
  pv_mw: number;
  storage_mw: number;
  ev_mw: number;
  other_mw: number;
  total_mw: number;
}

export interface Customer {
  id: string;
  company_name: string;
  province: string;
  city: string;
  capacity_mw: number;
  demand_type: string;
  industry: string;
  contact: string;
  phone: string;
}

export interface ChartDataPoint {
  name: string;
  pv: number;
  storage: number;
  ev: number;
  other: number;
}

export interface FormData {
  companyName: string;
  province: string;
  city: string;
  address: string;
  capacity: string;
  demandType: string;
  demandTypeOther?: string;
  availableTime: string;
  industryType: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

export const DEMAND_TYPES = ['光伏', '储能', '充电桩', '其他'];