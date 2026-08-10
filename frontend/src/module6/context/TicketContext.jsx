import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as ticketService from '../services/ticketService.js';

const TicketContext = createContext(null);

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getTickets();
      setTickets(data);
      setInitialized(true);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  const addTicket = useCallback(async (payload) => {
    const created = await ticketService.createTicket(payload);
    setTickets((prev) => [created, ...prev]);
    return created;
  }, []);

  const editTicket = useCallback(async (id, updates) => {
    const updated = await ticketService.updateTicket(id, updates);
    setTickets((prev) => prev.map((t) => (t.id === Number(id) ? updated : t)));
    return updated;
  }, []);

  const removeTicket = useCallback(async (id) => {
    await ticketService.deleteTicket(id);
    setTickets((prev) => prev.filter((t) => t.id !== Number(id)));
  }, []);

  const acceptSuggestion = useCallback(async (id) => {
    const updated = await ticketService.acceptSuggestion(id);
    setTickets((prev) => prev.map((t) => (t.id === Number(id) ? updated : t)));
    return updated;
  }, []);

  const getTicket = useCallback(
    (id) => tickets.find((t) => t.id === Number(id)) || null,
    [tickets]
  );

  const value = useMemo(
    () => ({
      tickets,
      loading,
      error,
      initialized,
      fetchTickets,
      addTicket,
      editTicket,
      removeTicket,
      acceptSuggestion,
      getTicket,
    }),
    [tickets, loading, error, initialized, fetchTickets, addTicket, editTicket, removeTicket, acceptSuggestion, getTicket]
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTickets must be used within a TicketProvider');
  return ctx;
}
