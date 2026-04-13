# Interview Questions Data

This folder contains interview question data that gets loaded into MongoDB.

## Adding Questions

### Quick Start

1. Add question JSON to `questions.json` (single object or array)
2. Run: `npm run seed`
3. Questions are imported into MongoDB

## Question Schema

```json
{
  "company": "Company Name",
  "title": "Problem Title",
  "description": "Detailed problem description",
  "difficulty": "Easy|Medium|Hard",
  "tags": ["tag1", "tag2"],
  "solution": "Python code for solution",
  "initialCode": "Starting template for IDE",
  "timeLimit": 900,
  "testCases": [
    {
      "id": 1,
      "input": "Input value or array",
      "expectedOutput": "Expected output",
      "description": "Test case description",
      "isHidden": true
    }
  ]
}
```

## Rules

- **testCases**: Must have 10-20 test cases
- **isHidden**: Set to `true` for interview-style (shown after submission)
- **input/expectedOutput**: Can be any JSON type (string, number, array, object)
- **initialCode**: Should have function signature with docstring (e.g., `def solution(arr):`)

## Example

See `questions.json` for a complete "Two Sum" example with 15 hidden test cases.

## Multiple Questions

You can add multiple questions as an array:

```json
[
  { "company": "Google", "title": "...", ... },
  { "company": "Facebook", "title": "...", ... }
]
```

## Best Practices

- 10-15 test cases recommended (covers: basic, edge cases, large inputs)
- Use descriptive test case descriptions
- Keep `initialCode` simple with helpful comments
- For interview mode: all `isHidden: true`
