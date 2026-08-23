import { useState, useEffect } from 'react';
import { payrollAPI, attendanceAPI } from '../utils/supabaseServices';

export const usePayroll = () => {
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    try {
      const res = await payrollAPI.getEmployees();
      setEmployees(extractArray(res.data));
    } catch (e) {
      setError('Failed to load employees');
    }
  };

  const fetchCycles = async () => {
    try {
      const res = await payrollAPI.getCycles();
      setCycles(extractArray(res.data));
    } catch (e) {
      setError('Failed to load payroll cycles');
    }
  };

  const fetchBonuses = async () => {
    try {
      const res = await payrollAPI.getBonuses();
      setBonuses(extractArray(res.data));
    } catch (e) {
      setError('Failed to load bonuses');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await payrollAPI.getAnalytics();
      setAnalytics(res.data);
    } catch (e) {
      setError('Failed to load analytics');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await payrollAPI.getAuditLogs();
      setAuditLogs(extractArray(res.data));
    } catch (e) {
      setError('Failed to load audit logs');
    }
  };

  const fetchAttendance = async (params = {}) => {
    try {
      const res = await attendanceAPI.getAll(params);
      setAttendance(extractArray(res.data));
    } catch (e) {
      setError('Failed to load attendance');
    }
  };

  const extractArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchCycles(),
        fetchBonuses(),
        fetchAnalytics(),
        fetchAuditLogs(),
        fetchAttendance()
      ]);
    } catch (e) {
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employeeData) => {
    try {
      await payrollAPI.createEmployee(employeeData);
      await fetchEmployees();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateEmployee = async (id, employeeData) => {
    try {
      await payrollAPI.updateEmployee(id, employeeData);
      await fetchEmployees();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await payrollAPI.deleteEmployee(id);
      await fetchEmployees();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const createCycle = async (cycleData) => {
    try {
      await payrollAPI.createCycle(cycleData);
      await fetchCycles();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const processCycle = async (id) => {
    try {
      const res = await payrollAPI.processCycle(id);
      await fetchCycles();
      await fetchAnalytics();
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const getCycleRecords = async (id) => {
    try {
      const res = await payrollAPI.getCycleRecords(id);
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const addBonus = async (bonusData) => {
    try {
      await payrollAPI.addBonus(bonusData);
      await fetchBonuses();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const markAttendance = async (attendanceData) => {
    try {
      await attendanceAPI.create(attendanceData);
      await fetchAttendance();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateAttendance = async (id, attendanceData) => {
    try {
      await attendanceAPI.update(id, attendanceData);
      await fetchAttendance();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const deleteAttendance = async (id) => {
    try {
      await attendanceAPI.delete(id);
      await fetchAttendance();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    employees,
    cycles,
    bonuses,
    attendance,
    analytics,
    auditLogs,
    loading,
    error,
    refetch: fetchAll,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createCycle,
    processCycle,
    getCycleRecords,
    addBonus,
    markAttendance,
    updateAttendance,
    deleteAttendance,
    fetchAttendance,
  };
};
