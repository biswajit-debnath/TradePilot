# AI Commit Message Generator Instructions

## How to Use This File

Simply say to your AI assistant:

```
"Give me a commit message" or "Check staged changes and create a proper commit message"
```

Then share this instruction file with the AI. The AI will automatically:

1. Check your staged git changes
2. Analyze the diffs
3. Generate a properly formatted commit message following the template below

---

## INSTRUCTIONS FOR AI ASSISTANT

When the user requests a commit message and provides this instruction file, follow these steps:

### Step 1: Check Staged Changes

Run the git command to check staged changes in the repository and analyze the diffs.

### Step 2: Analyze the Changes

Understand:

- What files were modified, added, or removed
- What functionality was added/changed/removed
- Why these changes were made (infer from code context)
- Technical implementation details

### Step 3: Generate Commit Message

Create a commit message following this EXACT format:

**FORMAT:**

<type>: <short summary of main changes>

This commit introduces/fixes/updates/refactors [brief description of what was changed and why].

Files changed:

- path/to/file1: Brief description of changes
- path/to/file2: Brief description of changes
- path/to/file3 (new): Description of new file
- path/to/file4 (removed): Why it was removed

Key Features/Changes:
• [Feature/change 1]
• [Feature/change 2]
• [Feature/change 3]

Technical Improvements:
• [Technical improvement 1]
• [Technical improvement 2]
• [Technical improvement 3]

**COMMIT TYPES:**

- feat: New feature for the user
- fix: Bug fix
- docs: Documentation changes
- style: Formatting, whitespace changes
- refactor: Code restructuring without changing functionality
- perf: Performance improvements
- test: Adding or updating tests
- chore: Build process, dependencies, tooling
- ci: CI/CD configuration changes

**RULES:**

1. First line (type + summary) should be under 72 characters
2. Use present tense ("add" not "added")
3. Include all modified files with brief descriptions inline
4. Use bullet points (•) for features and improvements
5. Mark new files with (new) and removed files with (removed)
6. Be specific and technical but concise
7. Include the "why" not just the "what"
8. Group related changes together
9. If there are breaking changes, add a "Breaking Changes:" section
10. If multiple unrelated features, mention them all in the heading

**EXAMPLE:**

feat: implement region-based content filtering and WhatsApp support integration

This commit introduces a comprehensive region context system that enables
dynamic content filtering based on user's selected region (India or International),
along with WhatsApp support integration for transaction assistance.

Files changed:

- context/RegionContext.tsx (new): Core region context with URL-based state management
- app/layout.tsx: Wrap application with RegionProvider
- app/\_components/navbar.tsx: Add region selector and filter navigation links by region
- app/\_components/home/hero.tsx: Display region-specific hero content and CTAs
- app/\_components/home/gameCards.tsx: Filter game cards based on region visibility
- app/transaction-status/page.tsx: Add WhatsApp support button with transaction ID

Key Features:
• Region selector in navigation (desktop & mobile)
• URL-based region state persistence (?region=IND|INT)
• Hydration-safe implementation to prevent SSR/client mismatches
• Configuration-driven content visibility
• Dynamic filtering of navigation links, hero sections, and game cards
• WhatsApp support integration with pre-filled transaction details

Technical Improvements:
• Eliminated hardcoded region logic in favor of declarative configuration
• Reduced code duplication in navbar and game cards components
• Improved maintainability with centralized region-based content control
• Added isHydrated flag to prevent hydration mismatches
• Mobile-responsive WhatsApp support (wa.me for mobile, web.whatsapp.com for desktop)

### Step 4: Present the Commit Message

Provide the commit message in a clean, copy-ready format that the user can directly use for their commit.

---

## COMMIT MESSAGE FORMAT SPECIFICATION

### Structure Template:

```
<type>: <short summary of main changes>

This commit introduces/fixes/updates/refactors [brief description of what was changed and why].

Files changed:
- path/to/file1: Brief description of changes
- path/to/file2: Brief description of changes
- path/to/file3 (new): Description of new file
- path/to/file4 (removed): Why it was removed

Key Features/Changes:
• [Feature/change 1]
• [Feature/change 2]
• [Feature/change 3]

Technical Improvements:
• [Technical improvement 1]
• [Technical improvement 2]
• [Technical improvement 3]
```

### Formatting Rules:

