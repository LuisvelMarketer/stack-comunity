-- Add service_id column to service_reviews if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_reviews' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE public.service_reviews ADD COLUMN service_id UUID;
  END IF;
END $$;

-- Update the trigger function to work correctly with service_id
CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_service_id UUID;
  v_avg_rating NUMERIC;
  v_count INTEGER;
BEGIN
  -- Get service_id directly from the review or from order
  IF NEW.service_id IS NOT NULL THEN
    v_service_id := NEW.service_id;
  ELSE
    SELECT so.service_id INTO v_service_id
    FROM service_orders so
    WHERE so.id = NEW.order_id;
  END IF;
  
  -- Calculate new average rating
  SELECT ROUND(AVG(sr.rating)::numeric, 1), COUNT(sr.id) INTO v_avg_rating, v_count
  FROM service_reviews sr
  LEFT JOIN service_orders so ON so.id = sr.order_id
  WHERE sr.service_id = v_service_id OR so.service_id = v_service_id;
  
  -- Update service stats
  UPDATE student_services
  SET rating_average = COALESCE(v_avg_rating, 0),
      rating_count = COALESCE(v_count, 0),
      updated_at = now()
  WHERE id = v_service_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_review_added ON public.service_reviews;
CREATE TRIGGER on_review_added
AFTER INSERT ON public.service_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_service_rating();