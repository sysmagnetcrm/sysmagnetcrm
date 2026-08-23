import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useClients } from './hooks/useClients';
import { useTasks } from './hooks/useTasks';
import { useCandidates } from './hooks/useCandidates';
import { useLeads } from './hooks/useLeads';
import { useUsers } from './hooks/useUsers';
import { usersAPI, notificationsAPI, presenceAPI, employeesAPI } from './utils/supabaseServices';

// Components
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Tasks from './components/Tasks';
import Recruitment from './components/Recruitment';
import Toast from './components/Toast';
import MobileBottomNav from './components/MobileBottomNav';
import ClientDrawer from './components/ClientDrawer';
import TaskDrawer from './components/TaskDrawer';
import CandidateDrawer from './components/CandidateDrawer';
import Leads from './components/Leads';
import UserManagement from './components/UserManagement';
import ProfileDrawer from './components/ProfileDrawer';
import Payments from './components/Payments';
import Payroll from './components/Payroll';
import Reports from './components/Reports';
import HRManagement from './components/HRManagement';
import Attendance from './components/Attendance';
import QA from './components/QA';
import AutomationRuns from './components/AutomationRuns';
import Leaderboard from './components/Leaderboard';
import ClientPortal from './components/ClientPortal';
import PortalManager from './components/PortalManager';
import AdminClientTasks from './components/AdminClientTasks';
import StaffWorkboard from './components/StaffWorkboard';
import AdminClientLogs from './components/AdminClientLogs';

