-- Tabla para servicios ofrecidos por estudiantes
CREATE TABLE public.student_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'mvp',
  price DECIMAL(10,2) NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 7,
  skills TEXT[] DEFAULT '{}',
  portfolio_urls TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  orders_completed INTEGER DEFAULT 0,
  rating_average DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para órdenes de servicios
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.student_services(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  requirements TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  seller_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_deadline TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para reviews de servicios
CREATE TABLE public.service_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.student_services(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, reviewer_id)
);

-- Tabla para mensajes de órdenes
CREATE TABLE public.service_order_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para student_services
CREATE POLICY "Services are viewable by everyone" 
ON public.student_services FOR SELECT 
USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own services" 
ON public.student_services FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" 
ON public.student_services FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" 
ON public.student_services FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para service_orders
CREATE POLICY "Users can view their own orders" 
ON public.service_orders FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create orders" 
ON public.service_orders FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update orders" 
ON public.service_orders FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Políticas para service_reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.service_reviews FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews for their orders" 
ON public.service_reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

-- Políticas para service_order_messages
CREATE POLICY "Order participants can view messages" 
ON public.service_order_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "Order participants can send messages" 
ON public.service_order_messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

-- Función para actualizar rating del servicio
CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.student_services
  SET 
    rating_average = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.service_reviews
      WHERE service_id = NEW.service_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.service_reviews
      WHERE service_id = NEW.service_id
    )
  WHERE id = NEW.service_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_service_rating_trigger
AFTER INSERT ON public.service_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_service_rating();

-- Función para incrementar órdenes completadas
CREATE OR REPLACE FUNCTION public.increment_orders_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.student_services
    SET orders_completed = orders_completed + 1
    WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER increment_orders_completed_trigger
AFTER UPDATE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.increment_orders_completed();

-- Índices
CREATE INDEX idx_student_services_user_id ON public.student_services(user_id);
CREATE INDEX idx_student_services_category ON public.student_services(category);
CREATE INDEX idx_student_services_is_active ON public.student_services(is_active);
CREATE INDEX idx_service_orders_buyer_id ON public.service_orders(buyer_id);
CREATE INDEX idx_service_orders_seller_id ON public.service_orders(seller_id);
CREATE INDEX idx_service_orders_status ON public.service_orders(status);