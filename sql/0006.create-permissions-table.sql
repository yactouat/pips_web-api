DO
$do$
BEGIN
IF to_regtype('_actiontype') IS NULL THEN
    CREATE TYPE _actiontype AS ENUM (
        'create',
        'delete',
        'delete_own',
        'read',
        'read_own',
        'update',
        'update_own'
    );
END IF;
IF to_regtype('_resourcetype') IS NULL THEN
    CREATE TYPE _resourcetype AS ENUM (
        'blog_posts',
        'blog_posts_drafts',
        'users_permissions'
    );
END IF;
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    action _actiontype NOT NULL,
    resource _resourcetype NOT NULL
);
CREATE TABLE IF NOT EXISTS permissions_users(
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT permission_user_type_pkey PRIMARY KEY (permission_id, user_id)
);
END
$do$


