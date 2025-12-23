import { supabase } from "../db/supabase.js";
import { classifyTask } from "../services/classifier.js";

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const { category, priority } = classifyTask(description || "");

    const { data, error } = await supabase
      .from("tasks")
      .insert([{ title, description, category, priority }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL TASKS
export const getTasks = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET TASK BY ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id.trim())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Task not found" });
      }
      console.error("Supabase getTaskById error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Get task by id failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE TASK
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    // Only allow known columns to avoid Supabase schema errors (e.g., "assignedTo")
    const allowedFields = [
      "title",
      "description",
      "category",
      "priority",
      "status",
      "assigned_to",
    ];

    const updates = Object.entries(body).reduce((acc, [key, value]) => {
      const normalizedKey = key === "assignedTo" ? "assigned_to" : key;
      if (allowedFields.includes(normalizedKey)) {
        acc[normalizedKey] = value;
      }
      return acc;
    }, {});

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided to update" });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id.trim())
      .select()
      .single();

    if (error) {
      // PGRST116 => no rows found with the filter
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Task not found" });
      }
      console.error("Supabase update error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Update task failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
