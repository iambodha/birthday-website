# Private Birthday Content Configuration

This document explains how to customize the birthday website with your own content using the `private-birthday-content.json` file.

## File Location
Place your customized content in: `public/private-birthday-content.json`

## Configuration Fields

### Top-Level Fields

- **`isPublic`** (boolean)
  - Set to `false` to use your customized private content
  - Set to `true` to use default public content for testing
  - When `true`, all other customizations are ignored

- **`name`** (string)
  - The birthday person's name
  - Used throughout the website

- **`title`** (string)
  - The main heading displayed on the happy birthday page
  - Example: "Happy Birthday BHUVI!"

- **`messages`** (array of strings)
  - Personal messages that cycle through on the celebration page
  - At least 1 message required
  - They will display one by one in a carousel effect

### puzzleTwo Object

The second puzzle page contains interactive questions and a crossword.

#### puzzleTwo Fields

- **`petName`** (string)
  - A nickname for the birthday person
  - Used in puzzle instructions

- **`roughQuestions`** (array)
  - List of questions with answers
  - Each question object has:
    - `question` (string): The question to ask
    - `answer` (string): The answer (will be converted to uppercase)
  - At least 10 questions are recommended for variety

#### crosswordClues

The crossword puzzle has two directions:

- **`across`** (array): Horizontal clues (typically 6 clues)
- **`down`** (array): Vertical clues (typically 7 clues)

Each clue object must have:
- `number` (integer): The clue number on the crossword
- `clue` (string): The question or hint
- `answer` (string): The correct answer (uppercase)

Required clue numbers:
- **Across**: 1, 2, 5, 6, 8, 9
- **Down**: 3, 4, 7, 10, 11, 12, 13

## Audio Files Used

- **Private Mode** (`isPublic: false`):
  - Main track: `/Cats_Happy_Birthday.mp3`
  - Singing track: `/Singing.mp3`

- **Public Mode** (`isPublic: true`):
  - Main track: `/Public_Birthday_Song.mp3`

Both modes fade out smoothly over the final 3 seconds.

## Quick Start

1. Copy `EXAMPLE-private-birthday-content.json` to reference the structure
2. Edit `private-birthday-content.json` with your customizations
3. Set `"isPublic": false` to enable your content
4. Test by visiting the website

## Tips

- All answers in puzzles are case-insensitive (converted to uppercase)
- Keep answers to 1-3 words for best crossword fit
- The carousel will loop through your messages continuously
- Change `isPublic` to `true` anytime to see the default public version

## Example

See `EXAMPLE-private-birthday-content.json` for a complete example with all fields filled in.
