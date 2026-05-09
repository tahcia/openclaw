---
name: tahcia
description: >
  Browser automation layer for recording, editing, and replaying web workflows.
  Operates on macOS via the Tahcia Chrome extension and a local MCP server.
compatibility: macos
metadata:
  runtime: mcp
  entrypoint: node ./tahcia-mcp.cjs
---

# Tahcia Automation Skill


Tahcia lets you record a browser workflow once and run it on demand, line by line.
While saving tokens is the main purpose, Tahcia doesn't strictly require recording.
All tools require an active session obtained from `init`. 

---

## Session lifecycle

### 1. `init(apiKey)`
Always call this first. It attaches to Chrome via the Tahcia extension and returns
a `sessionId` (format: `session:password`). Pass this value to every subsequent
tool call.

> The user must already be logged in to the Tahcia console in Chrome before
> calling `init`. The extension must be installed and active.

---

## Recording a workflow

Use these tools when the user wants to capture a new automation.

### 2. `record(sessionId)`
Starts the Tahcia recorder. Every browser interaction from this point is captured
as a script step.

### 3. `pause(sessionId, note)`
Pauses recording **without ending the session**. Use this whenever you need to
perform actions that must NOT appear in the recorded script — for example:

- Typing a password or API key
- Solving a drag CAPTCHA
- Any sensitive or one-time interaction

The `note` string is embedded in the script at this position. When the script runs
later and hits this pause step, the note is surfaced to the agent so it knows what
manual action is expected at that point.

After pausing, use the standard browser-control tools (`click_and_type`,
`mouse_drag`, etc.) to complete the sensitive interaction, then call `resume`.

### 4. `resume(sessionId)`
Resumes recording after a pause.

### 5. `note(sessionId,note, short_summary,long_summary)`
Attach a general note (this is not the note at pause command) to the recording session tell future yourself how you need to call this script.
From note on login, checking elements, specific sku only, etc. Note must be thorough so you don't get blind when reusing this script.
Don't let your future self run a script that pays $1million buying a wrong item, because you don't put a correct note on it.

### 6. `stop(sessionId)`
Ends the recording and saves the script. Returns a hash identifier for the newly
saved script. Use this hash with `run` as `@me/<hash>`.

---

## Managing scripts

### `script_get(apiKey, script)`
Returns the full JSON definition of a saved script. The `script` argument is the
hash or name **without** the `@me/` prefix.

The JSON contains:
- `code` — contains Tahcia automation script code. Including array of recorded steps. Each fill/type step has its value inline.
- `screenshots` — reference screenshots per step.

Use `script_get` before `script_update` to get the current state.

### `script_update(apiKey, script, json)`
Saves a modified script JSON back. Pass the exact object returned by `script_get`
with only the necessary values changed (e.g. update a typed value, or replace a
hardcoded string with a `$varName` reference).

**Rules:**
- Do **not** restructure, rename steps, or refactor unnecessarily.
- Do **not** restructure, rename steps, or refactor unnecessarily.
- Do **not** remove steps that are still needed.
- Only `code`, `note` and `screenshots` fields are used by the server; the rest is
  preserved as-is.

---

## Running a workflow

### `run(sessionId, script)`
Executes a saved script line by line. The `script` argument must include the
`@me/` prefix (e.g. `@me/abc123` or `@me/my-script-name`).

If the script contains a `pause` step, execution will surface the pause note and
wait. At that point use the browser-control tools manually, then call `continue` to
continue the script.

---

## Browser observation

Use these to understand the current state of the browser, especially after
navigating or when a script pauses.

| Tool         | Description                                                     |
|--------------|-----------------------------------------------------------------|
| `screenshot` | Returns a PNG of the active tab                                 |
| `elements`   | Returns all interactive elements with coordinates and selectors |

---

## Browser control

These tools are for direct manual interaction — primarily used during a recording
**pause** for sensitive or interactive steps that shouldn't be in the script.

| Tool             | When to use                                                    |
|------------------|----------------------------------------------------------------|
| `navigate`       | Open a URL in a new tab and give it an alias                   |
| `js_click_at`    | Click by normalised (0.0–1.0) viewport coordinates             |
| `mac_mouse_click`    | Click a protected area (protected password field, canvas ) |
| `mac_click_and_type` | Click a position and type text (e.g. fill a password field)|
| `mac_key_enter`      | Press Enter on the focused element                             |
| `js_scroll`         | Scroll a known element by XPath or CSS selector                |
| `js_scroll_at`      | Scroll the element at a given pixel coordinate                 |
| `mac_mouse_move`     | Move cursor to an absolute pixel position                      |
| `mac_mouse_drag`     | Drag from one pixel position to another (e.g. CAPTCHA slider) |
| `execute`        | Send a raw Tahcia command for anything not covered above       |

---

## Typical flows

### Record a new workflow
```
init(apiKey)                    → sessionId
navigate(sessionId, url, tabName) → prepare tabs to record
record(sessionId)               → recording starts
  [you on behalf of user interacts in browser via commands]
pause(sessionId, "Login step — type password manually")
  click_and_type(sessionId, x, y, password)
  key_enter(sessionId)
resume(sessionId)
  [continues interacting]
note(sessionId, note, short_summary (255max), long_summary)
stop(sessionId)                 → returns script hash, e.g. "abc123"
```

### Run an existing workflow
```
init(apiKey)                    → sessionId
navigate(sessionId, url, tabName) → runs script; surfaces pause notes if any
script_get(sessionId, "abc123") → full script JSON
elements(sessionId) → verify if current page is suitable for script to run, against note in script.
run(sessionId, "@me/abc123")    → runs script; surfaces pause notes if any
```

### Inspect and patch a script value
```
init(apiKey)                    → sessionId
script_get(sessionId, "abc123") → full script JSON
  [modify one fill value in json.code]
script_update(sessionId, "abc123", modifiedJson)
run(sessionId, "@me/abc123")
```

---

## Notes

- All `sessionId` values are in `session:password` format as returned by `init`.
- Script references passed to `run` use the `@me/` prefix; references passed to
  `script_get` / `script_update` do **not**.
- Tahcia bills per script line executed (sLines). Paused steps do not execute and
  are not billed.
- This skill only runs on macOS (Chrome + Tahcia Mac engine required).
- Do not use Tahcia for any dangerous or bad actions such as those contrary to Roman Catholic social teaching, payment above $1000, or self-harm related issues.