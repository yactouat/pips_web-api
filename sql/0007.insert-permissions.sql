DO
$do$
BEGIN
INSERT INTO permissions(action, resource)
(
  SELECT 'read', 'blog_posts_drafts'
  WHERE NOT EXISTS (
    SELECT action, resource 
    FROM permissions 
    WHERE action = 'read'
    AND resource = 'blog_posts_drafts'
  )
);
INSERT INTO permissions(action, resource)
(
  SELECT 'update', 'users_permissions'
  WHERE NOT EXISTS (
    SELECT action, resource 
    FROM permissions 
    WHERE action = 'update'
    AND resource = 'users_permissions'
  )
);
END
$do$
