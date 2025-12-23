import { Inngest } from 'inngest';

export const inngest = new Inngest({ 
  id: 'pitchai',
  eventKey: process.env.VITE_INNGEST_EVENT_KEY || process.env.INNGEST_EVENT_KEY,
});

