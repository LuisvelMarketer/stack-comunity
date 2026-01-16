CREATE OR REPLACE FUNCTION public.activate_pending_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending RECORD;
BEGIN
  -- Buscar enrollment pendiente por email
  SELECT * INTO pending
  FROM pending_enrollments
  WHERE email = NEW.email
    AND activated = false
  LIMIT 1;
  
  -- Si existe, crear el enrollment real
  IF FOUND THEN
    INSERT INTO course_enrollments (
      user_id,
      course_type,
      tier,
      amount_paid,
      currency,
      stripe_session_id,
      enrolled_at
    ) VALUES (
      NEW.id,
      pending.course_type,
      pending.tier,
      pending.amount_paid,
      pending.currency,
      pending.stripe_session_id,
      NOW()
    );
    
    -- Marcar como activado
    UPDATE pending_enrollments
    SET activated = true, activated_at = NOW()
    WHERE id = pending.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger en la tabla profiles
CREATE TRIGGER on_profile_created_activate_enrollment
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION activate_pending_enrollment();