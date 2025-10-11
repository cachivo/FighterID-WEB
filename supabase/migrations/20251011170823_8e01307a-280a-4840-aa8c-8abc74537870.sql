-- ============================================
-- MIGRACIÓN: SISTEMA DE ESTACIONES CON PIN
-- ============================================
-- Descripción: Sistema de acceso a estaciones de jueces sin autenticación,
--              usando PINs de 4 dígitos con expiración por evento

-- ============================================
-- TABLA 1: station_sessions
-- ============================================

CREATE TABLE IF NOT EXISTS public.station_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES bdg_event(id) ON DELETE CASCADE,
  station_number INTEGER NOT NULL CHECK (station_number IN (1, 2, 3)),
  pin_code TEXT NOT NULL CHECK (LENGTH(pin_code) = 4 AND pin_code ~ '^\d{4}$'),
  
  -- Juez asignado (opcional, referencia a judges)
  assigned_judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
  
  -- Control de expiración
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Constraint: Solo un PIN activo por estación/evento
  UNIQUE(event_id, station_number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_station_sessions_event 
  ON station_sessions(event_id);

CREATE INDEX IF NOT EXISTS idx_station_sessions_pin 
  ON station_sessions(pin_code) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_station_sessions_active 
  ON station_sessions(event_id, station_number) WHERE is_active = true;

-- Comentario
COMMENT ON TABLE station_sessions IS 
'Sesiones de estaciones de jueces con PINs de 4 dígitos. Un PIN por estación/evento, expira cuando termina el evento.';

-- ============================================
-- TABLA 2: station_access_log
-- ============================================

CREATE TABLE IF NOT EXISTS public.station_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia a la sesión (NULL si acceso fallido)
  session_id UUID REFERENCES station_sessions(id) ON DELETE SET NULL,
  
  -- Datos del intento de acceso
  station_number INTEGER NOT NULL CHECK (station_number IN (1, 2, 3)),
  pin_attempted TEXT NOT NULL,
  judge_name_provided TEXT, -- Nombre manual ingresado
  
  -- Resultado
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  -- Metadata técnica
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Tracking de sesión (para calcular duración)
  disconnected_at TIMESTAMPTZ,
  session_duration INTERVAL GENERATED ALWAYS AS (disconnected_at - accessed_at) STORED
);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_access_log_session 
  ON station_access_log(session_id);

