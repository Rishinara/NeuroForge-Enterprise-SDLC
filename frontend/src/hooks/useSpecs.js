import { useState, useCallback } from 'react';
import { api, extractErrorMessage } from '../api/client.js';

export function useSpecs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleError = (err, defaultMsg) => {
    if (err.response?.status === 502) {
      return "AI generation failed, please try again";
    }
    if (err.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }
    return extractErrorMessage(err) || defaultMsg;
  };

  const listSpecs = useCallback(async (projectId, status) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${projectId}/specs`);
      return { data: res.data, error: null };
    } catch (err) {
      const msg = handleError(err, 'Failed to list specs');
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSpec = useCallback(async (specId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/specs/${specId}`);
      return { data: res.data, error: null };
    } catch (err) {
      const msg = handleError(err, 'Failed to get spec details');
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSpecVersion = useCallback(async (specId, versionNumber) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/specs/${specId}/versions/${versionNumber}`);
      return { data: res.data, error: null };
    } catch (err) {
      const msg = handleError(err, 'Failed to get spec version');
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSpec = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/projects/${payload.project_id}/specs`, payload);
      return { data: res.data, error: null };
    } catch (err) {
      const msg = handleError(err, 'Failed to generate spec');
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const editSpecVersion = useCallback(async (specId, versionId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/specs/${specId}`, payload);
      return { data: res.data, error: null };
    } catch (err) {
      const msg = handleError(err, 'Failed to update spec version');
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const submitForReview = useCallback(async (specId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/specs/${specId}/submit`);
      return { data: res.data, error: null };
    } catch (err) {
      const msg = handleError(err, 'Failed to submit for review');
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const approveSpec = useCallback(async (specId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/specs/${specId}/approve`);
      return { data: res.data, error: null };
    } catch (err) {
      const msg = handleError(err, 'Failed to approve spec');
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const requestChanges = useCallback(async (specId, note) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/specs/${specId}/request-changes`, { note });
      return { data: res.data, error: null };
    } catch (err) {
      const msg = handleError(err, 'Failed to request changes');
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);



  return {
    loading,
    error,
    listSpecs,
    getSpec,
    getSpecVersion,
    generateSpec,
    editSpecVersion,
    submitForReview,
    approveSpec,
    requestChanges
  };
}
