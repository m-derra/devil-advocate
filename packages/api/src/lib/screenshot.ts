import puppeteer from "puppeteer";

export interface CapturedScreenshots {
  desktop: string; // base64
  mobile: string; // base64
}

// Timeout wrapper to prevent hanging forever
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function captureScreenshots(
  url: string
): Promise<CapturedScreenshots> {
  // 60 second total timeout for screenshot capture
  return withTimeout(captureScreenshotsInternal(url), 60000, "Screenshot capture timed out");
}

async function captureScreenshotsInternal(
  url: string
): Promise<CapturedScreenshots> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });

  try {
    const page = await browser.newPage();

    // Set a reasonable timeout
    page.setDefaultTimeout(30000);

    // Capture desktop view
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: "networkidle2" });
    // Wait a bit for any animations/lazy loading
    await new Promise((r) => setTimeout(r, 1000));
    const desktopScreenshot = await page.screenshot({
      encoding: "base64",
      fullPage: false,
    });

    // Capture mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    const mobileScreenshot = await page.screenshot({
      encoding: "base64",
      fullPage: false,
    });

    return {
      desktop: desktopScreenshot as string,
      mobile: mobileScreenshot as string,
    };
  } finally {
    await browser.close();
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    // Block internal/private IPs (SSRF protection)
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^169\.254\./, // Link-local
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
      /\.local$/,
      /\.internal$/,
      /\.localhost$/,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        console.warn(`Blocked internal URL: ${hostname}`);
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
