
-- =============================================
-- PASO 1: Mejorar trigger profiles para INSERT + UPDATE
-- =============================================
CREATE OR REPLACE FUNCTION public.sync_membership_from_gym_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actuar si gym_id cambió (UPDATE) o se inserta con gym_id (INSERT)
  IF TG_OP = 'INSERT' THEN
    IF NEW.gym_id IS NOT NULL THEN
      INSERT INTO fighter_gym_memberships (fighter_id, gym_id, status, joined_at)
      VALUES (NEW.id, NEW.gym_id, 'ACTIVE', NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.gym_id IS DISTINCT FROM OLD.gym_id THEN
      -- Desactivar membresía anterior
      IF OLD.gym_id IS NOT NULL THEN
        UPDATE fighter_gym_memberships
        SET status = CASE WHEN NEW.gym_id IS NOT NULL THEN 'TRANSFERRED' ELSE 'INACTIVE' END,
            left_at = NOW()
        WHERE fighter_id = NEW.id
          AND gym_id = OLD.gym_id
          AND status = 'ACTIVE';
      END IF;
      -- Crear nueva membresía
      IF NEW.gym_id IS NOT NULL THEN
        INSERT INTO fighter_gym_memberships (fighter_id, gym_id, status, joined_at)
        VALUES (NEW.id, NEW.gym_id, 'ACTIVE', NOW())
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Recrear trigger para INSERT + UPDATE
DROP TRIGGER IF EXISTS trg_sync_membership_from_gym_id ON fighter_profiles;
CREATE TRIGGER trg_sync_membership_from_gym_id
  BEFORE INSERT OR UPDATE ON fighter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_membership_from_gym_id();

-- =============================================
-- PASO 2: Tabla de logs de auditoría
-- =============================================
CREATE TABLE IF NOT EXISTS public.fighter_gym_membership_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID REFERENCES fighter_profiles(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  old_gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('JOINED','LEFT','TRANSFERRED','REJOINED')),
  status_before TEXT,
  status_after TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID,
  notes TEXT
);

ALTER TABLE public.fighter_gym_membership_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins/super_admin pueden leer logs
CREATE POLICY "Admins can read membership logs"
  ON public.fighter_gym_membership_logs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- Sistema puede insertar (via trigger SECURITY DEFINER)
CREATE POLICY "System can insert membership logs"
  ON public.fighter_gym_membership_logs
  FOR INSERT
  WITH CHECK (true);

-- Trigger para registrar cambios
CREATE OR REPLACE FUNCTION public.log_membership_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'JOINED';
    INSERT INTO fighter_gym_membership_logs (fighter_id, gym_id, action, status_before, status_after, changed_by)
    VALUES (NEW.fighter_id, NEW.gym_id, v_action, NULL, NEW.status, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'TRANSFERRED' THEN v_action := 'TRANSFERRED';
      ELSIF NEW.status = 'INACTIVE' THEN v_action := 'LEFT';
      ELSIF NEW.status = 'ACTIVE' AND OLD.status != 'ACTIVE' THEN v_action := 'REJOINED';
      ELSE v_action := 'LEFT';
      END IF;
      INSERT INTO fighter_gym_membership_logs (fighter_id, gym_id, old_gym_id, action, status_before, status_after, changed_by)
      VALUES (NEW.fighter_id, NEW.gym_id, OLD.gym_id, v_action, OLD.status, NEW.status, auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_membership_changes
  AFTER INSERT OR UPDATE ON fighter_gym_memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_membership_changes();

-- =============================================
-- PASO 3: Vistas útiles adaptadas al esquema
-- =============================================
CREATE OR REPLACE VIEW public.v_fighters_current_gym AS
SELECT
  fp.id AS fighter_id,
  fp.first_name,
  fp.last_name,
  COALESCE(fp.first_name || ' ' || fp.last_name, fp.first_name, fp.last_name) AS full_name,
  fp.nickname,
  fp.gym_id,
  g.nombre AS gym_nombre,
  g.slug AS gym_slug,
  fgm.joined_at,
  EXTRACT(DAY FROM NOW() - fgm.joined_at)::INT AS days_in_gym
FROM fighter_profiles fp
LEFT JOIN fighter_gym_memberships fgm ON fgm.fighter_id = fp.id AND fgm.status = 'ACTIVE'
LEFT JOIN gyms g ON g.id = fp.gym_id;

CREATE OR REPLACE VIEW public.v_fighter_gym_history AS
SELECT
  fgm.id AS membership_id,
  fgm.fighter_id,
  fp.first_name,
  fp.last_name,
  fgm.gym_id,
  g.nombre AS gym_nombre,
  fgm.status,
  fgm.joined_at,
  fgm.left_at,
  CASE
    WHEN fgm.left_at IS NOT NULL THEN EXTRACT(DAY FROM fgm.left_at - fgm.joined_at)::INT
    ELSE EXTRACT(DAY FROM NOW() - fgm.joined_at)::INT
  END AS duration_days
FROM fighter_gym_memberships fgm
JOIN fighter_profiles fp ON fp.id = fgm.fighter_id
JOIN gyms g ON g.id = fgm.gym_id
ORDER BY fgm.fighter_id, fgm.joined_at DESC;

CREATE OR REPLACE VIEW public.v_gym_statistics AS
SELECT
  g.id AS gym_id,
  g.nombre AS gym_nombre,
  g.slug,
  COUNT(*) FILTER (WHERE fgm.status = 'ACTIVE') AS active_fighters,
  COUNT(*) AS total_fighters_all_time,
  ROUND(AVG(
    CASE WHEN fgm.status = 'ACTIVE' THEN EXTRACT(DAY FROM NOW() - fgm.joined_at) END
  ))::INT AS avg_days_active_fighters,
  MAX(fgm.joined_at) FILTER (WHERE fgm.status = 'ACTIVE') AS last_fighter_joined
FROM gyms g
LEFT JOIN fighter_gym_memberships fgm ON fgm.gym_id = g.id
WHERE g.activo = true
GROUP BY g.id, g.nombre, g.slug;

-- =============================================
-- PASO 4: Funciones de utilidad
-- =============================================
CREATE OR REPLACE FUNCTION public.get_fighter_gym_history(p_fighter_id UUID)
RETURNS TABLE(
  gym_id UUID,
  gym_nombre TEXT,
  status TEXT,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_days INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fgm.gym_id,
    g.nombre,
    fgm.status,
    fgm.joined_at,
    fgm.left_at,
    CASE
      WHEN fgm.left_at IS NOT NULL THEN EXTRACT(DAY FROM fgm.left_at - fgm.joined_at)::INT
      ELSE EXTRACT(DAY FROM NOW() - fgm.joined_at)::INT
    END
  FROM fighter_gym_memberships fgm
  JOIN gyms g ON g.id = fgm.gym_id
  WHERE fgm.fighter_id = p_fighter_id
  ORDER BY fgm.joined_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.can_join_gym(p_fighter_id UUID, p_gym_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM fighter_gym_memberships
    WHERE fighter_id = p_fighter_id
      AND status = 'ACTIVE'
      AND gym_id = p_gym_id
  );
$$;

-- =============================================
-- PASO 5: Eliminar trigger duplicado
-- =============================================
DROP TRIGGER IF EXISTS trg_sync_fighter_gym_on_membership ON fighter_gym_memberships;

-- Limpiar función huérfana si existe
DROP FUNCTION IF EXISTS public.sync_fighter_gym_on_membership();
