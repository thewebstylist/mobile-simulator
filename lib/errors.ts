export function friendlyCaptureError(error: unknown) {
  const message = error instanceof Error ? error.message : "The website could not be captured.";
  if (/Executable doesn't exist|browser.*not found|Failed to launch/i.test(message)) {
    return "Chromium could not be started. Run `npx playwright install chromium`, then try again.";
  }
  if (/Timeout|timeout/i.test(message)) {
    return "The website took too long to load. Try a shorter delay or upload desktop and mobile screenshots instead.";
  }
  return message.includes("at ") && message.includes("/") ? "The website could not be captured. Try screenshot overrides instead." : message;
}
