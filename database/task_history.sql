-- Task History/Audit Log Table for Supabase
-- Run this script in your Supabase SQL Editor

-- Create the task_history table
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'completed', 'deleted')),
  old_value JSONB,
  new_value JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_at ON task_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_history_action ON task_history(action);

-- Enable Row Level Security (RLS) - optional, adjust based on your security needs
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your needs)
-- You may want to restrict this based on user authentication
CREATE POLICY "Allow all operations on task_history" ON task_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE task_history IS 'Audit log for all task changes including create, update, status changes, completion, and deletion';
COMMENT ON COLUMN task_history.id IS 'Unique identifier for history entry';
COMMENT ON COLUMN task_history.task_id IS 'Reference to the task that was changed';
COMMENT ON COLUMN task_history.action IS 'Type of action: created, updated, status_changed, completed, or deleted';
COMMENT ON COLUMN task_history.old_value IS 'Previous state of the task (JSON)';
COMMENT ON COLUMN task_history.new_value IS 'New state of the task (JSON)';
COMMENT ON COLUMN task_history.changed_by IS 'User or system that made the change';
COMMENT ON COLUMN task_history.changed_at IS 'Timestamp when the change occurred';
