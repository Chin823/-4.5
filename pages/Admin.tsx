import React, { useState } from 'react';
import { useData } from '../data';
import { useToast } from '../toast';
import { downloadCSV, formatDate, parseCSV } from '../utils';
import { FileSpreadsheet, Upload, Download, Database, AlertCircle, Users } from 'lucide-react';
import { Equipment, Log } from '../types';

export const AdminPanel: React.FC = () => {
  const { users, currentUser, updateUser, deleteUser } = useData();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);

  if (currentUser?.role !== 'admin') return <div>无权访问</div>;

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active' && u.username !== 'admin');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-600 pb-2 flex items-center">
        <Users className="w-8 h-8 mr-2 text-blue-600" /> 用户管理
      </h2>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['用户列表', '审核新用户', '角色管理'].map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === idx ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white p-6 rounded shadow-sm">
        {activeTab === 0 && (
          <table className="min-w-full text-sm">
             <thead className="bg-gray-50 text-left">
               <tr>
                 <th className="p-3">用户名</th><th className="p-3">姓名</th><th className="p-3">角色</th><th className="p-3">状态</th>
               </tr>
             </thead>
             <tbody>
               {users.map(u => (
                 <tr key={u.username} className="border-t">
                   <td className="p-3">{u.username}</td>
                   <td className="p-3">{u.fullname}</td>
                   <td className="p-3">{u.role === 'admin' ? '👮‍♂️ 管理员' : '👷 工人'}</td>
                   <td className="p-3">{u.status === 'active' ? '✅' : '⏳'}</td>
                 </tr>
               ))}
             </tbody>
          </table>
        )}

        {activeTab === 1 && (
          <div>
            {pendingUsers.length === 0 ? <p className="text-gray-500">暂无待审核用户</p> : 
              <ul className="space-y-4">
                {pendingUsers.map(u => (
                  <li key={u.username} className="border p-4 rounded flex justify-between items-center bg-yellow-50">
                     <div>
                       <p className="font-bold">{u.username} ({u.fullname})</p>
                       <p className="text-sm text-gray-600">{u.team} - {u.contact}</p>
                     </div>
                     <div className="space-x-2">
                       <button onClick={() => { updateUser(u.username, { status: 'active' }); addToast('用户已审核通过'); }} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">通过</button>
                       <button onClick={() => { deleteUser(u.username); addToast('用户已拒绝', 'info'); }} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">拒绝</button>
                     </div>
                  </li>
                ))}
              </ul>
            }
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4">
            {activeUsers.map(u => (
              <div key={u.username} className="flex justify-between items-center border-b pb-2">
                <div>
                   <span className="font-medium">{u.username}</span> ({u.role})
                </div>
                <button 
                  onClick={() => {
                    updateUser(u.username, { role: u.role === 'admin' ? 'worker' : 'admin' });
                    addToast(`用户 ${u.username} 角色已更新`);
                  }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {u.role === 'admin' ? '降为工人 ⬇️' : '提升为管理员 ⬆️'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const BackupRestore: React.FC = () => {
  const { equipment, logs, currentUser, getFullState, loadFullState, importData } = useData();
  const { addToast } = useToast();
  const isAdmin = currentUser?.role === 'admin';
  const [importType, setImportType] = useState<'equipment' | 'log'>('equipment');

  if (!isAdmin) return <div className="text-red-600">无权访问</div>;

  const handleBackup = () => {
     downloadCSV(equipment, `设备台账_${formatDate(new Date())}.csv`);
     setTimeout(() => {
        downloadCSV(logs, `维修记录_${formatDate(new Date())}.csv`);
     }, 1000);
     addToast("CSV 报表文件已生成下载");
  };

  const handleFullBackup = () => {
    const json = getFullState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `XINFEI_FULL_BACKUP_${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("系统全量备份已下载 (JSON)", 'success');
  };

  const handleJsonRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const success = loadFullState(content);
      if (success) {
        addToast("✅ 系统数据已成功恢复！", 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast("❌ 文件格式错误，恢复失败", 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      try {
        const rawData = parseCSV(content);
        if (rawData.length === 0) {
          addToast("❌ 文件为空或格式不正确", 'error');
          return;
        }

        let newEqs: Equipment[] = [];
        let newLogs: Log[] = [];

        if (importType === 'equipment') {
          // Map raw data to Equipment type, handling basic conversions
          newEqs = rawData.map(r => ({
            id: 0, // ID will be auto-generated in importData
            name: r.name || '未命名设备',
            model: r.model || '',
            serial_number: r.serial_number || '',
            production_date: r.production_date || '',
            commission_date: r.commission_date || '',
            status: r.status || '备用',
            team: r.team || '',
            manufacturer: r.manufacturer || '',
            is_special: String(r.is_special).toLowerCase() === 'true',
            ...r // Spread other fields
          })) as Equipment[];
          addToast(`正在导入 ${newEqs.length} 条设备数据...`, 'info');
        } else {
          newLogs = rawData.map(r => ({
            id: 0, // ID will be auto-generated
            eq_id: Number(r.eq_id) || 0,
            log_type: r.log_type || '日常维护',
            log_date: r.log_date || formatDate(new Date()),
            operator: r.operator || '导入数据',
            details: r.details || '批量导入'
          })) as Log[];
          addToast(`正在导入 ${newLogs.length} 条日志数据...`, 'info');
        }

        importData(newEqs, newLogs, 'append');
        addToast("✅ CSV 数据导入成功！已合并到现有数据库。", 'success');

      } catch (err) {
        console.error(err);
        addToast("❌ 解析 CSV 失败，请检查文件格式", 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-600 pb-2 flex items-center">
         <Database className="w-8 h-8 mr-2 text-blue-600" /> 数据备份管理
       </h2>
       
       <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm text-yellow-800 mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-bold">重要提示：</p>
            系统目前使用浏览器本地存储 (LocalStorage)。更换浏览器或清理缓存会导致数据丢失。请定期使用下方的 <span className="font-bold">“全量系统备份”</span> 功能保存数据。
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: CSV Export */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200 flex flex-col">
             <div className="flex items-center mb-4 text-blue-600">
               <FileSpreadsheet className="w-6 h-6 mr-2" />
               <h3 className="text-lg font-bold">1. 报表导出 (CSV)</h3>
             </div>
             <p className="text-sm text-gray-600 mb-6 flex-grow">导出 Excel 可读的表格文件，包含当前的设备台账和所有维修记录。适用于制作汇报材料。</p>
             <button onClick={handleBackup} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold flex justify-center items-center transition-colors">
               <Download className="w-4 h-4 mr-2" /> 下载 CSV 报表
             </button>
          </div>

          {/* Card 2: CSV Import */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200 flex flex-col">
             <div className="flex items-center mb-4 text-green-600">
               <Upload className="w-6 h-6 mr-2" />
               <h3 className="text-lg font-bold">2. 批量导入 (CSV)</h3>
             </div>
             <p className="text-sm text-gray-600 mb-4 flex-grow">从 Excel 导出的 CSV 文件批量录入数据。如果设备名称已存在，将更新该设备信息。</p>
             
             <div className="bg-gray-50 p-3 rounded mb-4">
                <div className="flex gap-4 text-sm mb-2">
                   <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="importType" 
                        checked={importType === 'equipment'} 
                        onChange={() => setImportType('equipment')}
                        className="mr-2"
                      /> 设备台账
                   </label>
                   <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="importType" 
                        checked={importType === 'log'} 
                        onChange={() => setImportType('log')}
                        className="mr-2"
                      /> 维修日志
                   </label>
                </div>
             </div>

             <div className="relative">
               <input 
                 type="file" 
                 accept=".csv" 
                 onChange={handleCSVImport}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold border border-transparent flex justify-center items-center transition-colors">
                 <Upload className="w-4 h-4 mr-2" /> 选择 CSV 文件导入
               </button>
             </div>
          </div>

          {/* Card 3: JSON Full Backup */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200 flex flex-col">
             <div className="flex items-center mb-4 text-purple-600">
               <Database className="w-6 h-6 mr-2" />
               <h3 className="text-lg font-bold">3. 系统全量镜像</h3>
             </div>
             <p className="text-sm text-gray-600 mb-4 flex-grow">备份包含用户、设备、日志的完整数据库 (JSON格式)。用于在不同电脑间迁移系统。</p>
             <button onClick={handleFullBackup} className="w-full bg-purple-100 text-purple-700 py-2 rounded hover:bg-purple-200 font-bold mb-3 border border-purple-200 transition-colors">
               下载系统镜像
             </button>
             
             <div className="relative">
               <input 
                 type="file" 
                 accept=".json" 
                 onChange={handleJsonRestore}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-bold border border-transparent transition-colors">
                 从镜像恢复数据
               </button>
             </div>
          </div>
       </div>
    </div>
  );
};
