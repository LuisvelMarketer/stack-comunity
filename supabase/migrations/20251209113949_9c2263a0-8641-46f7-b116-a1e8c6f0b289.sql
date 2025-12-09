-- Add new columns to project_feedback for the ticket system
ALTER TABLE project_feedback 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'bug',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- Add constraint for valid categories
ALTER TABLE project_feedback 
DROP CONSTRAINT IF EXISTS project_feedback_category_check;
ALTER TABLE project_feedback 
ADD CONSTRAINT project_feedback_category_check 
CHECK (category IN ('bug', 'improvement', 'design', 'general'));

-- Add constraint for valid status
ALTER TABLE project_feedback 
DROP CONSTRAINT IF EXISTS project_feedback_status_check;
ALTER TABLE project_feedback 
ADD CONSTRAINT project_feedback_status_check 
CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix'));

-- Add constraint for valid priority
ALTER TABLE project_feedback 
DROP CONSTRAINT IF EXISTS project_feedback_priority_check;
ALTER TABLE project_feedback 
ADD CONSTRAINT project_feedback_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Add column to build_projects for screenshot
ALTER TABLE build_projects 
ADD COLUMN IF NOT EXISTS screenshot_url text;

-- Update RLS policy for project owners to update feedback status
CREATE POLICY "Project owners can update feedback status" 
ON project_feedback 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM build_projects 
    WHERE build_projects.id = project_feedback.project_id 
    AND build_projects.user_id = auth.uid()
  )
);

-- Add index for better performance on feedback queries
CREATE INDEX IF NOT EXISTS idx_project_feedback_category ON project_feedback(category);
CREATE INDEX IF NOT EXISTS idx_project_feedback_status ON project_feedback(status);