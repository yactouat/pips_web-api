DO
$do$
BEGIN
INSERT INTO permissions(action, resource)
(
  SELECT 'read', 'users_permissions'
  WHERE NOT EXISTS (
    SELECT action, resource 
    FROM permissions 
    WHERE action = 'read'
    AND resource = 'users_permissions'
  )
);
END
$do$