1. **First line (type + summary)**: Under 72 characters, present tense
2. **Description paragraph**: Explain what and why, not just what
3. **Files changed section**: Every modified file listed with inline description
4. **Key Features section**: User-facing changes and features (use • bullet points)
5. **Technical Improvements section**: Developer-facing technical details (use • bullet points)
6. **Optional sections**: Add if applicable:
   - Breaking Changes: If changes break existing functionality
   - Migration Guide: If users need to update their code
   - Related Issues: Link to issue numbers (Closes #123, Fixes #456)

### Commit Types:

- **feat**: New feature for the user
- **fix**: Bug fix
- **docs**: Documentation changes only
- **style**: Formatting, whitespace, missing semicolons
- **refactor**: Code restructuring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD configuration changes

### Writing Guidelines:

✅ **DO:**

- Use present tense ("add" not "added")
- Be specific and descriptive
- List ALL modified files with brief descriptions inline
- Include technical context for developers
- Explain the "why" behind changes
- Use bullet points for clarity
- Mark new files with (new) and removed files with (removed)
- Group related changes together
- If multiple unrelated features, mention them all in heading

❌ **DON'T:**

- Use vague messages like "fix bugs" or "update code"
- Omit important context about the changes
- Make the summary too long
- Use past tense
- Skip file descriptions

---

## USAGE EXAMPLES FOR USER

### How Users Will Interact:

**User says:**

> "Give me a commit message"

or

> "Check staged changes and create a proper commit message"

**You (AI) should:**

1. Check the staged git changes using available tools
2. Analyze all the diffs
3. Generate a commit message following the format above
4. Present it in a clean, ready-to-copy format

---

## EXAMPLE OUTPUT

Here's an example of what your output should look like:

### User Request:

> "Give me a commit message"

### Your Response:

```
I'll check the staged changes and generate a commit message for you.

[After checking staged changes...]

Here's your commit message:

```

feat: implement region-based content filtering and WhatsApp support integration

This commit introduces a comprehensive region context system that enables
dynamic content filtering based on user's selected region (India or International),
along with WhatsApp support integration for transaction assistance.

Files changed:

- context/RegionContext.tsx (new): Core region context with URL-based state management
- app/layout.tsx: Wrap application with RegionProvider
- app/\_components/navbar.tsx: Add region selector and filter navigation links by region
- app/\_components/home/hero.tsx: Display region-specific hero content and CTAs
- app/\_components/home/gameCards.tsx: Filter game cards based on region visibility
- app/transaction-status/page.tsx: Add WhatsApp support button with transaction ID

Key Features:
• Region selector in navigation (desktop & mobile)
• URL-based region state persistence (?region=IND|INT)
• Hydration-safe implementation to prevent SSR/client mismatches
• Configuration-driven content visibility
• Dynamic filtering of navigation links, hero sections, and game cards
• WhatsApp support integration with pre-filled transaction details

Technical Improvements:
• Eliminated hardcoded region logic in favor of declarative configuration
• Reduced code duplication in navbar and game cards components
• Improved maintainability with centralized region-based content control
• Added isHydrated flag to prevent hydration mismatches
• Mobile-responsive WhatsApp support (wa.me for mobile, web.whatsapp.com for desktop)

```

```

---

## QUICK USAGE FOR USER

### Option 1: Quick Command (Simplest)

Just say:

```
Give me a commit message
```

### Option 2: Full Command (Most Complete)

Say:

```
Check the staged changes and create a proper commit message based on the changes along with files inline with the message
```

### Option 3: With This File Attached

If your AI assistant supports file attachments:

1. Simply say: "Give me a commit message"
2. Attach this file (`AI_COMMIT_MESSAGE_PROMPT.md`)
3. The AI will follow all the instructions above automatically

**The AI will automatically:**

- Check your staged changes using git tools
- Analyze the code diffs
- Generate the commit message following the format
- Present it in a ready-to-use format

---

## NOTES FOR AI ASSISTANT

When a user provides this instruction file and requests a commit message:

**You MUST:**

- ✅ Automatically check staged changes first (don't ask the user to provide diffs)
- ✅ Be thorough - List every file changed with meaningful descriptions
- ✅ Be technical - Include implementation details in "Technical Improvements"
- ✅ Be clear - Make the commit message understandable to other developers
- ✅ Follow the format exactly - Don't deviate from the template structure
- ✅ Use present tense - "add" not "added", "implement" not "implemented"
- ✅ Be specific in file descriptions - "Add region selector component" not "Update navbar"
- ✅ Group related changes - If 5 files changed for one feature, say that in the heading
- ✅ Infer the why - Look at the code changes to understand the purpose
- ✅ Include all features in heading - If there are multiple unrelated features, mention them all

**You MUST NOT:**

- ❌ Ask the user to provide git diffs (check them yourself)
- ❌ Use vague descriptions
- ❌ Skip any modified files
- ❌ Omit technical context
- ❌ Use past tense

---

## TROUBLESHOOTING

### If AI asks for git diff:

Remind: "Please check the staged changes automatically using your available git tools. Don't ask me to provide the diff."

### If format is wrong:

Say: "Please follow the exact format specified in AI_COMMIT_MESSAGE_PROMPT.md"

### If too brief:

Say: "Make it more detailed with technical context for each file"

### If too verbose:

Say: "Make it more concise while keeping all key information"

### If files are missing:

Say: "List all modified files with descriptions inline"

---

## 📁 Related Files

- **`.gitmessage`** - Manual git commit template for direct git commits
- **`COMMIT_MESSAGE_GUIDE.md`** - Detailed guide for manual commit messages
- **`AI_COMMIT_MESSAGE_PROMPT.md`** (this file) - Instructions for AI-assisted commit messages

---

## Summary

This instruction file enables you to simply say **"Give me a commit message"** and get a properly formatted, detailed commit message automatically. No need to copy diffs or provide additional context - the AI will handle everything!
