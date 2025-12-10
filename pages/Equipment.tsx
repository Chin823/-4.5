import React, { useState } from 'react';
import { useData } from '../data';
import { useToast } from '../toast';
import { Equipment } from '../types';
import { formatDate, calculateDaysUntil } from '../utils';
import { Search, Save, Trash2, PackagePlus, Edit3, Grid, ShieldAlert, AlertTriangle, Calendar, Zap, Wrench, MapPin, ExternalLink, Filter } from 'lucide-react';

export const EquipmentAdd: React.FC = () => {
  const { addEquipment, currentUser } = useData();
  const { addToast } = useToast();
  const isAdmin = currentUser?.role === 'admin';
  const today = formatDate(new Date());
  const [activeTab, setActiveTab] = useState<'mechanical' | 'electrical'>('mechanical');

  if (!isAdmin) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center text-blue-800">
        <span className="mr-2">🔒</span> 当前为普通工人身份，仅具备查看权限，无法录入新设备。
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Common fields
    const baseEq: any = {
      name: formData.get('name') as string,
      model: formData.get('model') as string,
      serial_number: formData.get('serial_number') as string,
      status: formData.get('status') as any || '在用', // Default to active if not present
      team: formData.get('team') as string,
      category: activeTab,
    };

    if (activeTab === 'mechanical') {
      // Mechanical specific fields
      Object.assign(baseEq, {
        production_date: formData.get('production_date') as string,
        motor_model: formData.get('motor_model') as string,
        power_rating: formData.get('power_rating') as string,
        ma_ex_code: formData.get('ma_ex_code') as string,
        commission_date: formData.get('commission_date') as string,
        manufacturer: formData.get('manufacturer') as string,
        next_inspection_date: formData.get('next_inspection_date') as string,
        notes: formData.get('notes') as string,
        reducer_model: formData.get('reducer_model') as string,
        is_special: formData.get('is_special') === 'on',
        special_license: formData.get('special_license') as string,
        inspection_cycle: Number(formData.get('inspection_cycle')),
        inspector: formData.get('inspector') as string,
        last_inspection_date: formData.get('last_inspection_date') as string,
      });
    } else {
      // Electrical specific fields
      Object.assign(baseEq, {
        commission_date: formData.get('commission_date') as string, // Using commission_date as "入井日期"
        location: formData.get('location') as string,
        usage: formData.get('usage') as string,
        is_special: false, // Default false for basic electrical unless specified
        notes: formData.get('notes') as string,
      });
    }

    addEquipment(baseEq);
    addToast(`${activeTab === 'mechanical' ? '机电' : '电气'}设备入库成功！`, 'success');
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-4 border-blue-600 pb-2">
         <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <PackagePlus className="w-8 h-8 mr-2 text-blue-600" /> 设备入库登记
         </h2>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab('mechanical')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
            activeTab === 'mechanical' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-600 ring-offset-2' 
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Wrench className="w-5 h-5 mr-2" /> 机电设备
        </button>
        <button
          onClick={() => setActiveTab('electrical')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
            activeTab === 'electrical' 
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 ring-2 ring-amber-500 ring-offset-2' 
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Zap className="w-5 h-5 mr-2" /> 电气设备
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6 animate-in fade-in duration-300" key={activeTab}>
        
        {/* MECHANICAL FORM */}
        {activeTab === 'mechanical' && (
          <>
            <div>
              <h3 className="text-lg font-bold mb-4 border-b pb-1 text-blue-800">基本信息 (机电)</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="设备名称*" name="name" required />
                <Input label="规格型号" name="model" />
                <Input label="出厂编号*" name="serial_number" required />
                <Input label="生产日期" name="production_date" type="date" defaultValue={today} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 border-b pb-1 text-blue-800">技术参数</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="电机型号" name="motor_model" />
                <Input label="功率" name="power_rating" />
                <Input label="煤安标志" name="ma_ex_code" />
                <Input label="投入运行时间" name="commission_date" type="date" defaultValue={today} />
                <Input label="减速器型号" name="reducer_model" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 border-b pb-1 text-blue-800">其他信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="生产厂家" name="manufacturer" />
                <Input label="责任队组" name="team" />
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select name="status" className="border rounded p-2 focus:ring-2 focus:ring-blue-500">
                    <option value="在用">在用</option>
                    <option value="备用">备用</option>
                  </select>
                </div>
                <Input label="下次检验日期" name="next_inspection_date" type="date" />
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea name="notes" className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" rows={2}></textarea>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 border-b pb-1 text-blue-800">特种设备信息</h3>
              <div className="flex items-center mb-4">
                <input type="checkbox" name="is_special" id="is_special" className="h-4 w-4 text-blue-600" />
                <label htmlFor="is_special" className="ml-2 text-sm text-gray-700 font-bold">是否为特种设备</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="特种设备许可证号" name="special_license" />
                <Input label="检验周期（月）" name="inspection_cycle" type="number" defaultValue={12} />
                <Input label="检验机构" name="inspector" />
                <Input label="上次检验日期" name="last_inspection_date" type="date" />
              </div>
            </div>
            
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold w-full transition-colors flex justify-center items-center shadow-lg shadow-blue-200">
              <Save className="w-5 h-5 mr-2" /> 确认机电设备入库
            </button>
          </>
        )}

        {/* ELECTRICAL FORM */}
        {activeTab === 'electrical' && (
          <>
            <div>
              <h3 className="text-lg font-bold mb-4 border-b pb-1 text-amber-700">基础信息 (电气)</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="设备名称*" name="name" required />
                <Input label="规格型号" name="model" />
                <Input label="现场编号*" name="serial_number" required placeholder="例如: DQ-001" />
                <Input label="入井日期" name="commission_date" type="date" defaultValue={today} />
              </div>
            </div>

            <div>
               <h3 className="text-lg font-bold mb-4 border-b pb-1 text-amber-700">使用详情</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                     <Input label="使用地点" name="location" required />
                  </div>
                  <div className="col-span-1">
                     <Input label="用途" name="usage" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-sm font-medium text-gray-700 mb-1">责任队组</label>
                    <input name="team" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-amber-500 outline-none w-full" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">当前状态</label>
                    <select name="status" className="border rounded p-2 focus:ring-2 focus:ring-amber-500">
                      <option value="在用">在用</option>
                      <option value="备用">备用</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1">备注</label>
                    <textarea name="notes" className="w-full border rounded p-2 focus:ring-2 focus:ring-amber-500" rows={2}></textarea>
                  </div>
               </div>
            </div>

            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-bold w-full transition-colors flex justify-center items-center shadow-lg shadow-amber-200">
              <Save className="w-5 h-5 mr-2" /> 确认电气设备入库
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export const EquipmentList: React.FC<{ onNavigateToLifecycle?: (id: number) => void }> = ({ onNavigateToLifecycle }) => {
  const { equipment } = useData();
  const [filterStatus, setFilterStatus] = useState<string[]>(['在用', '备用', '维修中']);
  const [filterCategory, setFilterCategory] = useState<'all' | 'mechanical' | 'electrical'>('all');
  const [keyword, setKeyword] = useState('');

  const filtered = equipment.filter(e => {
    // Treat undefined category as 'mechanical' for legacy data compatibility
    const eqCategory = e.category || 'mechanical';
    
    const matchesStatus = filterStatus.includes(e.status);
    const matchesCategory = filterCategory === 'all' || eqCategory === filterCategory;
    const matchesKeyword = !keyword || 
      String(e.name).toLowerCase().includes(keyword.toLowerCase()) || 
      String(e.serial_number).toLowerCase().includes(keyword.toLowerCase()) ||
      String(e.location || '').toLowerCase().includes(keyword.toLowerCase()) ||
      String(e.team || '').toLowerCase().includes(keyword.toLowerCase());
    return matchesStatus && matchesCategory && matchesKeyword;
  });

  const toggleStatus = (s: string) => {
    setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const headers = [
    { label: '类别', className: 'whitespace-nowrap w-20' },
    { label: '设备名称', className: 'min-w-[140px]' },
    { label: '型号', className: 'whitespace-nowrap min-w-[100px]' },
    { label: '编号', className: 'whitespace-nowrap min-w-[100px]' },
    { label: '状态', className: 'whitespace-nowrap w-24' },
    { label: '地点/队组', className: 'min-w-[120px]' },
    { label: '生产厂家/用途', className: 'min-w-[160px] max-w-[240px]' },
    { label: '日期', className: 'whitespace-nowrap w-32' },
    { label: '属性', className: 'whitespace-nowrap w-16 text-center' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-600 pb-2 flex items-center">
        <Grid className="w-8 h-8 mr-2 text-blue-600" /> 设备台账查询
      </h2>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-4">
        {/* Row 1: Status Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">状态筛选</label>
          <div className="flex gap-2">
            {['在用', '备用', '维修中', '报废'].map(s => (
              <button 
                key={s}
                onClick={() => toggleStatus(s)}
                className={`px-3 py-1 rounded text-sm border transition-colors ${filterStatus.includes(s) ? 'bg-blue-100 border-blue-500 text-blue-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Dropdowns and Search */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="w-full md:w-1/4">
             <label className="block text-sm font-medium text-gray-700 mb-1">设备类别</label>
             <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select 
                  className="w-full pl-9 border rounded p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                >
                  <option value="all">全部类别</option>
                  <option value="mechanical">机电设备</option>
                  <option value="electrical">电气设备</option>
                </select>
             </div>
           </div>

           <div className="w-full md:w-3/4">
             <label className="block text-sm font-medium text-gray-700 mb-1">关键词搜索</label>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full pl-9 border rounded p-2 focus:ring-2 focus:ring-blue-500" 
                  placeholder="名称 / 编号 / 地点 / 队组"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(h => (
                <th key={h.label} className={`px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider ${h.className}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length > 0 ? filtered.map(e => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-3 whitespace-nowrap align-middle">
                   {e.category === 'electrical' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Zap className="w-3 h-3 mr-1"/> 电气
                      </span>
                   ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Wrench className="w-3 h-3 mr-1"/> 机电
                      </span>
                   )}
                </td>
                <td className="px-4 py-3 align-middle">
                   <div 
                     className="font-bold text-blue-600 hover:text-blue-800 text-sm cursor-pointer flex items-center hover:underline"
                     onClick={() => onNavigateToLifecycle && onNavigateToLifecycle(e.id)}
                     title="点击查看全生命周期"
                   >
                     {e.name}
                     <ExternalLink size={12} className="ml-1 opacity-50"/>
                   </div>
                </td>
                <td className="px-4 py-3 align-middle">
                   <div className="text-gray-600 text-xs font-medium bg-gray-100 px-2 py-1 rounded inline-block whitespace-nowrap">
                     {e.model || '-'}
                   </div>
                </td>
                <td className="px-4 py-3 align-middle text-gray-500 text-xs font-mono whitespace-nowrap">
                   {e.serial_number}
                </td>
                <td className="px-4 py-3 whitespace-nowrap align-middle">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${e.status === '在用' ? 'bg-green-100 text-green-800' : 
                      e.status === '维修中' ? 'bg-red-100 text-red-800' :
                      e.status === '备用' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle text-gray-600 text-xs">
                   {e.category === 'electrical' && e.location ? (
                      <div className="flex items-center"><MapPin className="w-3 h-3 mr-1 text-gray-400"/>{e.location}</div>
                   ) : (
                      <div>{e.team}</div>
                   )}
                </td>
                <td className="px-4 py-3 align-middle text-gray-500 text-xs truncate max-w-[200px]" title={e.category === 'electrical' ? e.usage : e.manufacturer}>
                   {e.category === 'electrical' ? e.usage : e.manufacturer}
                </td>
                <td className="px-4 py-3 whitespace-nowrap align-middle text-gray-500 text-xs">
                   {e.category === 'electrical' ? `入井: ${e.commission_date}` : `检验: ${e.next_inspection_date || '-'}`}
                </td>
                <td className="px-4 py-3 align-middle text-center">
                   {e.is_special && (
                     <div className="flex justify-center">
                       <span title="特种设备" className="bg-red-100 text-red-600 w-6 h-6 flex items-center justify-center rounded-full">
                         <AlertTriangle className="w-3.5 h-3.5"/>
                       </span>
                     </div>
                   )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">暂无符合条件的设备记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const EquipmentEdit: React.FC = () => {
  const { equipment, updateEquipment, deleteEquipment, currentUser } = useData();
  const { addToast } = useToast();
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [confirmDelName, setConfirmDelName] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const selectedEq = equipment.find(e => e.id === Number(selectedId));

  if (!isAdmin) {
    return <div className="bg-blue-50 p-4 rounded text-blue-800">🔒 当前为普通工人身份，无法修改或删除设备档案。</div>;
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEq) return;
    const formData = new FormData(e.currentTarget);
    
    // We can't easily switch category, so we preserve it.
    // If category was missing, we assume mechanical if that's what we rendered.
    const isElectrical = selectedEq.category === 'electrical';
    
    const updated: Equipment = {
      ...selectedEq,
      name: formData.get('name') as string,
      model: formData.get('model') as string,
      serial_number: formData.get('serial_number') as string,
      status: formData.get('status') as any,
      team: formData.get('team') as string,
      notes: formData.get('notes') as string,
      // Ensure category is set if it was missing
      category: selectedEq.category || (isElectrical ? 'electrical' : 'mechanical'),
    };

    if (!isElectrical) {
       // Mechanical Fields
       Object.assign(updated, {
          manufacturer: formData.get('manufacturer') as string,
          production_date: formData.get('production_date') as string,
          motor_model: formData.get('motor_model') as string,
          power_rating: formData.get('power_rating') as string,
          ma_ex_code: formData.get('ma_ex_code') as string,
          commission_date: formData.get('commission_date') as string,
          reducer_model: formData.get('reducer_model') as string,
          next_inspection_date: formData.get('next_inspection_date') as string,
          is_special: formData.get('is_special') === 'on',
          special_license: formData.get('special_license') as string,
          inspection_cycle: Number(formData.get('inspection_cycle')),
          inspector: formData.get('inspector') as string,
          last_inspection_date: formData.get('last_inspection_date') as string,
       });
    } else {
       // Electrical Fields
       Object.assign(updated, {
          location: formData.get('location') as string,
          usage: formData.get('usage') as string,
          commission_date: formData.get('commission_date') as string,
       });
    }

    updateEquipment(updated);
    addToast('设备信息已保存成功！', 'success');
  };

  const handleDelete = () => {
    if (selectedEq && confirmDelName === selectedEq.name) {
      deleteEquipment(selectedEq.id);
      setSelectedId('');
      setConfirmDelName('');
      addToast(`设备 "${selectedEq.name}" 已成功删除！`, 'success');
    }
  };

  // Determine which form to show. Default to 'mechanical' if category is undefined.
  const isElectrical = selectedEq?.category === 'electrical';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-600 pb-2 flex items-center">
        <Edit3 className="w-8 h-8 mr-2 text-blue-600" /> 修改/删除设备档案
      </h2>
      
      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">选择设备</label>
        <select 
          className="w-full border rounded p-2" 
          value={selectedId} 
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          <option value="">-- 请选择 --</option>
          {equipment.map(e => <option key={e.id} value={e.id}>{e.name} - {e.serial_number}</option>)}
        </select>
      </div>

      {selectedEq && (
        <div className="space-y-8 animate-in fade-in duration-300">
           {/* KEY ADDED HERE: Ensures the form re-renders when ID changes */}
           <form key={selectedEq.id} onSubmit={handleUpdate} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              <div className={`text-sm font-bold mb-2 px-2 py-1 inline-block rounded ${isElectrical ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                 当前类型: {isElectrical ? '电气设备' : '机电设备'}
              </div>

              {/* DYNAMIC FORM BASED ON CATEGORY */}
              {!isElectrical ? (
                <>
                  {/* MECHANICAL FORM FIELDS */}
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="设备名称" name="name" defaultValue={selectedEq.name} required />
                     <Input label="规格型号" name="model" defaultValue={selectedEq.model} />
                     <Input label="出厂编号" name="serial_number" defaultValue={selectedEq.serial_number} required />
                     <Input label="生产日期" name="production_date" type="date" defaultValue={selectedEq.production_date} />
                     
                     <Input label="电机型号" name="motor_model" defaultValue={selectedEq.motor_model} />
                     <Input label="功率" name="power_rating" defaultValue={selectedEq.power_rating} />
                     <Input label="煤安标志" name="ma_ex_code" defaultValue={selectedEq.ma_ex_code} />
                     <Input label="投入运行时间" name="commission_date" type="date" defaultValue={selectedEq.commission_date} />
                     <Input label="减速器型号" name="reducer_model" defaultValue={selectedEq.reducer_model} />
                     <Input label="生产厂家" name="manufacturer" defaultValue={selectedEq.manufacturer} />
                     
                     <Input label="责任队组" name="team" defaultValue={selectedEq.team} />
                     
                     <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">状态</label>
                        <select name="status" defaultValue={selectedEq.status} className="border rounded p-2">
                          <option value="在用">在用</option>
                          <option value="备用">备用</option>
                          <option value="维修中">维修中</option>
                          <option value="报废">报废</option>
                        </select>
                     </div>

                     <Input label="下次检验日期" name="next_inspection_date" type="date" defaultValue={selectedEq.next_inspection_date} />
                     
                     <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1">备注</label>
                        <textarea name="notes" defaultValue={selectedEq.notes} className="w-full border rounded p-2" rows={2}></textarea>
                     </div>
                  </div>
                  
                  <div className="mt-4 border-t pt-4">
                     <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">特种设备属性</h4>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="flex items-center col-span-2">
                           <input type="checkbox" name="is_special" defaultChecked={selectedEq.is_special} className="h-4 w-4" />
                           <label className="ml-2 text-sm font-bold">是否为特种设备</label>
                       </div>
                       <Input label="特种设备许可证号" name="special_license" defaultValue={selectedEq.special_license} />
                       <Input label="检验周期（月）" name="inspection_cycle" type="number" defaultValue={selectedEq.inspection_cycle} />
                       <Input label="检验机构" name="inspector" defaultValue={selectedEq.inspector} />
                       <Input label="上次检验日期" name="last_inspection_date" type="date" defaultValue={selectedEq.last_inspection_date} />
                     </div>
                  </div>
                </>
              ) : (
                // ELECTRICAL FIELDS
                <div className="grid grid-cols-2 gap-4">
                   <Input label="设备名称" name="name" defaultValue={selectedEq.name} required />
                   <Input label="规格型号" name="model" defaultValue={selectedEq.model} />
                   <Input label="现场编号" name="serial_number" defaultValue={selectedEq.serial_number} required />
                   <Input label="入井日期" name="commission_date" type="date" defaultValue={selectedEq.commission_date} />
                   
                   <Input label="使用地点" name="location" defaultValue={selectedEq.location} required />
                   <Input label="用途" name="usage" defaultValue={selectedEq.usage} />
                   <Input label="责任队组" name="team" defaultValue={selectedEq.team} />
                   
                   <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">状态</label>
                      <select name="status" defaultValue={selectedEq.status} className="border rounded p-2">
                        <option value="在用">在用</option>
                        <option value="备用">备用</option>
                        <option value="维修中">维修中</option>
                        <option value="报废">报废</option>
                      </select>
                   </div>
                   
                   <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1">备注</label>
                      <textarea name="notes" defaultValue={selectedEq.notes} className="w-full border rounded p-2" rows={2}></textarea>
                   </div>
                </div>
              )}

              <button type="submit" className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 w-full font-bold shadow-md">保存修改</button>
           </form>

           <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="text-red-800 font-bold mb-2 flex items-center"><Trash2 className="w-4 h-4 mr-2"/> 危险区域：删除设备</h3>
              <p className="text-sm text-red-600 mb-2">操作不可逆！删除后无法恢复！请输入设备名称 <strong>{selectedEq.name}</strong> 确认。</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="border border-red-300 rounded p-2 flex-grow" 
                  placeholder="输入设备名称确认"
                  value={confirmDelName}
                  onChange={(e) => setConfirmDelName(e.target.value)}
                />
                <button 
                  onClick={handleDelete}
                  disabled={confirmDelName !== selectedEq.name}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  确认删除
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export const InspectionAlerts: React.FC = () => {
  const { equipment } = useData();
  const [filterCategory, setFilterCategory] = useState<'all' | 'mechanical' | 'electrical'>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  
  // Safely map teams to strings and trim
  const uniqueTeams = Array.from(new Set(equipment.map(e => String(e.team || '')).filter(t => t.trim() !== '')));

  // Logic: Active or Standby or Maintenance (not Scrapped) and has inspection date
  const alerts = equipment
    .filter(e => {
        // Treat undefined category as 'mechanical'
        const eqCategory = e.category || 'mechanical';

        const statusMatch = e.next_inspection_date && e.status !== '报废';
        const categoryMatch = filterCategory === 'all' || eqCategory === filterCategory;
        const teamMatch = filterTeam === 'all' || (e.team && String(e.team) === filterTeam);
        return statusMatch && categoryMatch && teamMatch;
    })
    .map(e => ({ ...e, daysUntil: calculateDaysUntil(e.next_inspection_date!) }))
    .filter(e => e.daysUntil <= 90) // 3 months warning
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-600 pb-2 flex items-center">
        <ShieldAlert className="w-8 h-8 mr-2 text-blue-600" />
        定期检验到期提醒台账
      </h2>
      
      <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center text-sm text-gray-600 mb-2 md:mb-0">
          <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
          <span>未来 <strong className="text-gray-900">90天内</strong> 需检验设备。</span>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative">
                <select 
                  className="border rounded p-1.5 text-sm bg-gray-50 focus:bg-white outline-none w-32"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                >
                  <option value="all">全部类别</option>
                  <option value="mechanical">机电设备</option>
                  <option value="electrical">电气设备</option>
                </select>
             </div>
             <div className="relative">
                <select 
                  className="border rounded p-1.5 text-sm bg-gray-50 focus:bg-white outline-none w-32"
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                >
                  <option value="all">全部队组</option>
                  {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">剩余天数</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">下次检验日期</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">设备名称</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">出厂编号</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">责任队组</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">特种设备</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {alerts.length > 0 ? alerts.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                    ${e.daysUntil <= 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                    {e.daysUntil <= 0 ? '已过期' : `${e.daysUntil} 天`}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {e.next_inspection_date}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{e.name}</td>
                <td className="px-6 py-4 text-gray-500">{e.serial_number}</td>
                <td className="px-6 py-4 text-gray-500">{e.team || '-'}</td>
                <td className="px-6 py-4 text-gray-500">
                  {e.is_special && <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100">特种</span>}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-200 mb-2" />
                  <span className="text-lg font-medium text-gray-600">当前无即将到期的设备</span>
                  <span className="text-sm text-gray-400 mt-1">所有设备均在检验有效期内</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Internal icon for Empty State
import { CheckCircle } from 'lucide-react';

const Input: React.FC<{ label: string; name: string; type?: string; required?: boolean; defaultValue?: string | number; placeholder?: string }> = (props) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{props.label}</label>
    <input 
      {...props} 
      className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
    />
  </div>
);
