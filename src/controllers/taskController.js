import { supabase } from "../db/supabase.js";
import { classifyTask } from "../services/classifier.js";
import { extractEntities } from "../services/entityExtractor.js";
import { getSuggestedActions } from "../services/actionSuggestor.js";

// Helper function to log task history
const logTaskHistory = async (
  taskId,
  action,
  oldValue,
  newValue,
  changedBy = "system"
) => {
  try {
    const historyEntry = {
      task_id: taskId,
      action: action,
      old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("task_history")
      .insert([historyEntry]);

    if (error) {
      console.error("Failed to log task history:", error);
      // Don't throw error - history logging failure shouldn't break the main operation
    }
  } catch (err) {
    console.error("Error logging task history:", err);
  }
};

// Error handler helper
const handleError = (err, res, operation = "Operation") => {
  console.error(`${operation} error:`, err);

  // Supabase specific errors
  if (err.code) {
    switch (err.code) {
      case "PGRST116":
        return res.status(404).json({
          error: "Resource not found",
          message: "The requested task does not exist",
        });
      case "23505": // Unique constraint violation
        return res.status(409).json({
          error: "Conflict",
          message: "A task with this information already exists",
        });
      case "23503": // Foreign key violation
        return res.status(400).json({
          error: "Invalid reference",
          message: "Referenced resource does not exist",
        });
      case "22P02": // Invalid input syntax
        return res.status(400).json({
          error: "Invalid input",
          message: "One or more fields contain invalid data",
        });
      default:
        return res.status(400).json({
          error: "Database error",
          message:
            err.message || "An error occurred while processing your request",
        });
    }
  }

  // Network or connection errors
  if (err.message?.includes("fetch") || err.message?.includes("network")) {
    return res.status(503).json({
      error: "Service unavailable",
      message: "Unable to connect to the database. Please try again later.",
    });
  }

  // Default error
  return res.status(500).json({
    error: "Internal server error",
    message: err.message || "An unexpected error occurred",
  });
};

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const validatedData = req.validatedData;
    const { title, description, category, priority, assigned_to, due_date } =
      validatedData;

    // Use classifier for category and default priority if not provided
    const { category: classifiedCategory, priority: classifiedPriority } =
      classifyTask(description || "");

    // If client sends a category explicitly, respect it instead of classifier
    const finalCategory = category || classifiedCategory;

    // If client sends a priority explicitly, respect it instead of classifier
    const finalPriority = priority
      ? String(priority).toLowerCase()
      : classifiedPriority;

    // Extract entities from description
    const extractedEntities = extractEntities(description || "");

    // Get suggested actions based on category
    const suggestedActions = getSuggestedActions(finalCategory);

    const taskData = {
      title,
      description: description || null,
      category: finalCategory,
      priority: finalPriority,
      assigned_to: assigned_to || null,
      due_date: due_date || null,
      extracted_entities: extractedEntities,
      suggested_actions: suggestedActions,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert([taskData])
      .select();

    if (error) {
      return handleError(error, res, "Create task");
    }

    if (!data || data.length === 0) {
      return res.status(500).json({
        error: "Task creation failed",
        message: "Task was not created. Please try again.",
      });
    }

    const createdTask = data[0];

    // Log history for task creation
    await logTaskHistory(
      createdTask.id,
      "created",
      null,
      createdTask,
      req.user?.email || req.headers["x-user-id"] || "system"
    );

    res.status(201).json({
      success: true,
      data: createdTask,
      message: "Task created successfully",
    });
  } catch (err) {
    return handleError(err, res, "Create task");
  }
};

// GET ALL TASKS with pagination, filtering, and sorting
export const getTasks = async (req, res) => {
  try {
    const {
      limit = 10,
      offset = 0,
      sort_by = "created_at",
      sort_order = "desc",
      priority,
      status,
      category,
      assigned_to,
    } = req.validatedQuery || {};

    // Build query
    let query = supabase.from("tasks").select("*", { count: "exact" });

    // Apply filters
    if (priority) {
      query = query.eq("priority", priority.toLowerCase());
    }
    if (status) {
      query = query.eq("status", status.toLowerCase());
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (assigned_to) {
      query = query.eq("assigned_to", assigned_to);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return handleError(error, res, "Get tasks");
    }

    res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: count ? offset + limit < count : false,
      },
    });
  } catch (err) {
    return handleError(err, res, "Get tasks");
  }
};

// GET TASK BY ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.validatedParams;

    // Get task with history
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (taskError) {
      return handleError(taskError, res, "Get task by ID");
    }

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
        message: `No task found with ID: ${id}`,
      });
    }

    // Get task history
    const { data: history, error: historyError } = await supabase
      .from("task_history")
      .select("*")
      .eq("task_id", id)
      .order("changed_at", { ascending: false });

    if (historyError) {
      console.error("Error fetching task history:", historyError);
      // Continue even if history fetch fails
    }

    res.status(200).json({
      success: true,
      data: {
        ...task,
        history: history || [],
      },
    });
  } catch (err) {
    return handleError(err, res, "Get task by ID");
  }
};

// UPDATE TASK
export const updateTask = async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const validatedData = req.validatedData;

    // Get current task state for history
    const { data: oldTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !oldTask) {
      return res.status(404).json({
        error: "Task not found",
        message: `No task found with ID: ${id}`,
      });
    }

    // Normalize field names (camelCase to snake_case)
    const updates = {};
    if (validatedData.title !== undefined) updates.title = validatedData.title;
    if (validatedData.description !== undefined)
      updates.description = validatedData.description;
    if (validatedData.category !== undefined)
      updates.category = validatedData.category;
    if (validatedData.priority !== undefined) {
      updates.priority = String(validatedData.priority).toLowerCase();
    }
    if (validatedData.status !== undefined) {
      updates.status = String(validatedData.status).toLowerCase();
    }
    if (validatedData.assigned_to !== undefined)
      updates.assigned_to = validatedData.assigned_to;
    if (validatedData.due_date !== undefined)
      updates.due_date = validatedData.due_date;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No updates provided",
        message: "At least one field must be provided for update",
      });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return handleError(error, res, "Update task");
    }

    if (!data) {
      return res.status(404).json({
        error: "Task not found",
        message: `No task found with ID: ${id}`,
      });
    }

    // Determine action type based on what changed
    let action = "updated";
    if (updates.status && updates.status !== oldTask.status) {
      action = "status_changed";
    } else if (
      updates.status === "completed" &&
      oldTask.status !== "completed"
    ) {
      action = "completed";
    }

    // Log history for task update
    await logTaskHistory(
      id,
      action,
      oldTask,
      data,
      req.user?.email || req.headers["x-user-id"] || "system"
    );

    res.status(200).json({
      success: true,
      data,
      message: "Task updated successfully",
    });
  } catch (err) {
    return handleError(err, res, "Update task");
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.validatedParams;

    // First check if task exists and get full data for history
    const { data: existingTask, error: checkError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (checkError) {
      return handleError(checkError, res, "Delete task");
    }

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found",
        message: `No task found with ID: ${id}`,
      });
    }

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      return handleError(error, res, "Delete task");
    }

    // Log history for task deletion
    await logTaskHistory(
      id,
      "deleted",
      existingTask,
      null,
      req.user?.email || req.headers["x-user-id"] || "system"
    );

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (err) {
    return handleError(err, res, "Delete task");
  }
};
