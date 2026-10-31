import { z } from 'zod';

export const esquemaSedePolitica = z.object({ sedeId: z.uuid('Sede inválida') });

// RN-06: política de cancelación configurable por sede.
export const esquemaReglasPolitica = z
  .object({
    reglas: z
      .array(
        z.object({
          horasAntes: z.coerce.number().int().min(0).max(720),
          porcentajeReembolso: z.coerce.number().int().min(0).max(100),
        }),
      )
      .min(1, 'Defina al menos una regla')
      .max(10),
  })
  .refine((d) => new Set(d.reglas.map((r) => r.horasAntes)).size === d.reglas.length, 'Hay horas repetidas')
  .refine((d) => d.reglas.some((r) => r.horasAntes === 0), 'Debe existir una regla para 0 horas');
