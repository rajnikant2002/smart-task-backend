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

  // Also look for capitalized words that might be names (simple heuristic)
  const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
  capitalizedWords.forEach((word) => {
    // Skip common non-name words
    const skipWords = [
      "Schedule",
      "Meeting",
      "Task",
      "Today",
      "Tomorrow",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    if (!skipWords.includes(word) && word.length > 2) {
      // Check if it appears near name indicators
      const wordIndex = text.indexOf(word);
      const context = text
        .substring(Math.max(0, wordIndex - 20), wordIndex + word.length + 20)
        .toLowerCase();
      if (
        context.includes("with ") ||
        context.includes("by ") ||
        context.includes("assign")
      ) {
        if (!persons.includes(word)) {
          persons.push(word);
        }
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
  ];

  actionVerbList.forEach((verb) => {
    // Check for verb in various forms
    const verbPatterns = [
      new RegExp(`\\b${verb}\\w*\\b`, "gi"),
      new RegExp(`\\b${verb}ing\\b`, "gi"),
      new RegExp(`\\b${verb}ed\\b`, "gi"),
    ];

    verbPatterns.forEach((pattern) => {
      if (pattern.test(text)) {
        if (!actionVerbs.includes(verb)) {
          actionVerbs.push(verb);
        }
      }
    });
  });

  return actionVerbs;
}
