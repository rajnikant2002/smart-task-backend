import { z } from "zod";

// Priority enum
const priorityEnum = z.enum(["low", "medium", "high", "Low", "Medium", "High"]);

// Status enum - case insensitive with transform
const statusEnum = z
  .string()
  .transform((val) => {
    if (!val) return val;
    // Normalize: lowercase and replace spaces with underscores
    const normalized = String(val).toLowerCase().trim().replace(/\s+/g, "_");
    // Map common variations
    const statusMap = {
      pending: "pending",
      in_progress: "in_progress",
      inprogress: "in_progress",
      completed: "completed",
      cancelled: "cancelled",
      canceled: "cancelled",
    };
    return statusMap[normalized] || normalized;
  })
  .refine(
    (val) => {
      if (!val) return true; // Allow null/empty
      return ["pending", "in_progress", "completed", "cancelled"].includes(val);
    },
    {
      message:
        'Status must be one of: "pending", "in_progress", "completed", or "cancelled"',
    }
  )
  .optional()
  .nullable();

// Flexible date validation - accepts ISO 8601 datetime or date strings
const dateSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Allow null/empty
      // Try to parse as date
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    {
      message:
        "Due date must be a valid date string (ISO 8601 format preferred)",
    }
  )
  .optional()
  .nullable();

// Helper function to normalize camelCase to snake_case
const normalizeKeys = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const normalized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip id and other auto-generated fields
    if (key === "id" || key === "created_at" || key === "updated_at") {
      continue;
    }
    // Convert camelCase to snake_case
    let normalizedKey = key;
    if (key === "assignedTo") normalizedKey = "assigned_to";
    else if (key === "dueDate") normalizedKey = "due_date";
    normalized[normalizedKey] = value;
  }
  return normalized;
};

// Create task validation schema
export const createTaskSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required and cannot be empty")
      .max(200, "Title must be less than 200 characters"),
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional()
      .nullable(),
    category: z
      .string()
      .max(50, "Category must be less than 50 characters")
      .optional()
      .nullable(),
    priority: priorityEnum.optional().nullable(),
    status: statusEnum.optional().nullable(),
    assigned_to: z
      .string()
      .max(100, "Assigned to must be less than 100 characters")
      .optional()
      .nullable(),
    due_date: dateSchema,
  })
  .passthrough(); // Allow extra fields but don't validate them

// Update task validation schema
export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must be less than 200 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional()
      .nullable(),
    category: z
      .string()
      .max(50, "Category must be less than 50 characters")
      .optional()
      .nullable(),
    priority: priorityEnum.optional().nullable(),
    status: statusEnum.optional().nullable(),
    assigned_to: z
      .string()
      .max(100, "Assigned to must be less than 100 characters")
      .optional()
      .nullable(),
    due_date: dateSchema,
  })
  .passthrough() // Allow extra fields but don't validate them
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Get tasks query parameters validation schema
export const getTasksQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a positive integer")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 100",
    })
    .optional(),
  offset: z
    .string()
    .regex(/^\d+$/, "Offset must be a non-negative integer")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 0, {
      message: "Offset must be a non-negative integer",
    })
    .optional(),
  sort_by: z
    .enum([
      "created_at",
      "updated_at",
      "title",
      "priority",
      "status",
      "due_date",
      "category",
    ])
    .optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  category: z.string().max(50).optional(),
  assigned_to: z.string().max(100).optional(),
});

// Task ID parameter validation schema
export const taskIdSchema = z.object({
  id: z.string().uuid("Invalid task ID format"),
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate based on schema type
      if (schema === createTaskSchema || schema === updateTaskSchema) {
        // Validate request body - normalize camelCase to snake_case first
        const body = normalizeKeys(req.body || {});
        const result = schema.safeParse(body);

        if (!result.success) {
          // Handle ZodError properly
          const zodError = result.error;
          let errors = [];

          if (zodError && zodError.issues) {
            // Zod v3+ uses 'issues' instead of 'errors'
            errors = zodError.issues.map((issue) => ({
              field:
                issue.path && issue.path.length > 0
                  ? issue.path.join(".")
                  : "root",
              message: issue.message || "Validation failed",
            }));
          } else if (zodError && zodError.errors) {
            // Fallback for older Zod versions
            errors = zodError.errors.map((err) => ({
              field:
                err.path && err.path.length > 0 ? err.path.join(".") : "root",
              message: err.message || "Validation failed",
            }));
          } else {
            // Last resort - use the error message directly
            errors = [
              {
                field: "root",
                message: zodError?.message || "Validation failed",
              },
            ];
          }

          return res.status(400).json({
            error: "Validation failed",
            details: errors,
          });
        }
        req.validatedData = result.data;
      } else if (schema === getTasksQuerySchema) {
        // Validate query parameters
        const query = req.query || {};
        const result = schema.safeParse(query);
        if (!result.success) {
          const zodError = result.error;
          let errors = [];

          if (zodError && zodError.issues) {
            errors = zodError.issues.map((issue) => ({
              field:
                issue.path && issue.path.length > 0
                  ? issue.path.join(".")
                  : "root",
              message: issue.message || "Invalid query parameter",
            }));
          } else if (zodError && zodError.errors) {
            errors = zodError.errors.map((err) => ({
              field:
                err.path && err.path.length > 0 ? err.path.join(".") : "root",
              message: err.message || "Invalid query parameter",
            }));
          } else {
            errors = [
              {
                field: "root",
                message: zodError?.message || "Invalid query parameters",
              },
            ];
          }

          return res.status(400).json({
            error: "Invalid query parameters",
            details: errors,
          });
        }
        req.validatedQuery = result.data;
      } else if (schema === taskIdSchema) {
        // Validate route parameters
        const params = req.params || {};
        const result = schema.safeParse(params);
        if (!result.success) {
          const zodError = result.error;
          let errors = [];

          if (zodError && zodError.issues) {
            errors = zodError.issues.map((issue) => ({
              field:
                issue.path && issue.path.length > 0
                  ? issue.path.join(".")
                  : "id",
              message: issue.message || "Invalid task ID",
            }));
          } else if (zodError && zodError.errors) {
            errors = zodError.errors.map((err) => ({
              field:
                err.path && err.path.length > 0 ? err.path.join(".") : "id",
              message: err.message || "Invalid task ID",
            }));
          } else {
            errors = [
              {
                field: "id",
                message: zodError?.message || "Invalid task ID format",
              },
            ];
          }

          return res.status(400).json({
            error: "Invalid task ID",
            details: errors,
          });
        }
        req.validatedParams = result.data;
      }
      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      res.status(500).json({
        error: "Validation error",
        message:
          error?.message || "An unexpected error occurred during validation",
      });
    }
  };
};
