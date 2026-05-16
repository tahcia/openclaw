# Tahcia for OpenClaw

Tahcia adds a browser automation layer to OpenClaw. It records Chrome workflows,
replays saved scripts, inspects visible elements, captures screenshots, and
supports direct browser or macOS control through a local MCP server and the
Tahcia Chrome extension.

Use Tahcia when a workflow needs a real browser, a logged-in tab, or a recorded
sequence that can pause for sensitive manual steps. For services with structured
OpenClaw plugins, prefer the structured plugin so the agent can call typed tools
instead of replaying browser clicks.

## Install

Clone this repository and install the OpenClaw plugin from the local checkout:

```bash
git clone https://github.com/tahcia/openclaw.git
cd openclaw
openclaw plugins install .
```

Load the Chrome extension from `tahcia-plugin/`:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `tahcia-plugin` folder.
5. Open [Tahcia Console](https://www.tahcia.com/console) and sign in.

Configure the Tahcia API key in OpenClaw:

```bash
openclaw config set plugins.entries.tahcia.config.apiKey "$TAHCIA_API_KEY"
```

Then start a fresh OpenClaw session and call `init` before using the other
Tahcia tools.

## What The Plugin Provides

- `init` starts a Tahcia session and returns the `sessionId`.
- `record`, `pause`, `resume`, `note`, and `stop` create reusable browser
  scripts.
- `run`, `continue`, `script_get`, and `script_update` replay and maintain saved
  scripts.
- `screenshot` and `elements` inspect the active tab.
- `navigate`, `js_click_at`, `js_scroll`, and `js_scroll_at` control pages from
  the browser context.
- `mac_mouse_click`, `mac_click_and_type`, `mac_key_enter`, and related
  `mac_system_*` tools cover macOS-level interaction when the browser context is
  not enough.

## Example: Pair Tahcia With TweetClaw

Tahcia is useful for browser-only workflows. For X/Twitter work, the same
OpenClaw agent can use [TweetClaw](https://github.com/Xquik-dev/tweetclaw) as a
separate structured plugin instead of recording fragile browser actions:

```bash
openclaw plugins install @xquik/tweetclaw
openclaw config set plugins.entries.tweetclaw.config.apiKey "$XQUIK_API_KEY"
openclaw config set tools.alsoAllow '["explore", "tweetclaw"]'
```

TweetClaw can scrape tweets, search tweets, search tweet replies, post tweets,
post tweet replies, run follower export, perform user lookup, handle media
upload and media download, send direct messages, monitor tweets, deliver
webhooks, and run giveaway draws through typed OpenClaw tools. A practical flow
is to use Tahcia for authenticated browser tasks around a product or dashboard,
then use TweetClaw for public X/Twitter monitoring, launch posts, replies, media
workflows, or giveaway draws with OpenClaw approval review.

Keep both API keys in local OpenClaw config or a secret manager. Do not record
API keys, passwords, payment steps, one-time codes, or private account material
inside Tahcia scripts. Review every visible X/Twitter action before approving it
in OpenClaw. The canonical TweetClaw install source is npm package
`@xquik/tweetclaw`; the
[ClawHub page](https://clawhub.ai/plugins/@xquik/tweetclaw) is useful for
browsing.

## Safety Notes

- Use `pause` before entering passwords, API keys, CAPTCHA answers, payment
  details, or other one-time secrets.
- Add a clear `note` before saving a script so future runs know the intended
  account, site, and constraints.
- Inspect scripts with `script_get` before changing recorded values.
- Prefer structured OpenClaw tools over browser replay when a maintained plugin
  exists for the service.
- Run browser workflows only with accounts and actions the user has approved.

## Links

- [Tahcia Console](https://www.tahcia.com/console)
- [Chrome extension setup](tahcia-plugin/README.md)
- [TweetClaw for OpenClaw X/Twitter automation](https://github.com/Xquik-dev/tweetclaw)
