import React, { createContext, useContext, useState, useEffect } from 'react';
import { Equipment, Log, User } from './types';

interface DataContextType {
  users: User[];
  equipment: Equipment[];
  logs: Log[];
  currentUser: User | null;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  register: (u: User) => Promise<boolean>;
  addEquipment: (eq: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (eq: Equipment) => Promise<void>;
  deleteEquipment: (id: number) => Promise<void>;
  addLog: (log: Omit<Log, 'id'>) => Promise<void>;
  updateLog: (log: Log) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  updateUser: (username: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (username: string) => Promise<void>;
  importData: (eqs: Equipment[], logs: Log[], mode: 'append' | 'overwrite') => Promise<void>;
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

  // Fetch data from API on mount
  const fetchData = async () => {
    try {
      const usersRes = await fetch('/api/users');
      const eqRes = await fetch('/api/equipment');
      const logsRes = await fetch('/api/logs');

      if (usersRes.ok) setUsers(await usersRes.json());
      if (eqRes.ok) setEquipment(await eqRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // Check if user session exists (simple persistence)
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const login = async (u: string, pHash: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, passwordHash: pHash })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('current_user', JSON.stringify(data.user));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user');
  };

  const register = async (newUser: User) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        fetchData(); // refresh users
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const addEquipment = async (eq: Omit<Equipment, 'id'>) => {
    await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eq)
    });
    fetchData();
  };

  const updateEquipment = async (eq: Equipment) => {
    await fetch(`/api/equipment/${eq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eq)
    });
    fetchData();
  };

  const deleteEquipment = async (id: number) => {
    await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addLog = async (log: Omit<Log, 'id'>) => {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    
    // Auto status update logic handled by frontend logic calling API
    if (log.log_type.includes("故障维修")) {
      const eq = equipment.find(e => e.id === log.eq_id);
      if (eq) updateEquipment({ ...eq, status: '维修中' });
    } else if (log.log_type.includes("维修完成")) {
      const eq = equipment.find(e => e.id === log.eq_id);
      if (eq) updateEquipment({ ...eq, status: '在用' });
    }
    fetchData();
  };

  const updateLog = async (updatedLog: Log) => {
    await fetch(`/api/logs/${updatedLog.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedLog)
    });
    
    // Status Logic check
    if (updatedLog.log_type.includes("故障维修")) {
       const eq = equipment.find(e => e.id === updatedLog.eq_id);
       if (eq) updateEquipment({ ...eq, status: '维修中' });
    } else if (updatedLog.log_type.includes("维修完成")) {
       const eq = equipment.find(e => e.id === updatedLog.eq_id);
       if (eq) updateEquipment({ ...eq, status: '在用' });
    }
    fetchData();
  };

  const deleteLog = async (id: number) => {
    await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const updateUser = async (username: string, updates: Partial<User>) => {
    await fetch(`/api/users/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    fetchData();
  };

  const deleteUser = async (username: string) => {
    await fetch(`/api/users/${username}`, { method: 'DELETE' });
    fetchData();
  };

  const importData = async (eqs: Equipment[], lgs: Log[], mode: 'append' | 'overwrite') => {
    // Basic implementation: just loop and add (since overwrite is dangerous without full DB reset endpoint)
    // For a real production app, we would add a /api/import endpoint.
    // Here we iterate to reuse existing API logic.
    for (const eq of eqs) {
        // Remove ID to let DB generate it
        const { id, ...rest } = eq;
        await fetch('/api/equipment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(rest)
        });
    }
    for (const lg of lgs) {
        const { id, ...rest } = lg;
        await fetch('/api/logs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(rest)
        });
    }
    fetchData();
  };

  const getFullState = () => {
    // This is now purely for "Export to JSON" functionality
    return JSON.stringify({ users, equipment, logs, timestamp: new Date().toISOString() });
  };

  const loadFullState = (json: string) => {
    // Client-side restore from JSON is tricky with DB.
    // For now, we will parse and try to import.
    try {
      const data = JSON.parse(json);
      if (data.equipment) importData(data.equipment, [], 'append');
      if (data.logs) importData([], data.logs, 'append');
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