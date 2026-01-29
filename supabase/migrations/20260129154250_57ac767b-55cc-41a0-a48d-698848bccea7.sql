-- Tabla para gestionar leads/prospectos de ventas
CREATE TABLE public.sales_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  call_date TIMESTAMP WITH TIME ZONE,
  call_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (call_status IN ('scheduled', 'completed', 'no_show', 'rescheduled')),
  lead_status TEXT NOT NULL DEFAULT 'new' CHECK (lead_status IN ('new', 'thinking', 'not_responding', 'converted', 'lost')),
  notes TEXT,
  objections TEXT[],
  pain_points TEXT[],
  follow_up_count INTEGER DEFAULT 0,
  last_follow_up_at TIMESTAMP WITH TIME ZONE,
  next_follow_up_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  amount_paid NUMERIC(10,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para historial de emails enviados
CREATE TABLE public.sales_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('thinking', 'not_responding', 'last_attempt', 'welcome')),
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_email_logs ENABLE ROW LEVEL SECURITY;

-- Policies para sales_leads (solo admins pueden gestionar)
CREATE POLICY "Admins can manage sales leads" ON public.sales_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies para sales_email_logs
CREATE POLICY "Admins can manage email logs" ON public.sales_email_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Trigger para updated_at
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para búsquedas rápidas
CREATE INDEX idx_sales_leads_status ON public.sales_leads(lead_status);
CREATE INDEX idx_sales_leads_next_follow_up ON public.sales_leads(next_follow_up_at);
CREATE INDEX idx_sales_email_logs_lead ON public.sales_email_logs(lead_id);