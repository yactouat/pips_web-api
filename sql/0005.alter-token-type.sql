DO
$do$
BEGIN
ALTER TYPE _tokentype ADD VALUE IF NOT EXISTS 'user_deletion' AFTER 'user_modification';
END
$do$