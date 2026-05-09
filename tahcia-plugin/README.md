# Tahcia Plugin — Chrome Extension

Connect your browser tabs to [Tahcia Console](https://www.tahcia.com/console) for remote monitoring and automation.

---

## Installation

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked** and select this folder

---

## Getting Started

1. Click the Tahcia icon in your toolbar
2. Click **Open Console** — the plugin will open `tahcia.com/console` and wait for you to log in
3. Once logged in, your session is detected automatically
4. Navigate to any tab you want to control (e.g. Stripe, Adobe, your app) MacCtrl+0 or open the popup plugin again, and click **+ This Tab**
5. That tab's ID and URL are registered and sent to the Console


---

## Privacy

This extension only communicates with `tahcia.com` and `api.tahcia.com`. It does collect or transmit any data to third parties, such as LLM provider, analytics. Don't use it with Tab that contains sensitive info. Tab content is only read or modified when explicitly commanded via the Console.