function AppContent() {
  const { user, isAuthenticated, switchUser } = useAuth();
  const { theme } = useTheme();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [panel, setPanel] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [leadFilters, setLeadFilters] = useState({});

  // Selected items for drawers
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Users for role switching
  const [users, setUsers] = useState([]);
  const [salesAgents, setSalesAgents] = useState([]);

  // Data hooks
  const { clients, createClient, updateClient, deleteClient, refetch: refetchClients } = useClients({ search: searchQuery }, isAuthenticated);
  const { tasks, assignTask, markTaskDone, createTask, updateTask, deleteTask } = useTasks({ search: searchQuery }, isAuthenticated);
  const { candidates, approveCandidate, scheduleInterview, createCandidate, updateCandidate, deleteCandidate } = useCandidates({ search: searchQuery }, isAuthenticated);
  const leadsEnabled = ['admin', 'sales', 'digital_marketer'].includes((user?.role || '').toLowerCase());
  const { leads, createLead, bulkImportLeads, qualifyLead, convertToClient, deleteLead, updateLead, assignLead } = useLeads(leadFilters, leadsEnabled);
  const { users: allUsers, createUser, updateUser, deleteUser } = useUsers({}, isAuthenticated);

  // Load users for role switching
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await usersAPI.getAll();
        setUsers(response.data || []);
      } catch (error) {
        console.error('Failed to load users for role switching:', error?.response?.data || error?.message);
        setUsers([]);
      }
    };
    const loadEmployees = async () => {
      try {
        const res = await employeesAPI.getAll();
        const raw = Array.isArray(res?.data) ? res.data : [];
        const normalized = raw
          .map(e => {
            const idNum = Number(e.id ?? e.employee_id ?? e.emp_id);
            const name = (e.name || e.full_name || e.employee_name || [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email || '').toString();
            const roleTag = String(e.role || e.title || e.position || e.department || '').toLowerCase();
            return { id: idNum, name, _roleTag: roleTag };
          })
          .filter(e => Number.isInteger(e.id) && e.name);
        const salesTagged = normalized.filter(e => e._roleTag.includes('sales') || e._roleTag.includes('business'));
        const finalList = (salesTagged.length ? salesTagged : normalized).map(({ id, name }) => ({ id, name }));
        setSalesAgents(finalList);
      } catch (e) {
        console.warn('Failed to load employees for sales assignment:', e?.response?.data || e?.message);
        setSalesAgents([]);
      }
    };

    if (isAuthenticated) {
      loadUsers();
      // Only admins or HR should load employees list
      const role = (user?.role || '').toLowerCase();
      if (role === 'admin' || role === 'hr') {
        loadEmployees();
      } else {
        setSalesAgents([]);
      }
    }
  }, [isAuthenticated, user?.role]);

  // Stable callback to refresh agents on demand (used by Leads toolbar)
  const refetchAgents = useCallback(async () => {
    try {
      const res = await employeesAPI.getAll();
      const raw = Array.isArray(res?.data) ? res.data : [];
      const normalized = raw
        .map(e => {
          const idNum = Number(e.id ?? e.employee_id ?? e.emp_id);
          const name = (e.name || e.full_name || e.employee_name || [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email || '').toString();
          const roleTag = String(e.role || e.title || e.position || e.department || '').toLowerCase();
          return { id: idNum, name, _roleTag: roleTag };
        })
        .filter(e => Number.isInteger(e.id) && e.name);
      const salesTagged = normalized.filter(e => e._roleTag.includes('sales') || e._roleTag.includes('business'));
      const finalList = (salesTagged.length ? salesTagged : normalized).map(({ id, name }) => ({ id, name }));
      setSalesAgents(finalList);
      return { success: true, count: finalList.length };
    } catch (e) {
      console.warn('Failed to refresh employees:', e?.response?.data || e?.message);
      setSalesAgents([]);
      return { success: false, error: e?.message };
    }
  }, []);

  // Keep leadFilters.search in sync with global searchQuery
  useEffect(() => {
    setLeadFilters(prev => ({ ...prev, search: searchQuery }));
  }, [searchQuery]);

  // Redirect default panel for specific roles
  useEffect(() => {
    if (!user) return;
    if (panel === 'dashboard') {
      if (user.role === 'client') {
        setPanel('client_portal');
      } else if (user.role === 'digital_marketer') {
        setPanel('staff_workboard');
      }
    }
  }, [user, panel]);

  // Notifications are owned by TopBar (dropdown + manual mark-as-read).
  // Disable global polling here to avoid auto-marking items as read before the user sees them in the bell menu.
  // If we want toast heads-up later, we can listen for a custom event from TopBar.

  // Presence heartbeat (all authenticated users)
  useEffect(() => {
    if (!isAuthenticated) return;
    let timer;
    const beat = async () => {
      try { await presenceAPI.heartbeat(); } catch { }
    };
    beat();
    timer = setInterval(beat, 30000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  // Toast management
  const addToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Route guard: restrict Users panel to admins only
  useEffect(() => {
    if (!user) return;
    const role = String(user.role || '').toLowerCase();
    if ((panel === 'users' || panel === 'portal_manager') && role !== 'admin') {
      addToast({ title: 'Access denied', message: 'Only admins can access User Management', type: 'error' });
      setPanel('dashboard');
    }
  }, [panel, user]);

  const handleDeleteLead = async (leadId) => {
    const result = await deleteLead(leadId);
    if (result.success) {
      addToast({ title: 'Lead Deleted', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  // Event handlers
  const handleAddClient = async (clientData) => {
    const result = await createClient(clientData);
    if (result.success) {
      addToast({ title: 'Client Added', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleAddCandidate = async (candidateData) => {
    const result = await createCandidate(candidateData);
    if (result.success) {
      addToast({ title: 'Candidate Added', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleAssignTask = async (taskId, userId) => {
    const result = await assignTask(taskId, userId);
    if (result.success) {
      addToast({ title: 'Task Assigned', message: 'Developer notified', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleApproveCandidate = async (candidateId) => {
    const result = await approveCandidate(candidateId);
    if (result.success) {
      addToast({ title: 'Candidate Approved', message: 'Set interview schedule from Admin panel', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleMarkTaskDone = async (taskId) => {
    const result = await markTaskDone(taskId);
    if (result.success) {
      addToast({ title: 'Task Completed', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleCreateTask = async (taskData) => {
    const result = await createTask(taskData);
    if (result.success) {
      addToast({ title: 'Task Created', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    const result = await updateTask(taskId, taskData);
    if (result.success) {
      addToast({ title: 'Task Updated', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleDeleteTask = async (taskId) => {
    const result = await deleteTask(taskId);
    if (result.success) {
      addToast({ title: 'Task Deleted', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleUpdateCandidate = async (candidateId, candidateData) => {
    const result = await updateCandidate(candidateId, candidateData);
    if (result.success) {
      addToast({ title: 'Candidate Updated', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    const result = await deleteCandidate(candidateId);
    if (result.success) {
      addToast({ title: 'Candidate Deleted', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleUpdateClient = async (clientId, clientData) => {
    const result = await updateClient(clientId, clientData);
    if (result.success) {
      addToast({ title: 'Client Updated', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleDeleteClient = async (clientId) => {
    const result = await deleteClient(clientId);
    if (result.success) {
      addToast({ title: 'Client Deleted', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleCreateTaskFromClient = (client) => {
    // This would create a task for the client
    addToast({ title: 'Task Created', message: `Task created for ${client.name}`, type: 'success' });
  };

  // Lead handlers
  const handleAddLead = async (leadData) => {
    const result = await createLead(leadData);
    if (result.success) {
      addToast({ title: 'Lead Added', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleUpdateLead = async (leadId, leadData) => {
    const result = await updateLead(leadId, leadData);
    if (result.success) {
      addToast({ title: 'Lead Updated', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleBulkImportLeads = async (leadsData) => {
    const result = await bulkImportLeads(leadsData);
    if (result.success) {
      addToast({ title: 'Leads Imported', message: `${leadsData.length} leads imported successfully`, type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleQualifyLead = async (leadId) => {
    const role = (user?.role || '').toLowerCase();
    if (role === 'sales') {
      // Sales are only allowed to update status; use PUT /leads/:id
      const result = await updateLead(leadId, { status: 'Qualified' });
      if (result.success) {
        addToast({ title: 'Lead status updated', type: 'success' });
      } else {
        addToast({ title: 'Error', message: result.error, type: 'error' });
      }
      return;
    }
    // Admin/Digital Marketer: use qualifier endpoint
    const result = await qualifyLead(leadId);
    if (result.success) {
      addToast({ title: 'Lead Qualified', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleConvertLeadToClient = async (leadId, details) => {
    debugLog('info', `Converting lead ${leadId} to client`, details);
    const result = await convertToClient(leadId, details);
    if (result.success) {
      debugLog('success', `Lead ${leadId} converted successfully`);
      addToast({ title: 'Lead Converted', message: 'Lead qualified and linked to client', type: 'success' });
      // Refresh clients list to show the newly converted client
      debugLog('info', 'Refreshing clients list...');
      refetchClients();
    } else {
      debugLog('error', `Failed to convert lead ${leadId}`, result.error);
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  // User management handlers
  const handleAddUser = async (userData) => {
    const result = await createUser(userData);
    if (result.success) {
      addToast({ title: 'User Added', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    const result = await updateUser(userId, userData);
    if (result.success) {
      // If current user updated, reflect in auth context and localStorage
      if (user && user.id === userId) {
        const newUser = { ...user, ...userData };
        switchUser(newUser);
      }
      addToast({ title: 'User Updated', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    const result = await deleteUser(userId);
    if (result.success) {
      addToast({ title: 'User Deleted', type: 'success' });
    } else {
      addToast({ title: 'Error', message: result.error, type: 'error' });
    }
  };

  // Render content based on panel
  const renderContent = () => {
    switch (panel) {
      case 'dashboard':
        return (
          <Dashboard
            onAddClient={() => setPanel('clients')}
            onAddCandidate={() => setPanel('recruitment')}
            onSelectTask={setSelectedTask}
          />
        );
      case 'clients':
        return (
          <Clients
            clients={clients}
            onSelect={setSelectedClient}
            onAdd={handleAddClient}
            onCreateTask={handleCreateTaskFromClient}
            searchQuery={searchQuery}
            userRole={user?.role}
            onDelete={handleDeleteClient}
          />
        );
      case 'tasks':
        return (
          <Tasks
            tasks={tasks}
            users={users}
            onSelect={setSelectedTask}
            onAssign={handleAssignTask}
            onMarkDone={handleMarkTaskDone}
            onCreate={handleCreateTask}
            userRole={user?.role}
            onDelete={handleDeleteTask}
          />
        );
      case 'recruitment':
        return (
          <Recruitment
            candidates={candidates}
            onSelect={setSelectedCandidate}
            onAdd={handleAddCandidate}
            onApprove={handleApproveCandidate}
            onScheduleInterview={scheduleInterview}
            onDelete={handleDeleteCandidate}
            userRole={user?.role}
          />
        );
      case 'leads':
        return (
          <Leads
            leads={leads}
            filters={leadFilters}
            onChangeFilters={setLeadFilters}
            userOptions={allUsers}
            onRefreshAgents={refetchAgents}
            salesUsers={salesAgents}
            onSelect={() => { }}
            onAdd={handleAddLead}
            onBulkImport={handleBulkImportLeads}
            onCall={() => { }}
            onMail={() => { }}
            onQualify={handleQualifyLead}
            onConvert={handleConvertLeadToClient}
            searchQuery={searchQuery}
            userRole={user?.role}
            onDelete={handleDeleteLead}
            onUpdate={handleUpdateLead}
            onAssignTo={async (leadId, userId) => {
              const idNum = Number(userId);
              if (!Number.isInteger(idNum)) {
                addToast({ title: 'Invalid User ID', message: 'Assigned user must be a number', type: 'error' });
                return;
              }
              const result = await assignLead(leadId, idNum);
              if (result.success) {
                addToast({ title: 'Lead Assigned', message: 'Lead assigned successfully', type: 'success' });
              } else {
                const msg = result.error || 'Failed to assign lead';
                addToast({ title: 'Assignment Error', message: msg, type: 'error' });
              }
            }}
          />
        );
      case 'payments':
        return (
          <Payments userRole={user?.role} />
        );
      case 'payroll':
        return (
          <Payroll userRole={user?.role} />
        );
      case 'reports':
        return (
          <Reports />
        );
      case 'leaderboard':
        return (
          <Leaderboard />
        );
      case 'client_portal':
        return (
          <ClientPortal />
        );
      case 'client_tasks':
        return (
          <AdminClientTasks users={allUsers} />
        );
      case 'staff_workboard':
        return (
          <StaffWorkboard />
        );
      case 'client_logs':
        return (
          <AdminClientLogs />
        );
      case 'portal_manager':
        return (
          <PortalManager />
        );
      case 'users':
        return (
          <UserManagement
            users={allUsers}
            onAdd={handleAddUser}
            onUpdate={handleUpdateUser}
            onDelete={handleDeleteUser}
          />
        );
      case 'hr':
        return <HRManagement />;
      case 'attendance':
        return <Attendance />;
      case 'qa':
        return <QA />;
      case 'automation':
        return <AutomationRuns />;
      default:
        return <Dashboard onAddClient={() => setPanel('clients')} onAddCandidate={() => setPanel('recruitment')} onSelectTask={setSelectedTask} />;
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F8FA] text-gray-900 font-sans flex flex-col">
      <Toast toasts={toasts} remove={removeToast} />

      <div className="flex-1 flex w-full">
        {/* Desktop & Tablet Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          panel={panel}
          setPanel={setPanel}
        />

        {/* Main Application Container */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 lg:pb-0">
          <TopBar
            panel={panel}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setPanel={setPanel}
            clients={clients}
            tasks={tasks}
            candidates={candidates}
            leads={leads}
            usersList={allUsers}
            onSelectClient={setSelectedClient}
            onSelectTask={setSelectedTask}
            onSelectCandidate={setSelectedCandidate}
            onOpenProfile={() => setProfileOpen(true)}
            onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          />

          {/* Main Content View */}
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={panel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        panel={panel}
        setPanel={setPanel}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {/* Detail Drawers */}
      <AnimatePresence>
        {selectedClient && (
          <ClientDrawer
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onUpdate={handleUpdateClient}
          />
        )}

        {selectedTask && (
          <TaskDrawer
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdateTask}
            onMarkDone={handleMarkTaskDone}
            users={users}
            userRole={user?.role}
          />
        )}

        {selectedCandidate && (
          <CandidateDrawer
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            onApprove={handleApproveCandidate}
            onScheduleInterview={scheduleInterview}
            onUpdate={handleUpdateCandidate}
            userRole={user?.role}
          />
        )}

        {profileOpen && (
          <ProfileDrawer
            user={user}
            onClose={() => setProfileOpen(false)}
            onUpdate={handleUpdateUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AppContent;