CREATE INDEX IF NOT EXISTS idx_access_log_station 
  ON station_access_log(station_number, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_log_failures 
  ON station_access_log(accessed_at DESC) WHERE success = false;

COMMENT ON TABLE station_access_log IS 
'Log de auditoría de todos los intentos de acceso a estaciones. Incluye accesos exitosos y fallidos para tracking de seguridad.';

-- ============================================
-- TABLA 3: station_rate_limits
-- ============================================

CREATE TABLE IF NOT EXISTS public.station_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_number INTEGER NOT NULL CHECK (station_number IN (1, 2, 3)),
  ip_address INET NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  UNIQUE(station_number, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
  ON station_rate_limits(station_number, ip_address);

COMMENT ON TABLE station_rate_limits IS 
'Control de rate limiting para prevenir ataques de fuerza bruta. 5 intentos fallidos = 10 minutos de bloqueo.';

-- ============================================
-- FUNCIÓN 1: generate_station_pin()
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_station_pin(
  p_event_id UUID,
  p_station_number INTEGER,
  p_assigned_judge_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  session_id UUID,
  pin_code TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_pin TEXT;
  v_expires_at TIMESTAMPTZ;
  v_session_id UUID;
  v_event_end TIMESTAMPTZ;
BEGIN
  -- Verificar que el usuario sea admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can generate station PINs';
  END IF;

  -- Validar station_number
  IF p_station_number NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid station number: must be 1, 2, or 3';
  END IF;

  -- Obtener fecha de fin del evento
  SELECT end_time INTO v_event_end
  FROM bdg_event
  WHERE id = p_event_id;

  IF v_event_end IS NULL THEN
    -- Si no hay end_time, expirar en 24 horas
    v_expires_at := NOW() + INTERVAL '24 hours';
  ELSE
    -- Expirar cuando termine el evento (o 24h si ya pasó)
    v_expires_at := GREATEST(v_event_end, NOW() + INTERVAL '24 hours');
  END IF;

  -- Generar PIN único de 4 dígitos
  LOOP
    v_new_pin := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Verificar que no exista otro PIN activo igual
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM station_sessions
      WHERE pin_code = v_new_pin
        AND is_active = true
        AND expires_at > NOW()
    );
  END LOOP;

  -- Invalidar sesión anterior si existe
  UPDATE station_sessions
  SET is_active = false
  WHERE event_id = p_event_id
    AND station_number = p_station_number
    AND is_active = true;

  -- Crear nueva sesión
  INSERT INTO station_sessions (
    event_id,
    station_number,
    pin_code,
    assigned_judge_id,
    expires_at,
    created_by
  ) VALUES (
    p_event_id,
    p_station_number,
    v_new_pin,
    p_assigned_judge_id,
    v_expires_at,
    p_created_by
  )
  RETURNING id, pin_code, expires_at
  INTO v_session_id, v_new_pin, v_expires_at;

  RETURN QUERY SELECT v_session_id, v_new_pin, v_expires_at;
END;
$$;

COMMENT ON FUNCTION generate_station_pin IS 
'Genera un PIN único de 4 dígitos para una estación. Invalida el PIN anterior si existe. Solo admins.';

-- ============================================
-- FUNCIÓN 2: validate_station_pin()
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_station_pin(
  p_station_number INTEGER,
  p_pin_code TEXT,
  p_judge_name TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  valid BOOLEAN,
  session_id UUID,
  event_id UUID,
  event_name TEXT,
  current_fight_id UUID,
  failure_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_rate_limit RECORD;
  v_current_fight UUID;
BEGIN
  -- 1. Verificar rate limiting
  SELECT * INTO v_rate_limit
  FROM station_rate_limits
  WHERE station_number = p_station_number
    AND ip_address = COALESCE(p_ip_address, '0.0.0.0'::inet)
    AND locked_until > NOW();

  IF FOUND THEN
    -- IP bloqueada
    INSERT INTO station_access_log (
      station_number,
      pin_attempted,
      judge_name_provided,
      success,
      failure_reason,
      ip_address,
      user_agent
    ) VALUES (
      p_station_number,
      p_pin_code,
      p_judge_name,
      false,
      'Rate limit exceeded',
      p_ip_address,
      p_user_agent
    );

    RETURN QUERY SELECT 
      false, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::TEXT,
      NULL::UUID,
      'Demasiados intentos fallidos. Espera ' || 
      CEIL(EXTRACT(MINUTE FROM (v_rate_limit.locked_until - NOW())))::TEXT || 
      ' minutos.';
    RETURN;
  END IF;

  -- 2. Buscar sesión válida
  SELECT 
    ss.*,
    e.name as event_name
  INTO v_session
  FROM station_sessions ss
  JOIN bdg_event e ON e.id = ss.event_id
  WHERE ss.station_number = p_station_number
    AND ss.pin_code = p_pin_code
    AND ss.is_active = true
    AND ss.expires_at > NOW();

  IF NOT FOUND THEN
    -- PIN inválido o expirado
    INSERT INTO station_access_log (
      station_number,
      pin_attempted,
      judge_name_provided,
      success,
      failure_reason,
      ip_address,
      user_agent
    ) VALUES (
      p_station_number,
      p_pin_code,
      p_judge_name,
      false,
      'Invalid or expired PIN',
      p_ip_address,
      p_user_agent
    );

    -- Incrementar contador de fallos
    INSERT INTO station_rate_limits (station_number, ip_address, failed_attempts)
    VALUES (p_station_number, COALESCE(p_ip_address, '0.0.0.0'::inet), 1)
    ON CONFLICT (station_number, ip_address) DO UPDATE
    SET failed_attempts = station_rate_limits.failed_attempts + 1,
        locked_until = CASE 
          WHEN station_rate_limits.failed_attempts >= 4 THEN NOW() + INTERVAL '10 minutes'
          ELSE NULL
        END;

    RETURN QUERY SELECT 
      false, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::TEXT,
      NULL::UUID,
      'PIN inválido o expirado';
    RETURN;
  END IF;

  -- 3. PIN válido - Buscar pelea actual
  SELECT f.id INTO v_current_fight
  FROM fights f
  WHERE f.event_id = v_session.event_id
    AND f.status IN ('scheduled', 'in_progress')
  ORDER BY f.fight_number
  LIMIT 1;

  -- 4. Registrar acceso exitoso
  INSERT INTO station_access_log (
    session_id,
    station_number,
    pin_attempted,
    judge_name_provided,
    success,
    ip_address,
    user_agent
  ) VALUES (
    v_session.id,
    p_station_number,
    p_pin_code,
    p_judge_name,
    true,
    p_ip_address,
    p_user_agent
  );

  -- 5. Resetear rate limiting
  DELETE FROM station_rate_limits
  WHERE station_number = p_station_number
    AND ip_address = COALESCE(p_ip_address, '0.0.0.0'::inet);

  -- 6. Retornar éxito
  RETURN QUERY SELECT 
    true,
    v_session.id,
    v_session.event_id,
    v_session.event_name,
    v_current_fight,
    NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION validate_station_pin IS 
'Valida un PIN de estación y registra el acceso. Implementa rate limiting (5 intentos = 10 min lockout).';

-- ============================================
-- FUNCIÓN 3: get_station_status()
-- ============================================

CREATE OR REPLACE FUNCTION public.get_station_status(p_event_id UUID)
RETURNS TABLE (
  station_number INTEGER,
  pin_code TEXT,
  assigned_judge_name TEXT,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  is_connected BOOLEAN,
  connected_judge_name TEXT,
  last_access TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view station status';
  END IF;

  RETURN QUERY
  SELECT 
    ss.station_number,
    ss.pin_code,
    CASE 
      WHEN j.id IS NOT NULL THEN j.first_name || ' ' || j.last_name
      ELSE NULL
    END as assigned_judge_name,
    ss.is_active,
    ss.expires_at,
    EXISTS (
      SELECT 1 FROM station_access_log sal
      WHERE sal.session_id = ss.id
        AND sal.success = true
        AND sal.disconnected_at IS NULL
        AND sal.accessed_at > NOW() - INTERVAL '5 minutes'
    ) as is_connected,
    (
      SELECT sal.judge_name_provided
      FROM station_access_log sal
      WHERE sal.session_id = ss.id
        AND sal.success = true
      ORDER BY sal.accessed_at DESC
      LIMIT 1
    ) as connected_judge_name,
    (
      SELECT MAX(sal.accessed_at)
      FROM station_access_log sal
      WHERE sal.session_id = ss.id
        AND sal.success = true
    ) as last_access
  FROM station_sessions ss
  LEFT JOIN judges j ON j.id = ss.assigned_judge_id
  WHERE ss.event_id = p_event_id
  ORDER BY ss.station_number;
END;
$$;

COMMENT ON FUNCTION get_station_status IS 
'Obtiene el estado completo de todas las estaciones de un evento (solo admins).';

-- ============================================
-- RLS POLICIES
-- ============================================

-- station_sessions
ALTER TABLE station_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "station_sessions_admin_all" ON station_sessions
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- station_access_log
ALTER TABLE station_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_log_admin_read" ON station_access_log
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "access_log_system_insert" ON station_access_log
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- station_rate_limits
ALTER TABLE station_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits_admin_read" ON station_rate_limits
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "rate_limits_system_manage" ON station_rate_limits
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);