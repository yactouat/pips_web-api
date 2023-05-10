DO
$do$
BEGIN
INSERT INTO permissions(action, resource)
(
  SELECT 'create', 'images'
  WHERE NOT EXISTS (
    SELECT action, resource 
    FROM permissions 
    WHERE action = 'create'
    AND resource = 'images'
  )
);
END
$do$