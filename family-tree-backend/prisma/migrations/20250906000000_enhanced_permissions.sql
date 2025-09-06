-- Enhanced Permissions System Migration
-- Adds granular permissions beyond basic roles

-- Create family member permissions table
CREATE TABLE family_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_memberships(id) ON DELETE CASCADE,
  permission VARCHAR(50) NOT NULL,
  granted_by UUID REFERENCES members(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(family_member_id, permission)
);

-- Create indexes for better performance
CREATE INDEX idx_family_member_permissions_member_id ON family_member_permissions(family_member_id);
CREATE INDEX idx_family_member_permissions_permission ON family_member_permissions(permission);

-- Add permissions column to invitations table for enhanced invitation system
ALTER TABLE invitations
ADD COLUMN permissions TEXT[] DEFAULT ARRAY['view_tree'],
ADD COLUMN custom_message TEXT,
ADD COLUMN expires_at TIMESTAMP,
ADD COLUMN resent_count INTEGER DEFAULT 0,
ADD COLUMN last_resent_at TIMESTAMP;

-- Create member addition requests table for collaborative workflows
CREATE TABLE member_addition_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES members(id),
  member_data JSONB NOT NULL,
  relationship_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES members(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for member addition requests
CREATE INDEX idx_member_addition_requests_family_id ON member_addition_requests(family_id);
CREATE INDEX idx_member_addition_requests_status ON member_addition_requests(status);
CREATE INDEX idx_member_addition_requests_requested_by ON member_addition_requests(requested_by);

-- Insert default permissions for existing family members based on their roles
INSERT INTO family_member_permissions (family_member_id, permission, granted_by)
SELECT
  fm.id,
  unnest(CASE
    WHEN fm.role = 'ADMIN' THEN ARRAY[
      'view_tree', 'view_members', 'view_family_info', 'add_members',
      'edit_members', 'edit_own_profile', 'remove_members', 'manage_invitations',
      'send_invitations', 'cancel_invitations', 'manage_permissions',
      'manage_family_settings', 'delete_family', 'upload_photos',
      'manage_documents', 'export_data', 'send_messages', 'create_posts',
      'moderate_content'
    ]
    WHEN fm.role = 'HEAD' THEN ARRAY[
      'view_tree', 'view_members', 'view_family_info', 'add_members',
      'edit_members', 'edit_own_profile', 'remove_members', 'manage_invitations',
      'send_invitations', 'cancel_invitations', 'upload_photos',
      'manage_documents', 'export_data', 'send_messages', 'create_posts',
      'moderate_content'
    ]
    WHEN fm.role = 'MEMBER' THEN ARRAY[
      'view_tree', 'view_members', 'view_family_info', 'edit_own_profile',
      'send_messages', 'create_posts'
    ]
    WHEN fm.role = 'VIEWER' THEN ARRAY[
      'view_tree', 'view_members', 'view_family_info'
    ]
    ELSE ARRAY['view_tree', 'view_members', 'view_family_info', 'edit_own_profile']
  END) as permission,
  fm.member_id as granted_by
FROM family_memberships fm;

-- Add comments for documentation
COMMENT ON TABLE family_member_permissions IS 'Granular permissions for family members beyond basic roles';
COMMENT ON TABLE member_addition_requests IS 'Collaborative member addition requests with approval workflow';
COMMENT ON COLUMN invitations.permissions IS 'Array of permissions to grant to invited member';
COMMENT ON COLUMN invitations.custom_message IS 'Custom message from inviter';
COMMENT ON COLUMN invitations.expires_at IS 'When the invitation expires';
COMMENT ON COLUMN invitations.resent_count IS 'How many times invitation was resent';
COMMENT ON COLUMN invitations.last_resent_at IS 'Last time invitation was resent';
