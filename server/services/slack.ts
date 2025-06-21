import { type ChatPostMessageArguments, WebClient } from "@slack/web-api"

// Use
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable not set - Slack alerts disabled");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable not set - using default channel");
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Sends a structured message to a Slack channel using the Slack Web API
 * Prefer using Channel ID to Channel names because they don't change when the
 * channel is renamed.
 * @param message - Structured message to send
 * @returns Promise resolving to the sent message's timestamp
 */
async function sendSlackMessage(
  message: ChatPostMessageArguments
): Promise<string | undefined> {
  try {
    if (!process.env.SLACK_BOT_TOKEN) {
      console.warn("Slack alerts disabled - no bot token configured");
      return undefined;
    }

    // Send the message
    const response = await slack.chat.postMessage(message);

    // Return the timestamp of the sent message
    return response.ts;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

export { sendSlackMessage };