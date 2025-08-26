import { Analytics as AnalyticsNode, type UserTraits } from "@segment/analytics-node";

import { log } from "@web3auth/no-modal";
// Import package.json for version info
const packageJson = require("../package.json");

const SEGMENT_WRITE_KEY = "f6LbNqCeVRf512ggdME4b6CyflhF1tsX";

export const SDK_TYPE = 'node'

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

  public async track(event: string, properties?: Record<string, any>) {
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
    const dappOrigin = window.location.origin;

    // skip if the protocol is not http or https
    if (dappOrigin.startsWith("http://")) {
      return true;
    }
    // skip if dapp contains localhost
    if (dappOrigin.includes("localhost")) {
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
  // Identity Token
  IDENTITY_TOKEN_STARTED: "Identity Token Started",
  IDENTITY_TOKEN_COMPLETED: "Identity Token Completed",
  IDENTITY_TOKEN_FAILED: "Identity Token Failed",
  // MFA
  MFA_ENABLEMENT_STARTED: "MFA Enablement Started",
  MFA_ENABLEMENT_COMPLETED: "MFA Enablement Completed",
  MFA_ENABLEMENT_FAILED: "MFA Enablement Failed",
  MFA_MANAGEMENT_SELECTED: "MFA Management Selected",
  MFA_MANAGEMENT_FAILED: "MFA Management Failed",
  // Login Modal
  LOGIN_MODAL_OPENED: "Login Modal Opened",
  LOGIN_MODAL_CLOSED: "Login Modal Closed",
  SOCIAL_LOGIN_SELECTED: "Social Login Selected",
  EXTERNAL_WALLET_SELECTED: "External Wallet Selected",
  EXTERNAL_WALLET_LIST_EXPANDED: "External Wallet List Expanded",
  // Wallet Plugin
  WALLET_UI_CLICKED: "Wallet UI Clicked",
  WALLET_CONNECT_SCANNER_CLICKED: "Wallet Connect Scanner Clicked",
  WALLET_CHECKOUT_CLICKED: "Wallet Checkout Clicked",
  WALLET_SWAP_CLICKED: "Wallet Swap Clicked",
};

export const ANALYTICS_INTEGRATION_TYPE = {
  REACT_HOOKS: "React Hooks",
  VUE_COMPOSABLES: "Vue Composables",
  NATIVE_SDK: "Native SDK",
};

export const ANALYTICS_SDK_TYPE = {
  WEB_NO_MODAL: "Web NoModal",
  WEB_MODAL: "Web Modal",
};
