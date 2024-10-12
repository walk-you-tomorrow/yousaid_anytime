import { useState, useCallback, useEffect } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  description?: string;
}

export const useCalendarService = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const storedEvents = localStorage.getItem('calendarEvents');
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
      setEvents(parsedEvents);
    }
  }, []);

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
    };
    setEvents((prevEvents) => {
      const updatedEvents = [...prevEvents, newEvent];
      localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
      return updatedEvents;
    });
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents((prevEvents) => {
      const updatedEvents = prevEvents.filter((event) => event.id !== id);
      localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
      return updatedEvents;
    });
  }, []);

  const updateEvent = useCallback((updatedEvent: CalendarEvent) => {
    setEvents((prevEvents) => {
      const updatedEvents = prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      );
      localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
      return updatedEvents;
    });
  }, []);

  const getEventsByDate = useCallback((date: Date) => {
    return events.filter(
      (event) => event.date.toDateString() === date.toDateString()
    );
  }, [events]);

  return {
    events,
    addEvent,
    removeEvent,
    updateEvent,
    getEventsByDate,
  };
};