import React, { useState, useEffect } from 'react';
import { useData } from '../data';
import { useToast } from '../toast';
import { Activity, Plus, Save, Wrench, Zap, Clock, User } from 'lucide-react';
import { formatDate } from '../utils';

interface LifecycleProps {
  initialId?: number | null;
}

export const Lifecycle: React.FC<LifecycleProps> = ({ initialId }) => {
  const { equipment, logs } = useData();
  const [selectedId, setSelectedId] = useState<number | ''>('');
  
  useEffect(() => {
    if (initialId) {
      setSelectedId(initialId);
    }
  }, [initialId]);

  const eq = equipment.find(e => e.id === Number(selectedId));
  const history = logs.filter(l => l.eq_id === Number(selectedId)).sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

  const getStatusColor = (s: string) => {
    switch(s) {
      case '维修中': return 'text-red-600';
      case '备用': return 'text-yellow-600';
      case '报废': return 'text-gray-500';
      default: return 'text-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
         <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-600 pb-2 flex items-center">
            <Activity className="w-8 h-8 mr-2 text-blue-600" /> 单台设备全生命周期档案
         </h2>
      </div>

      <div className="bg-white p-4 rounded shadow-sm border max-w-md print:hidden">
        <label className="block text-sm font-medium mb-2">选择设备进行追踪</label>
        <select 
          className="w-full border rounded p-2" 
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          <option value="">-- 请选择 --</option>
          {equipment.map(e => <option key={e.id} value={e.id}>{e.name} - {e.serial_number}</option>)}
        </select>
      </div>

      {eq && (
        <div className="space-y-6 print:space-y-4 print:block">
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600 print:shadow-none print:border print:break-inside-avoid">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-3xl font-bold text-gray-800">{eq.name}</h3>
                  <p className="text-gray-500 mt-1">{eq.model || '未指定型号'} | {eq.serial_number}</p>
               </div>
               <div className="text-right">
                  <div className={`text-4xl font-black ${getStatusColor(eq.status)}`}>{eq.status}</div>
                  {eq.is_special && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded mt-2 inline-block print:border print:border-red-500 print:text-red-500">特种设备</span>}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm border-t pt-4 print:grid-cols-2">
              <div className="space-y-2">
                <p><span className="font-bold">责任队组:</span> {eq.team}</p>
                <p><span className="font-bold">生产厂家/用途:</span> {eq.category === 'electrical' ? eq.usage : eq.manufacturer}</p>
                <p><span className="font-bold">生产/入井日期:</span> {eq.category === 'electrical' ? eq.commission_date : eq.production_date}</p>
                <p><span className="font-bold">地点:</span> {eq.location || '未记录'}</p>
              </div>
              <div className="space-y-2">
                 <p><span className="font-bold">类别:</span> {eq.category === 'electrical' ? '电气设备' : '机电设备'}</p>
                 {eq.category !== 'electrical' && <p><span className="font-bold">煤安证号:</span> {eq.ma_ex_code}</p>}
                 <p><span className="font-bold text-red-600">下次检验:</span> {eq.next_inspection_date || '无需检验'}</p>
              </div>
            </div>
            {eq.notes && <div className="mt-4 bg-gray-50 p-3 rounded text-sm text-gray-600 print:bg-white print:border">📝 {eq.notes}</div>}
          </div>

          <div>
            <h4 className="text-xl font-bold text-gray-800 mb-4 print:mt-4">历史作业记录 🧾</h4>
            {history.length > 0 ? (
               <div className="relative border-l-2 border-blue-200 ml-4 space-y-8 pb-4 print:space-y-4">
                  {history.map(h => (
                    <div key={h.id} className="relative pl-8 print:pl-4 print:break-inside-avoid">
                       <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white print:border-gray-400 print:bg-gray-200"></span>
                       <div className="bg-white p-4 rounded shadow-sm border print:p-2 print:border-gray-300">
                          <div className="flex justify-between mb-1">
                             <span className="font-bold text-blue-900 print:text-black">{h.log_type}</span>
                             <span className="text-sm text-gray-500">{h.log_date}</span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{h.details}</p>
                          <p className="text-xs text-gray-400">操作人: {h.operator}</p>
                       </div>
                    </div>
                  ))}
               </div>
            ) : (
              <div className="text-gray-500 bg-white p-6 rounded shadow-sm">暂无历史记录</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Mobile Optimized Public Component ---

export const PublicLifecycle: React.FC<{ id: number }> = ({ id }) => {
  const { equipment, logs, addLog } = useData();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'log'>('info');
  const today = formatDate(new Date());

  const eq = equipment.find(e => e.id === id);
  const history = logs.filter(l => l.eq_id === id).sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

  if (!eq) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
         <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
            <h2 className="text-xl font-bold text-gray-800">未找到设备</h2>
            <p className="text-gray-500 mt-2">该二维码可能已失效或设备已被删除。</p>
            <p className="text-xs text-gray-400 mt-4">提示：如果您在手机上访问，请确保已连接到与电脑相同的数据库服务器。</p>
         </div>
      </div>
    );
  }

  const handlePublicLogSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addLog({
      eq_id: eq.id,
      log_type: formData.get('log_type') as string,
      log_date: formData.get('log_date') as string,
      operator: formData.get('operator') as string || '扫码用户',
      details: formData.get('details') as string,
    });
    addToast('日志提交成功！', 'success');
    e.currentTarget.reset();
    setActiveTab('info'); // Switch back to view after submit
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
       {/* Mobile Header */}
       <div className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative z-10">
             <div className="flex items-center text-blue-100 text-xs mb-2 uppercase tracking-wide font-semibold">
                <Activity size={12} className="mr-1"/> 鑫飞下山峁煤业 · 智能资产
             </div>
             <h1 className="text-2xl font-bold leading-tight">{eq.name}</h1>
             <p className="opacity-90 text-sm mt-1">{eq.serial_number}</p>
             
             <div className="flex gap-2 mt-4">
               <span className={`px-2 py-1 rounded text-xs font-bold bg-white/20 backdrop-blur-sm flex items-center`}>
                  {eq.category === 'electrical' ? <Zap size={12} className="mr-1"/> : <Wrench size={12} className="mr-1"/>}
                  {eq.category === 'electrical' ? '电气设备' : '机电设备'}
               </span>
               <span className={`px-2 py-1 rounded text-xs font-bold 
                  ${eq.status === '在用' ? 'bg-green-400/30 text-green-50' : 
                    eq.status === '维修中' ? 'bg-red-400/30 text-red-50' : 'bg-yellow-400/30 text-yellow-50'}`}>
                  {eq.status}
               </span>
             </div>
          </div>
       </div>

       {/* Tabs */}
       <div className="flex px-4 mt-4 mb-2">
         <button 
           onClick={() => setActiveTab('info')}
           className={`flex-1 py-3 text-sm font-bold rounded-lg mr-2 transition-all ${activeTab === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
         >
           设备详情 & 历史
         </button>
         <button 
           onClick={() => setActiveTab('log')}
           className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'log' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:bg-white/50'}`}
         >
           <Plus size={16} className="inline mr-1 -mt-0.5"/> 登记维修/保养
         </button>
       </div>

       <div className="p-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
         
         {/* INFO TAB */}
         {activeTab === 'info' && (
           <div className="space-y-4">
              {/* Basic Specs */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="text-gray-800 font-bold mb-3 flex items-center">
                    <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div> 技术参数
                 </h3>
                 <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs block">规格型号</span>
                      <span className="text-gray-700 font-medium">{eq.model || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">责任队组</span>
                      <span className="text-gray-700 font-medium">{eq.team || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 text-xs block">使用地点</span>
                      <span className="text-gray-700 font-medium">{eq.location || '-'}</span>
                    </div>
                    {eq.category === 'electrical' ? (
                       <div className="col-span-2">
                         <span className="text-gray-400 text-xs block">用途</span>
                         <span className="text-gray-700 font-medium">{eq.usage || '-'}</span>
                       </div>
                    ) : (
                       <div className="col-span-2">
                         <span className="text-gray-400 text-xs block">生产厂家</span>
                         <span className="text-gray-700 font-medium">{eq.manufacturer || '-'}</span>
                       </div>
                    )}
                    <div className="col-span-2 pt-2 border-t mt-1">
                      <span className="text-gray-400 text-xs block">下次检验日期</span>
                      <span className="text-red-500 font-bold">{eq.next_inspection_date || '无需检验'}</span>
                    </div>
                 </div>
              </div>

              {/* History Timeline */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="text-gray-800 font-bold mb-4 flex items-center">
                    <div className="w-1 h-4 bg-blue-500 rounded mr-2"></div> 近期记录
                 </h3>
                 <div className="space-y-6 relative border-l-2 border-gray-100 ml-2">
                    {history.slice(0, 10).map(h => (
                       <div key={h.id} className="pl-6 relative">
                          <div className={`absolute -left-[5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${h.log_type.includes('故障') ? 'bg-red-500' : 'bg-blue-400'}`}></div>
                          <div className="flex justify-between items-start mb-1">
                             <span className="text-sm font-bold text-gray-800">{h.log_type}</span>
                             <span className="text-xs text-gray-400">{h.log_date}</span>
                          </div>
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{h.details}</p>
                          <div className="mt-1 flex items-center text-xs text-gray-400">
                             <User size={10} className="mr-1"/> {h.operator}
                          </div>
                       </div>
                    ))}
                    {history.length === 0 && <div className="pl-6 text-sm text-gray-400 italic">暂无记录</div>}
                 </div>
              </div>
           </div>
         )}

         {/* LOG FORM TAB */}
         {activeTab === 'log' && (
           <form onSubmit={handlePublicLogSubmit} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 space-y-4">
              <div className="text-center mb-2">
                 <h3 className="text-lg font-bold text-gray-800">提交新日志</h3>
                 <p className="text-xs text-gray-400">无需登录，直接录入</p>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">日志类型</label>
                 <select name="log_type" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700">
                    <option value="日常维护">日常维护</option>
                    <option value="故障维修 → 自动变维修中">故障维修</option>
                    <option value="维修完成 → 自动恢复在用">维修完成</option>
                    <option value="定期检修">定期检修</option>
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">日期</label>
                 <div className="relative">
                    <Clock className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                    <input name="log_date" type="date" defaultValue={today} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"/>
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">您的姓名/操作人</label>
                 <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                    <input name="operator" placeholder="请输入姓名" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"/>
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">详细描述</label>
                 <textarea name="details" rows={4} placeholder="描述维修内容或设备状况..." required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center">
                 <Save size={18} className="mr-2"/> 提交记录
              </button>
           </form>
         )}
       </div>

       <div className="text-center mt-8 text-xs text-gray-400 pb-4">
          © 山西柳林鑫飞下山峁煤业机电科
       </div>
    </div>
  );
};
