export type Role = 'system' | 'user' | 'agent' | 'tool_result';

export interface ContextEntry {
  role: Role;
  content: string[];
}

export const emailValidationStream: ContextEntry[] = [
  {
    role: 'system',
    content: [
      'You are Claude Code, an AI coding assistant. You have access to these tools:',
      '- Read(file_path): Read a file',
      '- Edit(file_path, old_string, new_string): Edit a file',
      '- Bash(command): Run a shell command',
      '- Grep(pattern, path): Search for pattern in files',
      '[... more tool descriptions ...]',
    ],
  },
  {
    role: 'user',
    content: ['Add email validation to the registration endpoint'],
  },
  {
    role: 'agent',
    content: [
      '{ "type": "text", "text": "I\'ll search for the registration endpoint first." }',
      '{ "type": "tool_use", "id": "toolu_01A", "name": "Grep",',
      '  "input": { "pattern": "register", "glob": "**/*.ts" } }',
    ],
  },
  {
    role: 'tool_result',
    content: [
      '{ "tool_use_id": "toolu_01A" }',
      'Found in:',
      '- src/routes/auth.ts:12: router.post(\'/register\', userHandler.register)',
      '- src/handlers/user.ts:45: export async function register(req, res) {',
    ],
  },
  {
    role: 'agent',
    content: [
      '{ "type": "text", "text": "Found the endpoint. Let me read the handler." }',
      '{ "type": "tool_use", "id": "toolu_02B", "name": "Read",',
      '  "input": { "file_path": "src/handlers/user.ts" } }',
    ],
  },
  {
    role: 'tool_result',
    content: [
      '{ "tool_use_id": "toolu_02B" }',
      '[file contents — no email validation present]',
    ],
  },
  {
    role: 'agent',
    content: [
      '{ "type": "text", "text": "No validation present. Adding Zod schema." }',
      '{ "type": "tool_use", "id": "toolu_03C", "name": "Edit",',
      '  "input": {',
      '    "file_path": "src/handlers/user.ts",',
      '    "old_string": "export async function register(req, res) {\\n  ...",',
      '    "new_string": "const registerSchema = z.object({\\n  ..."',
      '  } }',
    ],
  },
  {
    role: 'tool_result',
    content: [
      '{ "tool_use_id": "toolu_03C" }',
      'Edit successful',
    ],
  },
  {
    role: 'agent',
    content: [
      '{ "type": "text", "text": "Validation added. Running tests to verify." }',
      '{ "type": "tool_use", "id": "toolu_04D", "name": "Bash",',
      '  "input": { "command": "npm test user.test.ts" } }',
    ],
  },
  {
    role: 'tool_result',
    content: [
      '{ "tool_use_id": "toolu_04D" }',
      'PASS src/handlers/user.test.ts',
      '  ✓ rejects invalid email (12ms)',
      '  ✓ rejects short password (8ms)',
    ],
  },
  {
    role: 'agent',
    content: [
      '{ "type": "text", "text": "Email validation successfully added to the registration endpoint." }',
    ],
  },
];
