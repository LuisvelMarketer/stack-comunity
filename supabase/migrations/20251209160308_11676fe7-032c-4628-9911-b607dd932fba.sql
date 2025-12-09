-- Create service reviews table
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for one review per order
ALTER TABLE public.service_reviews 
ADD CONSTRAINT service_reviews_order_unique UNIQUE (order_id);

-- Enable RLS on service_reviews
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_reviews
CREATE POLICY "Anyone can view reviews" 
ON public.service_reviews FOR SELECT 
USING (true);

CREATE POLICY "Buyers can create reviews for completed orders" 
ON public.service_reviews FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND 
  EXISTS (
    SELECT 1 FROM service_orders 
    WHERE service_orders.id = order_id 
    AND service_orders.buyer_id = auth.uid() 
    AND service_orders.status = 'completed'
  )
);

-- Create index for performance
CREATE INDEX idx_service_reviews_order ON public.service_reviews(order_id);

-- Update the rating function to work with the new structure
CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_service_id UUID;
  v_avg_rating NUMERIC;
  v_count INTEGER;
BEGIN
  -- Get service_id from order
  SELECT so.service_id INTO v_service_id
  FROM service_orders so
  WHERE so.id = NEW.order_id;
  
  -- Calculate new average rating
  SELECT AVG(sr.rating), COUNT(sr.id) INTO v_avg_rating, v_count
  FROM service_reviews sr
  JOIN service_orders so ON so.id = sr.order_id
  WHERE so.service_id = v_service_id;
  
  -- Update service stats
  UPDATE student_services
  SET rating_average = COALESCE(v_avg_rating, 0),
      rating_count = COALESCE(v_count, 0),
      updated_at = now()
  WHERE id = v_service_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS on_review_added ON public.service_reviews;
CREATE TRIGGER on_review_added
AFTER INSERT ON public.service_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_service_rating();