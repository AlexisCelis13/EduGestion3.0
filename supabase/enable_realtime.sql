-- Enable Realtime for notifications table
-- This allows the app to receive instant updates when a new notification is inserted.

begin;
  -- Check if publication exists (default in Supabase is supabase_realtime)
  -- Add notifications table to the publication
  alter publication supabase_realtime add table notifications;
commit;
