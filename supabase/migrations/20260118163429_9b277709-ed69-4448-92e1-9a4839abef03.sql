-- Fix the activate_pending_enrollment trigger to include required fields
CREATE OR REPLACE FUNCTION public.activate_pending_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending RECORD;
  default_course RECORD;
BEGIN
  -- Only proceed if email is set
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find pending enrollment by email
  SELECT * INTO pending
  FROM pending_enrollments
  WHERE email = NEW.email
    AND activated = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If pending enrollment exists, create the real enrollment
  IF FOUND THEN
    -- Get the default course and community
    SELECT id, community_id INTO default_course
    FROM courses
    WHERE is_published = true
    ORDER BY order_index ASC
    LIMIT 1;
    
    -- Insert enrollment with all required fields
    INSERT INTO course_enrollments (
      user_id,
      course_id,
      community_id,
      course_type,
      tier,
      amount_paid,
      currency,
      stripe_session_id,
      is_active,
      status,
      enrolled_at
    ) VALUES (
      NEW.id,
      COALESCE(default_course.id, '00000000-0000-0000-0000-000000000000'::uuid),
      COALESCE(default_course.community_id, '00000000-0000-0000-0000-000000000000'::uuid),
      pending.course_type,
      pending.tier,
      pending.amount_paid,
      pending.currency,
      pending.stripe_session_id,
      true,
      'active',
      NOW()
    )
    ON CONFLICT (user_id, course_id) 
    DO UPDATE SET
      course_type = EXCLUDED.course_type,
      tier = EXCLUDED.tier,
      amount_paid = EXCLUDED.amount_paid,
      is_active = true,
      status = 'active',
      updated_at = NOW();
    
    -- Mark pending enrollment as activated
    UPDATE pending_enrollments
    SET activated = true, 
        activated_at = NOW(),
        status = 'activated'
    WHERE id = pending.id;
    
    -- Log the activation
    RAISE LOG '[ENROLLMENT] Activated pending enrollment for user % (email: %)', NEW.id, NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger fires on both INSERT and UPDATE (in case email is added later)
DROP TRIGGER IF EXISTS on_profile_created_activate_enrollment ON public.profiles;
CREATE TRIGGER on_profile_created_activate_enrollment
  AFTER INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_pending_enrollment();