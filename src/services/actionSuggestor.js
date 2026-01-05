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
      "Confirm attendance",
      "Book meeting room",
    ],
    finance: [
      "Check budget",
      "Get approval",
      "Generate invoice",
      "Update records",
      "Review expenses",
      "Process payment",
    ],
    technical: [
      "Diagnose issue",
      "Check resources",
      "Assign technician",
      "Document fix",
      "Test solution",
      "Deploy update",
    ],
    safety: [
      "Conduct inspection",
      "File report",
      "Notify supervisor",
      "Update checklist",
      "Review compliance",
      "Schedule training",
    ],
    general: [
      "Review task",
      "Set deadline",
      "Assign owner",
      "Update status",
      "Add notes",
      "Follow up",
    ],
  };

  // Return actions for the category, or default to general
  return actionMap[category?.toLowerCase()] || actionMap.general;
}
