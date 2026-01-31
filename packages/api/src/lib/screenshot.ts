import puppeteer from "puppeteer";

export interface CapturedScreenshots {
  desktop: string; // base64
  mobile: string; // base64
}

export async function captureScreenshots(
  url: string
): Promise<CapturedScreenshots> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
