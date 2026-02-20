import { z } from "zod";

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional().default(""),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0d9488"),
  createdAt: z.coerce.date(),
});

export const projectCreateSchema = projectSchema.omit({ id: true, createdAt: true });
export const projectUpdateSchema = projectCreateSchema.partial();

export const taskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  createdAt: z.coerce.date(),
});

export const taskCreateSchema = taskSchema.omit({ id: true, createdAt: true });
export const taskUpdateSchema = taskCreateSchema.partial();

export const timelogSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  notes: z.string().max(1000).optional().default(""),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const timelogCreateSchema = timelogSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  endTime: z.coerce.date().optional(),
});

export const timelogUpdateSchema = z.object({
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

export type Task = z.infer<typeof taskSchema>;
export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;

export type Timelog = z.infer<typeof timelogSchema>;
export type TimelogCreate = z.infer<typeof timelogCreateSchema>;
export type TimelogUpdate = z.infer<typeof timelogUpdateSchema>;
