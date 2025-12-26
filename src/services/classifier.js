export function classifyTask(text = "") {
  // Handle null, undefined, or non-string inputs
  if (text === null || text === undefined) {
    text = "";
  }
  const lower = String(text).toLowerCase();

  // Category classification with safety category
  let category = "general";
  if (
    lower.includes("meeting") ||
    lower.includes("schedule") ||
    lower.includes("call") ||
    lower.includes("appointment") ||
    lower.includes("deadline")
  ) {
    category = "scheduling";
  } else if (
    lower.includes("budget") ||
    lower.includes("invoice") ||
    lower.includes("payment") ||
    lower.includes("bill") ||
    lower.includes("cost") ||
    lower.includes("expense")
  ) {
    category = "finance";
  } else if (
    lower.includes("bug") ||
    lower.includes("fix") ||
    lower.includes("error") ||
    lower.includes("install") ||
    lower.includes("repair") ||
    lower.includes("maintain")
  ) {
    category = "technical";
  } else if (
    lower.includes("safety") ||
    lower.includes("hazard") ||
    lower.includes("inspection") ||
    lower.includes("compliance") ||
    lower.includes("ppe")
  ) {
    category = "safety";
  }

  // Priority classification
  let priority = "low";
  if (
    lower.includes("urgent") ||
    lower.includes("asap") ||
    lower.includes("immediately") ||
    lower.includes("today") ||
    lower.includes("critical") ||
    lower.includes("emergency")
  ) {
    priority = "high";
  } else if (
    lower.includes("soon") ||
    lower.includes("this week") ||
    lower.includes("important")
  ) {
    priority = "medium";
  }

  return { category, priority };
}
