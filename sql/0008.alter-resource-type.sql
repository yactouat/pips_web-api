DO
$do$
BEGIN
ALTER TYPE _resourcetype ADD VALUE IF NOT EXISTS 'images' AFTER 'users_permissions';
END
$do$
