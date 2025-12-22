export function classifyTask(text = ""){
    const lower = text.toLowerCase();

    let category = "genral";
    if(lower.includes("meeting") || lower.includes("schedule")){
        category = "scheduling";
    }else if(lower.includes("budget") || lower.includes("invoice")){
        category = "finance";
    }else if(lower.includes("bug") || lower.includes("fix")){
        category = "technical";
    }

    let priority = "low";
    if(lower.includes("urgent") || lower.includes("today")){
        priority = "high";
    }else if(lower.includes("soon")){
        priority = "medium";
    }

    return {category,priority};
}