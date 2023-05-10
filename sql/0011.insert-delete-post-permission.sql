DO
$do$
BEGIN
INSERT INTO permissions(action, resource)
(
  SELECT 'delete', 'blog_posts'
  WHERE NOT EXISTS (
    SELECT action, resource 
    FROM permissions 
    WHERE action = 'delete'
    AND resource = 'blog_posts'
  )
);
END
$do$