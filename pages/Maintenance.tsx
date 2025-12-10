import React, { useState } from 'react';
import { useData } from '../data';
import { useToast } from '../toast';
import { formatDate, downloadCSV } from '../utils';
import { ClipboardList, Trash2, Edit, ClipboardPen, FileText, X, Search } from 'lucide-react';
import { Log } from '../types';

export const LogEntry: React.FC = () => {
  const { equipment, addEquipment, addLog, currentUser } = useData();
  const { addToast } = useToast();
  const activeEquipments = equipment.filter(e => e.status !== '报废');
  const today = formatDate(new Date());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addLog({
      eq_id: Number(formData.get('eq_id')),
      log_type: formData.get('log_type') as string,
      log_date: formData.get('log_date') as string,
      operator: formData.get('operator') as string,
      details: formData.get('details') as string,
    });
    addToast('日志登记成功！', 'success');
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-600 pb-2 flex items-center">
        <ClipboardPen className="w-8 h-8 mr-2 text-blue-600" /> 维修与保养日志登记
      </h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4 max-w-2xl">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">选择设备</label>
          <select name="eq_id" className="border rounded p-2 w-full" required>
            {activeEquipments.map(e => (
              <option key={e.id} value={e.id}>{e.name} - {e.serial_number}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">类型</label>
            <select name="log_type" className="border rounded p-2">
              <option value="日常维护">日常维护</option>
              <option value="定期检修">定期检修</option>
              <option value="更换零件">更换零件</option>
              <option value="故障维修 → 自动变维修中">故障维修 → 自动变维修中</option>
              <option value="维修完成 → 自动恢复在用">维修完成 → 自动恢复在用</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">日期</label>
            <input name="log_date" type="date" defaultValue={today} className="border rounded p-2" required />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">操作人</label>
          <input name="operator" type="text" defaultValue={currentUser?.username} className="border rounded p-2" />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">详情</label>
          <textarea name="details" className="border rounded p-2 h-24" required></textarea>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold w-full">
          提交记录 📝
        </button>
      </form>
    </div>
  );
};

export const LogList: React.FC = () => {
  const { logs, equipment, deleteLog, updateLog, currentUser } = useData();
  const { addToast } = useToast();
  const isAdmin = currentUser?.role === 'admin';
  const [editingLog, setEditingLog] = useState<Log | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Join data and Filter
  const filteredLogs = logs
    .map(l => {
      const eq = equipment.find(e => e.id === l.eq_id);
      return {
        ...l,
        equipmentName: eq?.name || '未知设备',
        serialNumber: eq?.serial_number || 'N/A',
        team: eq?.team || 'N/A'
      };
    })
    .filter(l => 
      !searchTerm || String(l.equipmentName).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.id - a.id);

  const handleExport = () => {
    downloadCSV(filteredLogs, `维修日志_${formatDate(new Date())}.csv`);
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLog) return;
    const formData = new FormData(e.currentTarget);
    updateLog({
      id: editingLog.id,
      eq_id: Number(formData.get('eq_id')),
      log_type: formData.get('log_type') as string,
      log_date: formData.get('log_date') as string,
      operator: formData.get('operator') as string,
      details: formData.get('details') as string,
    });
    addToast('日志记录已更新', 'success');
    setEditingLog(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-600 pb-2 flex items-center mb-4">
            <FileText className="w-8 h-8 mr-2 text-blue-600" /> 全矿维修保养日志总览
          </h2>
          <div className="relative max-w-sm">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               className="w-full pl-9 border rounded p-2 focus:ring-2 focus:ring-blue-500" 
               placeholder="按设备名称搜索..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center whitespace-nowrap">
          <ClipboardList className="w-4 h-4 mr-2" /> 导出 CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['日期', '设备名称', '责任队组', '出厂编号', '类型', '操作人', '详情', '操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.length > 0 ? filteredLogs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">{l.log_date}</td>
                <td className="px-4 py-3 font-medium">{l.equipmentName}</td>
                <td className="px-4 py-3">{l.team}</td>
                <td className="px-4 py-3 text-gray-500">{l.serialNumber}</td>
                <td className="px-4 py-3">
                   <span className={`px-2 py-0.5 rounded text-xs ${l.log_type.includes('故障') ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                      {l.log_type}
                   </span>
                </td>
                <td className="px-4 py-3">{l.operator}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={l.details}>{l.details}</td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    {isAdmin && (
                      <button 
                        onClick={() => setEditingLog(l)}
                        className="text-blue-600 hover:text-blue-900"
                        title="修改"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={() => { if(confirm('确定删除此日志?')) { deleteLog(l.id); addToast('日志已删除', 'info'); } }}
                        className="text-red-600 hover:text-red-900"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
               <tr><td colSpan={8} className="text-center py-8 text-gray-500">未找到相关日志记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
               <h3 className="font-bold text-gray-800">修改日志记录</h3>
               <button onClick={() => setEditingLog(null)}><X className="text-gray-500 hover:text-gray-800"/></button>
             </div>
             <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">选择设备</label>
                  <select name="eq_id" defaultValue={editingLog.eq_id} className="border rounded p-2 w-full">
                    {equipment.map(e => (
                      <option key={e.id} value={e.id}>{e.name} - {e.serial_number}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">类型</label>
                    <select name="log_type" defaultValue={editingLog.log_type} className="border rounded p-2">
                      <option value="日常维护">日常维护</option>
                      <option value="定期检修">定期检修</option>
                      <option value="更换零件">更换零件</option>
                      <option value="故障维修 → 自动变维修中">故障维修</option>
                      <option value="维修完成 → 自动恢复在用">维修完成</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">日期</label>
                    <input name="log_date" type="date" defaultValue={editingLog.log_date} className="border rounded p-2" required />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">操作人</label>
                  <input name="operator" type="text" defaultValue={editingLog.operator} className="border rounded p-2" />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">详情</label>
                  <textarea name="details" defaultValue={editingLog.details} className="border rounded p-2 h-24" required></textarea>
                </div>

                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold w-full">
                  保存修改
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
