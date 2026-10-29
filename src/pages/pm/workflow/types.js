export const DEFAULT_RULES = [
    {
        type: 'restrict',
        title: 'Restrict transition',
        description: 'Restrict who can execute this transition by role or team permissions.',
    },
    {
        type: 'request_input',
        title: 'Request input',
        description: 'Prompt users for required fields or resolution notes before moving.',
    },
    {
        type: 'validate',
        title: 'Validate details',
        description: 'Check task requirements, subtasks, or review approvals before moving.',
    },
    {
        type: 'perform_action',
        title: 'Perform actions',
        description: 'Automatically notify team members, update assignees, or trigger events.',
    },
];
