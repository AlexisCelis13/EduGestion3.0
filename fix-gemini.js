const fs = require('fs');
let content = fs.readFileSync('src/app/core/services/gemini.service.ts', 'utf8');

// The file has likely inconsistent formatting (newlines/spaces). Let's use simpler regexes that match key parts.
// We are looking for the 'try { const response = await fetch(...' block inside generateStudyPlan and refineStudyPlan

// Replace first occurrence (generateStudyPlan)
// We look for: contents: [ { role: 'user', parts: [{ text: prompt }] } ], generationConfig: { temperature: 0.4
content = content.replace(
    /try\s*\{\s*const response = await fetch\(\$\{this\.apiUrl\}\?key=\$\{this\.apiKey\}[^;]+temperature: 0\.4[^;]+?\)\);[\s\S]+?const textResponse = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text \|\| '';/g,
    "try { const textResponse = await this.callGeminiWithRetry([{ role: 'user', parts: [{ text: prompt }] }], 3, 15000, true);"
);

// Replace second occurrence (refineStudyPlan)
// We look for: contents: [ { role: 'user', parts: [{ text: prompt }] } ], generationConfig: { temperature: 0.3
content = content.replace(
    /try\s*\{\s*const response = await fetch\(\$\{this\.apiUrl\}\?key=\$\{this\.apiKey\}[^;]+temperature: 0\.3[^;]+?\)\);[\s\S]+?const textResponse = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text \|\| '';/g,
    "try { const textResponse = await this.callGeminiWithRetry([{ role: 'user', parts: [{ text: prompt }] }], 3, 15000, true);"
);

fs.writeFileSync('src/app/core/services/gemini.service.ts', content);
