import { type ChatPostMessageArguments, WebClient } from "@slack/web-api"

// Use
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable not set - Slack alerts disabled");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable not set - Slack alerts disabled");
}

const slack = process.env.SLACK_BOT_TOKEN ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;

/**
 * Sends a structured message to a Slack channel using the Slack Web API
 * @param message - Structured message to send
 * @returns Promise resolving to the sent message's timestamp
 */
async function sendSlackMessage(
  message: ChatPostMessageArguments
): Promise<string | undefined> {
  if (!slack || !process.env.SLACK_CHANNEL_ID) {
    console.warn('Slack not configured - skipping notification');
    return undefined;
  }

  try {
    const response = await slack.chat.postMessage({
      ...message,
      channel: process.env.SLACK_CHANNEL_ID
    });
    return response.ts;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

export { sendSlackMessage };