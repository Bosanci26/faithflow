-- ============================================================
-- FaithFlow - Fix trigger handle_new_user + RLS policies
-- Rulează în Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. TRIGGER FUNCTION (SECURITY DEFINER = bypass RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_church_id uuid;
BEGIN
  -- Creează biserica din metadata utilizatorului
  INSERT INTO public.churches (name, slug, denomination, city, county)
  VALUES (
    NEW.raw_user_meta_data->>'church_name',
    NEW.raw_user_meta_data->>'church_slug',
    NEW.raw_user_meta_data->>'denomination',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'county'
  )
  RETURNING id INTO new_church_id;

  -- Adaugă utilizatorul ca owner al bisericii
  INSERT INTO public.church_members (user_id, church_id, role)
  VALUES (NEW.id, new_church_id, 'owner');

  -- Creează profilul utilizatorului
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

-- Recreează trigger-ul
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. RLS POLICIES - churches
-- ============================================================
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Șterge policies existente
DROP POLICY IF EXISTS "Users can view their churches" ON public.churches;
DROP POLICY IF EXISTS "Owners can update churches" ON public.churches;
DROP POLICY IF EXISTS "Users can create churches" ON public.churches;

-- SELECT: utilizatorul vede doar bisericile din care face parte
CREATE POLICY "Users can view their churches" ON public.churches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.church_members
      WHERE church_id = churches.id AND user_id = auth.uid()
    )
  );

-- UPDATE: doar owner/admin pot modifica
CREATE POLICY "Owners can update churches" ON public.churches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.church_members
      WHERE church_id = churches.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- INSERT: permite utilizatorilor autentificați să creeze o biserică
-- (fallback dacă trigger-ul nu a rulat la înregistrare)
CREATE POLICY "Users can create churches" ON public.churches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 3. RLS POLICIES - church_members
-- ============================================================
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;

-- Șterge policies existente
DROP POLICY IF EXISTS "Users can view church members" ON public.church_members;
DROP POLICY IF EXISTS "Users can insert themselves as member" ON public.church_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.church_members;

-- SELECT: utilizatorul vede membrii din aceeași biserică
CREATE POLICY "Users can view church members" ON public.church_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    church_id IN (
      SELECT church_id FROM public.church_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: utilizatorul se poate adăuga singur ca owner (fallback setup)
CREATE POLICY "Users can insert themselves as member" ON public.church_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE/DELETE: doar owner poate gestiona membrii
CREATE POLICY "Owners can manage members" ON public.church_members
  FOR ALL USING (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 4. RLS POLICIES - profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());
