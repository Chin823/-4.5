import React from 'react';
import { useData } from '../data';
import { calculateDaysUntil } from '../utils';
import { AlertTriangle, CheckCircle, TrendingUp, AlertOctagon, Box, FileText, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { MenuOption } from '../types';

interface DashboardProps {
  onNavigate: (menu: MenuOption) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { equipment, logs } = useData();

  const statusCounts = {
    total: equipment.length,
    active: equipment.filter(e => e.status === '在用').length,
    maintenance: equipment.filter(e => e.status === '维修中').length,
    scrapped: equipment.filter(e => e.status === '报废').length,
    special: equipment.filter(e => e.is_special).length,
  };

  const activePercent = statusCounts.total ? ((statusCounts.active / statusCounts.total) * 100).toFixed(1) : 0;

  // Alerts logic
  const alerts = equipment
    .filter(e => e.next_inspection_date && e.status !== '报废')
    .map(e => {
      const days = calculateDaysUntil(e.next_inspection_date!);
      return { ...e, daysUntil: days };
    })
    .filter(e => e.daysUntil <= 90);

  const recentEquipment = [...equipment].sort((a, b) => b.id - a.id).slice(0, 5);
  const recentLogs = [...logs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()).slice(0, 5);

  const chartData = [
    { name: '正常运行', value: statusCounts.active, color: '#3b82f6' }, // blue-500
    { name: '维修中', value: statusCounts.maintenance, color: '#ef4444' }, // red-500
    { name: '备用', value: equipment.filter(e => e.status === '备用').length, color: '#eab308' }, // yellow-500
    { name: '报废', value: statusCounts.scrapped, color: '#9ca3af' }, // gray-400
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">系统概览</h2>
          <p className="text-sm text-gray-500 mt-1">实时监控全矿设备运行状态与维护动态</p>
        </div>
        <div className="text-sm text-gray-400 font-medium">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="总设备数量" 
          value={statusCounts.total} 
          unit="台"
          icon={<Box className="text-blue-600" />} 
          trend="资产总览"
          bgClass="bg-blue-50"
          onClick={() => onNavigate('设备台账查询')}
        />
        <MetricCard 
          label="正常运行中" 
          value={statusCounts.active} 
          unit="台"
          icon={<Activity className="text-green-600" />} 
          trend={`${activePercent}% 运行率`}
          trendColor="text-green-600"
          bgClass="bg-green-50"
          onClick={() => onNavigate('设备台账查询')}
        />
        <MetricCard 
          label="维修中" 
          value={statusCounts.maintenance} 
          unit="台"
          icon={<AlertOctagon className="text-red-600" />} 
          trend="需立即关注"
          trendColor="text-red-600"
          bgClass="bg-red-50"
          onClick={() => onNavigate('设备台账查询')}
        />
        <MetricCard 
          label="特种设备" 
          value={statusCounts.special} 
          unit="台"
          icon={<AlertTriangle className="text-orange-600" />} 
          trend="重点监管对象"
          trendColor="text-orange-600"
          bgClass="bg-orange-50"
          onClick={() => onNavigate('特种设备管理')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {alerts.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
               <div 
                 className="px-6 py-4 border-b border-red-50 bg-red-50/50 flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors"
                 onClick={() => onNavigate('定期检验到期提醒台账')}
               >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">预警中心 ({alerts.length})</h3>
                  </div>
                  <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded flex items-center">
                    检验即将到期 <span className="ml-1">→</span>
                  </span>
               </div>
               <div className="p-4 max-h-60 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {alerts.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 group">
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-3 ${a.daysUntil <= 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`}></span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{a.name} <span className="text-gray-400 font-normal text-xs ml-1">{a.serial_number}</span></p>
                          <p className="text-xs text-gray-500">{a.team || '未分配队组'} {a.is_special && <span className="ml-1 text-red-500 bg-red-50 px-1 rounded">[特种]</span>}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${a.daysUntil <= 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {a.daysUntil <= 0 ? `已过期 ${Math.abs(a.daysUntil)} 天` : `剩余 ${a.daysUntil} 天`}
                      </div>
                    </div>
                  ))}
                </div>
               </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">运行平稳</h3>
                <p className="text-gray-500 text-sm">当前所有设备检验均在有效期内，无紧急预警。</p>
              </div>
            </div>
          )}

           {/* Chart */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
              <h4 className="text-lg font-bold text-gray-800 mb-6">设备状态分布图</h4>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#6b7280'}} width={70} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                  />
                  <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Right Column: Lists */}
        <div className="space-y-6">
           {/* Recent Equipment */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                 <h4 className="font-bold text-gray-800 flex items-center">
                  <Box className="w-4 h-4 mr-2 text-blue-500" /> 最近入库
                 </h4>
              </div>
              <div className="divide-y divide-gray-50">
                 {recentEquipment.map(e => (
                   <div key={e.id} className="p-4 hover:bg-gray-50 transition-colors">
                     <div className="flex justify-between items-start mb-1">
                       <span className="font-bold text-gray-800 text-sm">{e.name}</span>
                       <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{e.status}</span>
                     </div>
                     <p className="text-xs text-gray-500 mb-1">{e.model}</p>
                     <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{e.team}</span>
                        <span>{e.commission_date}</span>
                     </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
      
      {/* Logs Full Width */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-50">
             <h4 className="font-bold text-gray-800 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-500" /> 最新维修日志
             </h4>
         </div>
         <div className="overflow-x-auto">
           <table className="min-w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500">
               <tr>
                 <th className="py-3 px-6 font-medium">设备</th>
                 <th className="py-3 px-6 font-medium">类型</th>
                 <th className="py-3 px-6 font-medium">详情</th>
                 <th className="py-3 px-6 font-medium text-right">日期</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {recentLogs.map(l => {
                 const eqName = equipment.find(e => e.id === l.eq_id)?.name || 'Unknown';
                 return (
                 <tr key={l.id} className="hover:bg-gray-50/80 transition-colors">
                   <td className="py-3 px-6 font-medium text-gray-900">{eqName}</td>
                   <td className="py-3 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${l.log_type.includes('故障') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                        {l.log_type}
                      </span>
                   </td>
                   <td className="py-3 px-6 text-gray-500 max-w-xs truncate">{l.details}</td>
                   <td className="py-3 px-6 text-right text-gray-400 tabular-nums">{l.log_date}</td>
                 </tr>
               )})}
             </tbody>
           </table>
         </div>
      </div>

    </div>
  );
};

const MetricCard: React.FC<{ 
  label: string; 
  value: number; 
  unit: string;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
  bgClass: string;
  onClick?: () => void;
}> = ({ label, value, unit, icon, trend, trendColor = 'text-gray-500', bgClass, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500 ${bgClass}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <div className="flex items-baseline mt-1">
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          <span className="ml-1 text-xs text-gray-400">{unit}</span>
        </div>
      </div>
      <div className={`p-3 rounded-lg ${bgClass} bg-opacity-50`}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className="flex items-center text-xs font-medium relative z-10">
        <span className={`${trendColor} bg-opacity-10 px-1.5 py-0.5 rounded flex items-center`}>
           {trendColor.includes('green') ? <TrendingUp size={12} className="mr-1"/> : null}
           {trend}
        </span>
      </div>
    )}
  </div>
);
