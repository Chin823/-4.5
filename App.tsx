import React, { useState, useEffect } from 'react';
import { DataProvider, useData, hashPasswordHelper } from './data';
import { ToastProvider, useToast } from './toast';
import { MenuOption } from './types';
import { Dashboard } from './pages/Dashboard';
import { EquipmentAdd, EquipmentEdit, EquipmentList, InspectionAlerts } from './pages/Equipment';
import { LogEntry, LogList } from './pages/Maintenance';
import { Lifecycle, PublicLifecycle } from './pages/Lifecycle';
import { AdminPanel, BackupRestore } from './pages/Admin';
import { 
  Activity, Clipboard, Edit3, Grid, Layers, ShieldAlert, Database, Users, 
  LogOut, PackagePlus, Menu, X, ChevronLeft, ChevronRight, Hexagon 
} from 'lucide-react';

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  collapsed: boolean;
  onClick: () => void 
}> = ({ icon, label, active, collapsed, onClick }) => (
  <button 
    onClick={onClick}
    title={collapsed ? label : ''}
    className={`
      w-full flex items-center py-3 my-1 transition-all duration-200 rounded-lg group
      ${collapsed ? 'justify-center px-2' : 'px-4'}
      ${active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
        : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}
    `}
  >
    <div className={`flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    
    {!collapsed && (
      <span className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
        {label}
      </span>
    )}
    
    {collapsed && active && (
      <div className="absolute left-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
        {label}
      </div>
    )}
  </button>
);

const MainLayout: React.FC = () => {
  const { currentUser, logout } = useData();
  const [currentMenu, setCurrentMenu] = useState<MenuOption>("系统概览");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // State to track which equipment to show in Lifecycle view when navigating from List
  const [lifecycleTargetId, setLifecycleTargetId] = useState<number | null>(null);

  const menuItems: { id: MenuOption, icon: any, adminOnly?: boolean }[] = [
    { id: "系统概览", icon: <Activity className="w-5 h-5"/> },
    { id: "设备入库/登记", icon: <PackagePlus className="w-5 h-5"/> },
    { id: "修改/删除设备", icon: <Edit3 className="w-5 h-5"/> },
    { id: "设备台账查询", icon: <Grid className="w-5 h-5"/> },
    { id: "维修与保养记录", icon: <Clipboard className="w-5 h-5"/> },
    { id: "全部维修日志", icon: <Layers className="w-5 h-5"/> },
    { id: "定期检验到期提醒台账", icon: <ShieldAlert className="w-5 h-5"/> },
    { id: "全生命周期追踪", icon: <Activity className="w-5 h-5"/> },
    { id: "特种设备管理", icon: <ShieldAlert className="w-5 h-5"/> },
    { id: "数据备份", icon: <Database className="w-5 h-5"/> },
    { id: "用户管理", icon: <Users className="w-5 h-5"/>, adminOnly: true },
  ];

  const handleMenuClick = (id: MenuOption) => {
    setCurrentMenu(id);
    setIsMobileMenuOpen(false);
    // Reset target ID when manually changing menu, unless navigating specifically to it
    if (id !== "全生命周期追踪") {
      setLifecycleTargetId(null);
    }
  };

  const handleNavigateToLifecycle = (id: number) => {
    setLifecycleTargetId(id);
    setCurrentMenu("全生命周期追踪");
  };

  const renderContent = () => {
    switch (currentMenu) {
      case "系统概览": return <Dashboard onNavigate={handleMenuClick} />;
      case "设备入库/登记": return <EquipmentAdd />;
      case "修改/删除设备": return <EquipmentEdit />;
      case "设备台账查询": return <EquipmentList onNavigateToLifecycle={handleNavigateToLifecycle} />;
      case "维修与保养记录": return <LogEntry />;
      case "全部维修日志": return <LogList />;
      case "定期检验到期提醒台账": return <InspectionAlerts />; 
      case "全生命周期追踪": return <Lifecycle initialId={lifecycleTargetId} />;
      case "特种设备管理": return <EquipmentList onNavigateToLifecycle={handleNavigateToLifecycle} />; 
      case "数据备份": return <BackupRestore />;
      case "用户管理": return <AdminPanel />;
      default: return <Dashboard onNavigate={handleMenuClick} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans print:block print:h-auto print:overflow-visible">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-20 shadow-sm px-4 flex justify-between items-center h-16 border-b print:hidden">
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">鑫</div>
            <span className="font-bold text-gray-800 text-lg">下山峁煤业</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
           {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
         </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative z-40 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-sm
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 print:hidden
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Toggle Button (Desktop) */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors z-50"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Area */}
        <div className={`h-20 flex items-center justify-center border-b border-gray-100 transition-all duration-300`}>
           <div className={`w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-200`}>
             <Hexagon size={24} strokeWidth={2.5} />
           </div>
           
           <div className={`ml-3 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'} text-center`}>
             <h1 className="text-base font-bold text-gray-900 leading-tight whitespace-nowrap">山西柳林鑫飞</h1>
             <p className="text-xs text-gray-500 whitespace-nowrap">下山峁煤矿</p>
           </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
           {menuItems.map(item => (
             (!item.adminOnly || currentUser?.role === 'admin') && (
               <SidebarItem 
                 key={item.id}
                 icon={item.icon}
                 label={item.id}
                 active={currentMenu === item.id}
                 collapsed={isSidebarCollapsed}
                 onClick={() => handleMenuClick(item.id)}
               />
             )
           ))}
        </div>

        {/* User Footer */}
        <div className={`p-4 border-t border-gray-100 bg-gray-50/50 transition-all duration-300 ${isSidebarCollapsed ? 'flex flex-col items-center justify-center' : ''}`}>
           <div className={`flex items-center mb-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                 {currentUser?.username.charAt(0).toUpperCase()}
              </div>
              
              {!isSidebarCollapsed && (
                <div className="ml-3 overflow-hidden">
                   <p className="text-sm font-bold text-gray-800 truncate">{currentUser?.username}</p>
                   <p className="text-xs text-gray-500 truncate">{currentUser?.role === 'admin' ? '系统管理员' : '普通员工'}</p>
                </div>
              )}
           </div>
           
           <button 
             onClick={logout} 
             title={isSidebarCollapsed ? "退出登录" : ""}
             className={`
               flex items-center justify-center rounded-lg text-sm font-medium transition-colors
               ${isSidebarCollapsed 
                 ? 'w-9 h-9 text-red-500 hover:bg-red-50' 
                 : 'w-full py-2 bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm'}
             `}
           >
              <LogOut size={isSidebarCollapsed ? 18 : 16} className={isSidebarCollapsed ? '' : 'mr-2'} /> 
              {!isSidebarCollapsed && '退出登录'}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 p-4 md:p-8 transition-all duration-300 print:overflow-visible print:h-auto print:block print:p-0">
        <div className="max-w-7xl mx-auto min-h-[calc(100vh-8rem)] print:min-h-0">
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {renderContent()}
           </div>
        </div>
        <footer className="mt-8 text-center text-gray-400 text-xs pb-4 print:hidden">
           © 2024 山西柳林鑫飞下山峁煤业 · 机电科 | 版本 V4.5 Pro
        </footer>
      </main>
    </div>
  );
};

const AuthScreen: React.FC = () => {
  const { login, register } = useData();
  const { addToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', fullname: '', team: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pHash = await hashPasswordHelper(formData.password);

    if (isLogin) {
      if (!login(formData.username, pHash)) {
        addToast('用户名或密码错误，或账号未审核通过。', 'error');
      } else {
        addToast(`欢迎回来，${formData.username}！`, 'success');
      }
    } else {
      if (!formData.username || !formData.password) {
        addToast('必填项缺失', 'error'); return;
      }
      const success = register({
        username: formData.username,
        passwordHash: pHash,
        role: 'worker',
        status: 'pending',
        fullname: formData.fullname,
        team: formData.team
      });
      if (success) {
        addToast('注册成功，请等待管理员审核！', 'success');
        setIsLogin(true);
      } else {
        addToast('用户名已存在', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px]">
        {/* Left Side: Branding */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
           {/* Background Image: Ensure 'mine_bg.jpg' is in your public folder */}
           <div className="absolute top-0 left-0 w-full h-full opacity-40 bg-[url('/mine_bg.jpg')] bg-cover bg-center mix-blend-overlay"></div>
           <div className="relative z-10">
              <Hexagon className="w-12 h-12 text-blue-300 mb-6" />
              <h1 className="text-3xl font-bold mb-2 tracking-tight">智能矿山</h1>
              <h2 className="text-xl font-light opacity-90">设备管理系统</h2>
           </div>
           <div className="relative z-10">
             <p className="text-sm text-blue-200 leading-relaxed">
               为实现山西柳林鑫飞下山峁煤业实现设备全生命周期的数字化、智能化管理。
             </p>
           </div>
        </div>
        
        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 p-10 md:p-14 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{isLogin ? '账号登录' : '创建新账号'}</h3>
            <p className="text-gray-500 text-sm">欢迎使用设备管理系统，请验证您的身份</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
             <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">用户名</label>
               <input 
                 className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                 placeholder="请输入用户名"
                 value={formData.username}
                 onChange={e => setFormData({...formData, username: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">密码</label>
               <input 
                 type="password"
                 className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                 placeholder="请输入密码"
                 value={formData.password}
                 onChange={e => setFormData({...formData, password: e.target.value})}
               />
             </div>
             
             {!isLogin && (
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">姓名</label>
                    <input className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">队组</label>
                    <input className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.team} onChange={e => setFormData({...formData, team: e.target.value})} />
                 </div>
               </div>
             )}

             <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200 transition-all hover:scale-[1.01] active:scale-[0.98]">
               {isLogin ? '立即登录' : '提交申请'}
             </button>
          </form>

          <div className="mt-6 text-center">
             <button onClick={() => { setIsLogin(!isLogin); }} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
               {isLogin ? '没有账号？申请注册' : '已有账号？返回登录'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ToastProvider>
  );
};

const AppContent: React.FC = () => {
  const { currentUser } = useData();
  const [publicId, setPublicId] = useState<number | null>(null);

  // Check URL params for QR Code scanning (Public Mode)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const id = params.get('id');

    if (mode === 'public' && id) {
      setPublicId(Number(id));
    }
  }, []);

  if (publicId) {
    return <PublicLifecycle id={publicId} />;
  }

  return currentUser ? <MainLayout /> : <AuthScreen />;
};

export default App;