import { z } from 'zod';

export const ptoRequestSchema = z.object({
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  hours: z
    .number({ coerce: true })
    .int('Hours must be an integer')
    .min(1, 'Hours must be between 1 and 8')
    .max(8, 'Hours must be between 1 and 8'),
  reason: z.string().trim().min(1, 'Reason is required'),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['approved', 'denied']),
});

export const updateRequestParamsSchema = z.object({
  requestId: z.string().trim().min(1, 'requestId is required'),
});

export const searchQuerySchema = z.object({
  search: z.string().optional(),
});

export type CreatePtoDto = z.infer<typeof ptoRequestSchema>;
export type UpdatePtoStatusDto = z.infer<typeof updateRequestStatusSchema>;
export type UpdatePtoParamsDto = z.infer<typeof updateRequestParamsSchema>;
