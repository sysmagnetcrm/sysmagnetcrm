// Demo data for when API is not available
export const DEMO_CLIENTS = [
  { id: 1, name: 'ACME Retail', contact: 'Rohit Sharma', phone: '+91 98765 43210', email: 'rohit@acme.com', status: 'New', source: 'Website', notes: 'Interested in e-commerce solution', created_at: new Date().toISOString() },
  { id: 2, name: 'BetaTech', contact: 'Leena Rao', phone: '+91 91234 56789', email: 'leena@betatech.com', status: 'Contacted', source: 'Referral', notes: 'Looking for API development', created_at: new Date().toISOString() },
  { id: 3, name: 'TechCorp', contact: 'Amit Kumar', phone: '+91 99887 77665', email: 'amit@techcorp.com', status: 'Qualified', source: 'Website', notes: 'Enterprise client', created_at: new Date().toISOString() },
  { id: 4, name: 'Innovation Hub', contact: 'Lisa Wang', phone: '+91 99887 66554', email: 'lisa@innovationhub.com', status: 'New', source: 'Referral', notes: 'Converted from lead: Enterprise client, high potential', converted_from_lead: true, original_lead_id: 3, created_at: new Date().toISOString() }
];

export const DEMO_CANDIDATES = [
  { id: 1, name: 'Arjun Menon', position: 'Frontend Developer', resume: 'https://example.com/arjun-resume.pdf', status: 'Pending', notes: 'Good JavaScript skills, 3 years experience', created_at: new Date().toISOString() },
  { id: 2, name: 'Priya Sharma', position: 'Backend Developer', resume: 'https://example.com/priya-resume.pdf', status: 'Approved', notes: 'Strong in Node.js and databases', created_at: new Date().toISOString() },
  { id: 3, name: 'Raj Patel', position: 'Full Stack Developer', resume: 'https://example.com/raj-resume.pdf', status: 'Interviewed', notes: 'Excellent communication skills', created_at: new Date().toISOString() }
];

export const DEMO_TASKS = [
  { id: 1, title: 'Demo for ACME', description: 'Prepare e-commerce demo with cart flow', type: 'demo', status: 'Pending', assigned_to: 3, assigned_user_name: 'Arun (Dev)', client_id: 1, client_name: 'ACME Retail', due_date: '2025-10-22', priority: 'High', created_at: new Date().toISOString() },
  { id: 2, title: 'Challenge: BetaTech API', description: 'Implement small REST API and provide docs', type: 'challenge', status: 'In Progress', assigned_to: 3, assigned_user_name: 'Arun (Dev)', client_id: 2, client_name: 'BetaTech', due_date: '2025-10-25', priority: 'Medium', created_at: new Date().toISOString() },
  { id: 3, title: 'Interview: Priya Sharma', description: 'Technical interview for backend position', type: 'interview', status: 'Pending', assigned_to: 1, assigned_user_name: 'Admin User', candidate_id: 2, due_date: '2025-10-28', priority: 'High', created_at: new Date().toISOString() }
];

export const DEMO_USERS = [
  { id: 1, name: 'Admin User', email: 'demo@sysdevcode.com', role: 'admin' },
  { id: 2, name: 'Sanjay (Sales)', email: 'sanjay@vibecrm.com', role: 'sales' },
  { id: 3, name: 'Arun (Dev)', email: 'arun@vibecrm.com', role: 'developer' }
];

export const DEMO_LEADS = [
  { id: 1, name: 'TechStart Inc', contact: 'Sarah Johnson', phone: '+91 98765 12345', email: 'sarah@techstart.com', status: 'New', source: 'Website', notes: 'Interested in web development services', created_at: new Date().toISOString() },
  { id: 2, name: 'Digital Solutions', contact: 'Mike Chen', phone: '+91 91234 56789', email: 'mike@digitalsolutions.com', status: 'Contacted', source: 'LinkedIn', notes: 'Looking for mobile app development', created_at: new Date().toISOString() },
  { id: 3, name: 'Innovation Hub', contact: 'Lisa Wang', phone: '+91 99887 66554', email: 'lisa@innovationhub.com', status: 'Qualified', source: 'Referral', notes: 'Enterprise client, high potential', created_at: new Date().toISOString() }
];

export const DEMO_STATS = {
  totalClients: 3,
  pendingTasks: 2,
  approvedCandidates: 1,
  overdueTasks: 0,
  totalLeads: 3
};
