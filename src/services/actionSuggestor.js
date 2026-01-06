/**
 * Generate suggested actions based on task category
 */
export function getSuggestedActions(category) {
  const actionMap = {
    scheduling: [
      "Block calendar",
      "Send invite",
      "Prepare agenda",
      "Set reminder",
    ],
    finance: [
      "Check budget",
      "Get approval",
      "Generate invoice",
      "Update records",
    ],
    technical: [
      "Diagnose issue",
      "Check resources",
      "Assign technician",
      "Document fix",
    ],
    safety: [
      "Conduct inspection",
      "File report",
      "Notify supervisor",
      "Update checklist",
    ],
    general: [],
  };

  // Return actions for the category, or default to general
  return actionMap[category?.toLowerCase()] || actionMap.general;
}
