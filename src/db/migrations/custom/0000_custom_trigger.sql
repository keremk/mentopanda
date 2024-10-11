-- -- Custom migration for the trigger
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     domain_part TEXT;
--     org_id INT;
-- BEGIN
--     -- Extract domain from email
--     domain_part := split_part(NEW.email, '@', 2);

--     -- Find or create organization
--     INSERT INTO public.organizations (domain)
--     VALUES (domain_part)
--     ON CONFLICT (domain)
--     DO UPDATE SET domain = EXCLUDED.domain
--     RETURNING id INTO org_id;

--     -- Check if we got an org_id
--     IF org_id IS NULL THEN
--         RAISE EXCEPTION 'Failed to find or create organization for domain %', domain_part;
--     END IF;

--     -- Create profile for the new user
--     BEGIN
--         INSERT INTO public.profiles (id, organization_id)
--         VALUES (NEW.id::integer, org_id);
--     EXCEPTION WHEN OTHERS THEN
--         RAISE EXCEPTION 'Failed to create profile for user %: %', NEW.id, SQLERRM;
--     END;

--     RETURN NEW;
-- EXCEPTION WHEN OTHERS THEN
--     RAISE EXCEPTION 'Error in handle_new_user function: %', SQLERRM;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_auth_user_created
-- AFTER INSERT ON auth.users
-- FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();