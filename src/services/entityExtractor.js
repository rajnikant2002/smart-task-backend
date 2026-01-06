/**
 * Extract entities from task description
 * Extracts: dates/times, person names, action verbs
 */
export function extractEntities(description = "") {
  if (!description || typeof description !== "string") {
    return {
      dates: [],
      persons: [],
      action_verbs: [],
    };
  }

  const text = description.trim();

  // Extract dates/times
  const dates = extractDates(text);

  // Extract person names (after "with", "by", "assign to", "assigned to")
  const persons = extractPersons(text);

  // Extract action verbs
  const actionVerbs = extractActionVerbs(text);

  return {
    dates,
    persons,
    action_verbs: actionVerbs,
  };
}

/**
 * Extract dates and times from text
 */
function extractDates(text) {
  const dates = [];

  // Common date patterns
  const datePatterns = [
    /\b(today|tomorrow|yesterday)\b/gi,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY
    /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g, // MM-DD-YYYY
    /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi,
  ];

  // Time patterns
  const timePatterns = [
    /\b\d{1,2}:\d{2}\s*(am|pm)\b/gi,
    /\b\d{1,2}:\d{2}\b/g,
    /\b(morning|afternoon|evening|night|noon|midnight)\b/gi,
  ];

  datePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches.map((m) => m.trim()));
    }
  });

  timePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches.map((m) => m.trim()));
    }
  });

  // Remove duplicates
  return [...new Set(dates)];
}

/**
 * Extract person names from text
 * Looks for names after keywords like "with", "by", "assign to", etc.
 * Note: This is a fallback - assigned_to field takes priority in controller
 */
function extractPersons(text) {
  const persons = [];

  // Patterns to find person names
  const namePatterns = [
    /(?:with|by|assign to|assigned to|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /(?:meeting with|call with|discuss with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
  ];

  namePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      // Filter out common false positives
      if (
        !["Team", "Client", "Manager", "Department", "Group"].includes(name)
      ) {
        persons.push(name);
      }
    }
  });

  return [...new Set(persons)];
}

/**
 * Extract action verbs from text
 * Also extracts from person name patterns like "meet with", "call with", etc.
 */
function extractActionVerbs(text) {
  const actionVerbs = [];
  const lower = text.toLowerCase();

  // Common action verbs in task descriptions
  const actionVerbList = [
    "schedule",
    "meet",
    "call",
    "discuss",
    "review",
    "prepare",
    "complete",
    "finish",
    "submit",
    "send",
    "create",
    "update",
    "fix",
    "repair",
    "install",
    "implement",
    "deploy",
    "test",
    "verify",
    "approve",
    "reject",
    "analyze",
    "design",
    "develop",
    "write",
    "document",
    "present",
    "train",
    "organize",
    "coordinate",
    "check",
    "confirm",
    "notify",
    "inform",
    "report",
    "follow",
    "handle",
    "manage",
    "process",
    "execute",
    "perform",
    "conduct",
    "attend",
    "join",
    "participate",
    "assign",
    "allocate",
    "distribute",
    "share",
    "communicate",
  ];

  // First, extract action verbs from person name patterns
  // Patterns like "meet with John", "call with team", "discuss with manager"
  // Also "assign to", "assigned to", "created by"
  const personPatterns = [
    /\b(\w+)\s+with\s+/gi,
    /\b(\w+)\s+by\s+/gi,
    /\b(\w+)\s+to\s+/gi,
    /\b(\w+ing)\s+with\s+/gi,
  ];

  personPatterns.forEach((pattern) => {
    let match;
    // Reset regex lastIndex to avoid issues
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const verbCandidate = match[1].toLowerCase().trim();

      // Only check against known action verbs to avoid false positives
      for (const verb of actionVerbList) {
        const verbLower = verb.toLowerCase();

        // Check base form, -ing form, or -ed form
        if (
          verbCandidate === verbLower ||
          verbCandidate === `${verbLower}ing` ||
          verbCandidate === `${verbLower}ed`
        ) {
          if (!actionVerbs.includes(verbLower)) {
            actionVerbs.push(verbLower);
          }
          break; // Found match, no need to check other forms
        }
      }
    }
  });

  // Then, extract action verbs from general text patterns
  actionVerbList.forEach((verb) => {
    const verbLower = verb.toLowerCase();

    // Create regex patterns for different verb forms
    // Use word boundaries to match whole words only
    const patterns = [
      new RegExp(`\\b${verbLower}\\b`, "i"), // base form: "meet", "fix"
      new RegExp(`\\b${verbLower}ing\\b`, "i"), // -ing form: "meeting", "fixing"
      new RegExp(`\\b${verbLower}ed\\b`, "i"), // -ed form: "met", "fixed"
      new RegExp(`\\b${verbLower}s\\b`, "i"), // -s form: "meets", "fixes"
    ];

    // Check if any pattern matches
    const found = patterns.some((pattern) => pattern.test(lower));

    if (found && !actionVerbs.includes(verbLower)) {
      actionVerbs.push(verbLower);
    }
  });

  return actionVerbs;
}
