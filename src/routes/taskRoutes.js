import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import {
  validate,
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema,
  taskIdSchema,
} from "../validators/taskValidator.js";

const router = express.Router();

router.post("/", validate(createTaskSchema), createTask);
router.get("/", validate(getTasksQuerySchema), getTasks);
router.get("/:id", validate(taskIdSchema), getTaskById);
// For PATCH, we need to validate both params and body
router.patch(
  "/:id",
  (req, res, next) => {
    try {
      // First validate params
      const params = req.params || {};
      const paramResult = taskIdSchema.safeParse(params);
      if (!paramResult.success) {
        const zodError = paramResult.error;
        let errors = [];

        if (zodError && zodError.issues) {
          errors = zodError.issues.map((issue) => ({
            field:
              issue.path && issue.path.length > 0 ? issue.path.join(".") : "id",
            message: issue.message || "Invalid task ID",
          }));
        } else if (zodError && zodError.errors) {
          errors = zodError.errors.map((err) => ({
            field: err.path && err.path.length > 0 ? err.path.join(".") : "id",
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
      req.validatedParams = paramResult.data;

      // Then validate body - normalize camelCase to snake_case first
      const normalizeKeys = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        const normalized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === "id" || key === "created_at" || key === "updated_at") {
            continue;
          }
          let normalizedKey = key;
          if (key === "assignedTo") normalizedKey = "assigned_to";
          else if (key === "dueDate") normalizedKey = "due_date";
          normalized[normalizedKey] = value;
        }
        return normalized;
      };
      const body = normalizeKeys(req.body || {});
      const bodyResult = updateTaskSchema.safeParse(body);
      if (!bodyResult.success) {
        const zodError = bodyResult.error;
        let errors = [];

        if (zodError && zodError.issues) {
          errors = zodError.issues.map((issue) => ({
            field:
              issue.path && issue.path.length > 0
                ? issue.path.join(".")
                : "root",
            message: issue.message || "Validation failed",
          }));
        } else if (zodError && zodError.errors) {
          errors = zodError.errors.map((err) => ({
            field:
              err.path && err.path.length > 0 ? err.path.join(".") : "root",
            message: err.message || "Validation failed",
          }));
        } else {
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
      req.validatedData = bodyResult.data;
      next();
    } catch (error) {
      console.error("PATCH validation error:", error);
      res.status(500).json({
        error: "Validation error",
        message:
          error?.message || "An unexpected error occurred during validation",
      });
    }
  },
  updateTask
);
router.delete("/:id", validate(taskIdSchema), deleteTask);

export default router;
