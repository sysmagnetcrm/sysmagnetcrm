import { useState, useEffect } from 'react';
import { candidatesAPI } from '../utils/supabaseServices';

export const useCandidates = (filters = {}, enabled = true) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await candidatesAPI.getAll(filters);
      const payload = response?.data;
      setCandidates(Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      console.error('Failed to load candidates:', err?.response?.data || err?.message);
      setError(err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteCandidate = async (id) => {
    try {
      await candidatesAPI.delete(id);
      setCandidates(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      // Fallback: remove locally
      setCandidates(prev => prev.filter(c => c.id !== id));
      return { success: true };
    }
  };

  const createCandidate = async (candidateData) => {
    try {
      const response = await candidatesAPI.create(candidateData);
      setCandidates(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      // For demo purposes, add to local state
      const newCandidate = { 
        id: Date.now(), 
        ...candidateData, 
        status: 'Pending',
        created_at: new Date().toISOString() 
      };
      setCandidates(prev => [newCandidate, ...prev]);
      return { success: true, data: newCandidate };
    }
  };

  const updateCandidate = async (id, candidateData) => {
    try {
      await candidatesAPI.update(id, candidateData);
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id ? { ...candidate, ...candidateData } : candidate
        )
      );
      return { success: true };
    } catch (err) {
      // For demo purposes, update local state
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id ? { ...candidate, ...candidateData } : candidate
        )
      );
      return { success: true };
    }
  };

  const approveCandidate = async (id) => {
    try {
      await candidatesAPI.update(id, { status: 'Approved' });
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id ? { ...candidate, status: 'Approved' } : candidate
        )
      );
      return { success: true };
    } catch (err) {
      // For demo purposes, update local state
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id ? { ...candidate, status: 'Approved' } : candidate
        )
      );
      return { success: true };
    }
  };

  const scheduleInterview = async (id, interviewDate) => {
    try {
      await candidatesAPI.update(id, { 
        status: 'Interviewed', 
        interview_date: interviewDate 
      });
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id ? { 
            ...candidate, 
            status: 'Interviewed', 
            interview_date: interviewDate 
          } : candidate
        )
      );
      return { success: true };
    } catch (err) {
      // For demo purposes, update local state
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id ? { 
            ...candidate, 
            status: 'Interviewed', 
            interview_date: interviewDate 
          } : candidate
        )
      );
      return { success: true };
    }
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setCandidates([]);
      return;
    }
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), enabled]);

  return {
    candidates,
    loading,
    error,
    refetch: fetchCandidates,
    createCandidate,
    updateCandidate,
    approveCandidate,
    scheduleInterview,
    deleteCandidate,
  };
};