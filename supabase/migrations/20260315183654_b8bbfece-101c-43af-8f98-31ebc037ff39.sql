-- Set the event as published so the HUD can read fight data via existing RLS policies
UPDATE bdg_event SET published = true WHERE id = 'e3e7db83-be4c-41ac-9cd6-2b121dbae04e';