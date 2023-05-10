DO
$do$
BEGIN
INSERT INTO permissions(action, resource)
(
  SELECT 'create', 'blog_posts'
  WHERE NOT EXISTS (
    SELECT action, resource 
    FROM permissions 
    WHERE action = 'create'
    AND resource = 'blog_posts'
  )
);
END
$do$