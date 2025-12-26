# Supabase Setup Instructions

## Step 1: Create the Task History Table

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `database/task_history.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

The table will be created with:
- Proper foreign key relationship to `tasks` table
- Indexes for optimal query performance
- Row Level Security (RLS) enabled
- Basic policy to allow operations (adjust as needed)

## Step 2: Verify Table Creation

1. Go to **Table Editor** in Supabase Dashboard
2. You should see `task_history` table listed
3. Verify the columns:
   - `id` (UUID, primary key)
   - `task_id` (UUID, foreign key to tasks)
   - `action` (TEXT)
   - `old_value` (JSONB)
   - `new_value` (JSONB)
   - `changed_by` (TEXT)
   - `changed_at` (TIMESTAMP)

## Step 3: Verify Tasks Table Has Required Fields

Make sure your `tasks` table has these columns:
- `extracted_entities` (JSONB) - for storing extracted entities
- `suggested_actions` (JSONB) - for storing suggested actions

If these columns don't exist, run this in SQL Editor:

```sql
-- Add extracted_entities column if it doesn't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS extracted_entities JSONB;

-- Add suggested_actions column if it doesn't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS suggested_actions JSONB;
```

## Step 4: Test the Implementation

1. Create a task via API:
   ```bash
   POST /api/tasks
   {
     "title": "Schedule urgent meeting with John today about budget",
     "description": "Schedule urgent meeting with John today about budget allocation"
   }
   ```

2. Check the response - it should include:
   - `extracted_entities` with dates, persons, locations, action_verbs
   - `suggested_actions` array

3. Get the task by ID:
   ```bash
   GET /api/tasks/{id}
   ```
   Should include `history` array with the creation entry

4. Update the task and check history is logged

## Troubleshooting

### If you get foreign key errors:
- Make sure the `tasks` table exists first
- Verify the `tasks.id` column is UUID type

### If RLS is blocking operations:
- Adjust the RLS policy in the SQL script
- Or disable RLS temporarily for testing:
  ```sql
  ALTER TABLE task_history DISABLE ROW LEVEL SECURITY;
  ```

### If JSONB columns are null:
- Check that the entity extraction and action suggestion services are working
- Verify the controller is calling these services correctly



