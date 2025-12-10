import React, { createContext, useContext, useState, useEffect } from 'react';
import { Equipment, Log, User } from './types';
import { formatDate } from './utils';

// Initial Data Seeding
const INITIAL_USERS: User[] = [
  { username: 'admin', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', role: 'admin', status: 'active', fullname: '系统管理员' },
  { username: 'worker', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', role: 'worker', status: 'active', fullname: '普通员工' }
];

interface DataContextType {
  users: User[];
  equipment: Equipment[];
  logs: Log[];
  currentUser: User | null;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  register: (u: User) => boolean;
  addEquipment: (eq: Omit<Equipment, 'id'>) => void;
  updateEquipment: (eq: Equipment) => void;
  deleteEquipment: (id: number) => void;
  addLog: (log: Omit<Log, 'id'>) => void;
  updateLog: (log: Log) => void;
  deleteLog: (id: number) => void;
  updateUser: (username: string, updates: Partial<User>) => void;
  deleteUser: (username: string) => void;
  importData: (eqs: Equipment[], logs: Log[], mode: 'append' | 'overwrite') => void;
  getFullState: () => string;
  loadFullState: (json: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const hashPassword = async (pwd: string) => {
  const msgBuffer = new TextEncoder().encode(pwd);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const lsUsers = localStorage.getItem('mine_users');
    const lsEq = localStorage.getItem('mine_equipment');
    const lsLogs = localStorage.getItem('mine_logs');

    if (lsUsers) setUsers(JSON.parse(lsUsers));
    else setUsers(INITIAL_USERS);

    if (lsEq) setEquipment(JSON.parse(lsEq));
    if (lsLogs) setLogs(JSON.parse(lsLogs));
  }, []);

  // Sync to local storage
  useEffect(() => { localStorage.setItem('mine_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('mine_equipment', JSON.stringify(equipment)); }, [equipment]);
  useEffect(() => { localStorage.setItem('mine_logs', JSON.stringify(logs)); }, [logs]);

  const login = (u: string, pHash: string) => {
    const user = users.find(user => user.username === u && user.passwordHash === pHash);
    if (user && user.status === 'active') {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const register = (newUser: User) => {
    if (users.find(u => u.username === newUser.username)) return false;
    setUsers([...users, newUser]);
    return true;
  };

  const addEquipment = (eq: Omit<Equipment, 'id'>) => {
    const newId = equipment.length > 0 ? Math.max(...equipment.map(e => e.id)) + 1 : 1;
    setEquipment([...equipment, { ...eq, id: newId }]);
  };

  const updateEquipment = (eq: Equipment) => {
    setEquipment(equipment.map(e => e.id === eq.id ? eq : e));
  };

  const deleteEquipment = (id: number) => {
    setEquipment(equipment.filter(e => e.id !== id));
    setLogs(logs.filter(l => l.eq_id !== id));
  };

  const addLog = (log: Omit<Log, 'id'>) => {
    const newId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
    setLogs([...logs, { ...log, id: newId }]);
    
    // Auto status update logic
    if (log.log_type.includes("故障维修")) {
      const eq = equipment.find(e => e.id === log.eq_id);
      if (eq) updateEquipment({ ...eq, status: '维修中' });
    } else if (log.log_type.includes("维修完成")) {
      const eq = equipment.find(e => e.id === log.eq_id);
      if (eq) updateEquipment({ ...eq, status: '在用' });
    }
  };

  const updateLog = (updatedLog: Log) => {
    setLogs(logs.map(l => l.id === updatedLog.id ? updatedLog : l));
    if (updatedLog.log_type.includes("故障维修")) {
       const eq = equipment.find(e => e.id === updatedLog.eq_id);
       if (eq) updateEquipment({ ...eq, status: '维修中' });
    } else if (updatedLog.log_type.includes("维修完成")) {
       const eq = equipment.find(e => e.id === updatedLog.eq_id);
       if (eq) updateEquipment({ ...eq, status: '在用' });
    }
  };

  const deleteLog = (id: number) => {
    setLogs(logs.filter(l => l.id !== id));
  };

  const updateUser = (username: string, updates: Partial<User>) => {
    setUsers(users.map(u => u.username === username ? { ...u, ...updates } : u));
  };

  const deleteUser = (username: string) => {
    setUsers(users.filter(u => u.username !== username));
  };

  const importData = (eqs: Equipment[], lgs: Log[], mode: 'append' | 'overwrite') => {
    if (mode === 'overwrite') {
      setEquipment(eqs);
      setLogs(lgs);
    } else {
      let newEqs = [...equipment];
      eqs.forEach(inEq => {
        const idx = newEqs.findIndex(e => e.name === inEq.name);
        if (idx >= 0) {
          newEqs[idx] = { ...inEq, id: newEqs[idx].id }; 
        } else {
          const newId = Math.max(0, ...newEqs.map(e => e.id)) + 1;
          newEqs.push({ ...inEq, id: newId });
        }
      });
      setEquipment(newEqs);
      
      let maxLogId = Math.max(0, ...logs.map(l => l.id));
      const newLogs = lgs.map(l => ({ ...l, id: ++maxLogId }));
      setLogs([...logs, ...newLogs]);
    }
  };

  const getFullState = () => {
    return JSON.stringify({ users, equipment, logs, timestamp: new Date().toISOString() });
  };

  const loadFullState = (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.users && Array.isArray(data.users)) setUsers(data.users);
      if (data.equipment && Array.isArray(data.equipment)) setEquipment(data.equipment);
      if (data.logs && Array.isArray(data.logs)) setLogs(data.logs);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <DataContext.Provider value={{
      users, equipment, logs, currentUser,
      login, logout, register,
      addEquipment, updateEquipment, deleteEquipment,
      addLog, updateLog, deleteLog,
      updateUser, deleteUser, importData,
      getFullState, loadFullState
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};

export const hashPasswordHelper = hashPassword;
