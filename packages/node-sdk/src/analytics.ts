import { Analytics as AnalyticsNode, type UserTraits } from "@segment/analytics-node";
import { log } from "@web3auth/no-modal";
// Import package.json for version info
// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJson = require("../package.json");

const SEGMENT_WRITE_KEY = "f6LbNqCeVRf512ggdME4b6CyflhF1tsX";

export const SDK_TYPE = "node";

export const SDK_VERSION = packageJson.version;

export class SegmentAnalytics {
  private segment: AnalyticsNode;

  private globalProperties: Record<string, unknown> = {};

  private enabled: boolean = true;

  private userId: string | null = null;

  public init(): void {
    if (this.isSkipped()) {
      return;
    }
    if (this.segment) {
      throw new Error("Analytics already initialized");
    }

    this.segment = new AnalyticsNode({ writeKey: SEGMENT_WRITE_KEY });
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public setGlobalProperties(properties: Record<string, unknown>) {
    this.globalProperties = { ...this.globalProperties, ...properties };
  }

  public async identify(userId: string, traits?: UserTraits) {
    if (!this.enabled) return;
    if (this.isSkipped()) return;
    try {
      this.userId = userId;
      return this.getSegment().identify({ userId, traits });
    } catch (error) {
      log.error(`Failed to identify user ${userId} in analytics`, error);
    }
  }

  public async track(event: string, properties?: Record<string, unknown>) {
    if (!this.enabled) return;
    if (this.isSkipped()) return;
    try {
      return this.getSegment().track({ userId: this.userId, event, properties: { ...properties, ...this.globalProperties } });
    } catch (error) {
      log.error(`Failed to track event ${event}`, error);
    }
  }

  private getSegment() {
    if (!this.segment) {
      log.error("Analytics not initialized. Call Analytics.init() first.");
      throw new Error("Analytics not initialized. Call Analytics.init() first.");
    }
    return this.segment;
  }

  private isSkipped() {
    // skip if the environment is not production
    if (process.env.NODE_ENV !== "production") {
      return true;
    }

    return false;
  }
}

export const ANALYTICS_EVENTS = {
  // SDK Initialization
  SDK_INITIALIZATION_COMPLETED: "SDK Initialization Completed",
  SDK_INITIALIZATION_FAILED: "SDK Initialization Failed",
  // Connection
  CONNECTION_STARTED: "Connection Started",
  CONNECTION_COMPLETED: "Connection Completed",
  CONNECTION_FAILED: "Connection Failed",
};
