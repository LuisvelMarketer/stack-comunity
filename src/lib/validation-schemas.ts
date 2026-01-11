import { z } from 'zod';

// =============================================
// BASE SCHEMAS - Reutilizables
// =============================================

export const uuidSchema = z.string().uuid('ID inválido');
export const emailSchema = z.string().email('Email inválido').max(255).toLowerCase().trim();
export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña es demasiado larga')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

export const safeTextSchema = z.string()
  .trim()
  .max(1000, 'Texto demasiado largo')
  .transform(val => val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));

export const urlSchema = z.string()
  .url('URL inválida')
  .max(2000, 'URL demasiado larga')
  .optional()
  .or(z.literal(''));

export const slugSchema = z.string()
  .min(3, 'Mínimo 3 caracteres')
  .max(50, 'Máximo 50 caracteres')
  .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones');

// =============================================
// AUTH SCHEMAS
// =============================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// =============================================
// CONTENT SCHEMAS
// =============================================

export const postSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'El contenido es requerido')
    .max(5000, 'Máximo 5000 caracteres'),
  community_id: uuidSchema.optional(),
  image_url: urlSchema,
});

export const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'El comentario es requerido')
    .max(2000, 'Máximo 2000 caracteres'),
});

export const snippetSchema = z.object({
  title: z.string().trim().min(1, 'Título requerido').max(200, 'Título muy largo'),
  content: z.string().min(1, 'Contenido requerido').max(50000, 'Contenido muy largo'),
  description: safeTextSchema.optional(),
  type: z.enum(['code', 'prompt', 'template']),
  language: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  is_public: z.boolean().default(false),
});

// =============================================
// PROJECT SCHEMAS
// =============================================

export const projectSchema = z.object({
  title: z.string().trim().min(1, 'Título requerido').max(200, 'Título muy largo'),
  description: safeTextSchema.optional(),
  repository_url: urlSchema,
  live_url: urlSchema,
  tech_stack: z.array(z.string().max(50)).max(20).optional(),
  visibility: z.enum(['public', 'private', 'members']).default('public'),
});

export const projectUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Título requerido').max(200),
  content: z.string().trim().min(1, 'Contenido requerido').max(10000),
  update_type: z.enum(['progress', 'milestone', 'launch', 'pivot']),
  mood: z.string().max(50).optional(),
  hours_spent: z.number().min(0).max(1000).optional(),
});

export const feedbackSchema = z.object({
  content: z.string().trim().min(10, 'Mínimo 10 caracteres').max(5000),
  category: z.enum(['bug', 'feature', 'improvement', 'question', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// =============================================
// COMMUNITY SCHEMAS
// =============================================

export const communitySchema = z.object({
  name: z.string().trim().min(3, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  slug: slugSchema,
  description: safeTextSchema.optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  is_paid: z.boolean().default(false),
  price_monthly: z.number().min(0).max(10000).optional(),
});

export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Mensaje requerido')
    .max(4000, 'Mensaje muy largo'),
});

// =============================================
// PROFILE SCHEMAS
// =============================================

export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100).optional(),
  bio: safeTextSchema.optional(),
  location: z.string().trim().max(100).optional(),
  interests: z.string().trim().max(500).optional(),
});

export const portfolioSchema = z.object({
  headline: z.string().trim().max(200).optional(),
  summary: safeTextSchema.optional(),
  slug: slugSchema,
  is_public: z.boolean().default(true),
  theme: z.enum(['default', 'dark', 'minimal', 'creative']).optional(),
  github_url: urlSchema,
  linkedin_url: urlSchema,
  website_url: urlSchema,
  contact_email: emailSchema.optional().or(z.literal('')),
});

// =============================================
// SERVICE SCHEMAS
// =============================================

export const serviceSchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(3000),
  price: z.number().min(1).max(100000),
  delivery_time: z.number().min(1).max(365),
  category: z.string().max(50),
});

export const serviceOrderSchema = z.object({
  requirements: z.string().trim().min(20, 'Describe tus requisitos (mínimo 20 caracteres)').max(5000),
});

// =============================================
// INCUBATOR SCHEMAS
// =============================================

export const incubatorProjectSchema = z.object({
  pitch: z.string().trim().min(50, 'El pitch debe tener al menos 50 caracteres').max(5000),
  funding_goal: z.number().min(1000).max(10000000),
  equity_offered: z.number().min(0).max(100).optional(),
  target_market: z.string().max(500).optional(),
  business_model: z.string().max(1000).optional(),
  revenue_projection: z.string().max(500).optional(),
  team_size: z.number().min(1).max(100).optional(),
  video_pitch_url: urlSchema,
  deck_url: urlSchema,
});

export const investmentInterestSchema = z.object({
  amount: z.number().min(100).max(10000000),
  message: z.string().trim().max(2000).optional(),
});

// =============================================
// EVENT SCHEMAS
// =============================================

export const eventSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: safeTextSchema.optional(),
  event_date: z.string().datetime(),
  location: z.string().max(300).optional(),
  max_attendees: z.number().min(1).max(10000).optional(),
});

// =============================================
// HELPER FUNCTIONS
// =============================================

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => err.message);
  return { success: false, errors };
}

// Sanitize HTML in strings
export function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}
