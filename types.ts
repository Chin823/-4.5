export interface User {
  username: string;
  passwordHash: string;
  role: 'admin' | 'worker';
  status: 'active' | 'pending';
  contact?: string;
  team?: string;
  fullname?: string;
}

export interface Equipment {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  production_date: string; // YYYY-MM-DD
  motor_model?: string;
  power_rating?: string;
  ma_ex_code?: string;
  commission_date: string;
  team?: string;
  manufacturer?: string;
  status: '在用' | '备用' | '维修中' | '报废';
  next_inspection_date?: string;
  notes?: string;
  reducer_model?: string;
  is_special: boolean;
  special_license?: string;
  inspection_cycle?: number;
  inspector?: string;
  last_inspection_date?: string;
  
  // New fields for Electrical Equipment
  location?: string;
  usage?: string;
  category?: 'mechanical' | 'electrical';
}

export interface Log {
  id: number;
  eq_id: number;
  log_type: string;
  log_date: string;
  operator: string;
  details: string;
}

export type MenuOption = 
  | "系统概览"
  | "设备入库/登记"
  | "修改/删除设备"
  | "设备台账查询"
  | "维修与保养记录"
  | "全部维修日志"
  | "定期检验到期提醒台账"
  | "全生命周期追踪"
  | "特种设备管理"
  | "数据备份"
  | "用户管理";
