/**
 * Extract entities from task description
 * Extracts: dates/times, person names, locations, action verbs
 */
export function extractEntities(description = "") {
  if (!description || typeof description !== "string") {
    return {
      dates: [],
      persons: [],
      locations: [],
      action_verbs: [],
    };
  }

  const text = description.trim();
  const lower = text.toLowerCase();

  // Extract dates/times
  const dates = extractDates(text);

  // Extract person names (after "with", "by", "assign to", "assigned to")
  const persons = extractPersons(text);

  // Extract locations (common location indicators)
  const locations = extractLocations(text);

  // Extract action verbs
  const actionVerbs = extractActionVerbs(text);

  return {
    dates,
    persons,
    locations,
    action_verbs: actionVerbs,
  };
}

/**
 * Extract dates and times from text
 */
function extractDates(text) {
  const dates = [];
  const lower = text.toLowerCase();

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
  const lower = text.toLowerCase();

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
 * Extract location references from text
 */
function extractLocations(text) {
  const locations = [];
  const lower = text.toLowerCase();

  // Common location indicators
  const locationKeywords = [
    "at",
    "in",
    "on",
    "room",
    "office",
    "building",
    "location",
    "venue",
    "place",
  ];

  // Look for capitalized words after location keywords
  const locationPattern = new RegExp(
    `(?:${locationKeywords.join("|")})\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`,
    "gi"
  );

  let match;
  while ((match = locationPattern.exec(text)) !== null) {
    locations.push(match[1].trim());
  }

  // Common location words
  const commonLocations = [
    "conference room",
    "meeting room",
    "office",
    "headquarters",
    "site",
    "location",
  ];

  commonLocations.forEach((loc) => {
    if (lower.includes(loc)) {
      locations.push(loc);
    }
  });

  return [...new Set(locations)];
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
    {
      pattern: /\b(\w+)\s+with\s+/gi,
      description: "verb with person",
    },
    {
      pattern: /\b(\w+)\s+by\s+/gi,
      description: "verb by person",
    },
    {
      pattern: /\b(\w+)\s+to\s+/gi,
      description: "verb to person",
    },
    {
      pattern: /\b(\w+ing)\s+with\s+/gi,
      description: "verb-ing with person",
    },
  ];

  personPatterns.forEach(({ pattern }) => {
    let match;
    // Reset regex lastIndex to avoid issues
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const verbCandidate = match[1].toLowerCase().trim();

      // Only check against known action verbs to avoid false positives
      actionVerbList.forEach((verb) => {
        const verbLower = verb.toLowerCase();

        // Check base form
        if (verbCandidate === verbLower) {
          if (!actionVerbs.includes(verbLower)) {
            actionVerbs.push(verbLower);
          }
        }

        // Check -ing form
        if (verbCandidate === `${verbLower}ing`) {
          if (!actionVerbs.includes(verbLower)) {
            actionVerbs.push(verbLower);
          }
        }

        // Check -ed form (for "assigned to", "created by")
        if (verbCandidate === `${verbLower}ed`) {
          if (!actionVerbs.includes(verbLower)) {
            actionVerbs.push(verbLower);
          }
        }
      });
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
