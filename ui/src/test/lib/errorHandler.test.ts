import { describe, it, expect } from "vitest";
import {
  parseConvexError,
  getUserFriendlyMessage,
  getErrorSeverity,
} from "../../lib/errorHandler";

describe("errorHandler", () => {
  describe("parseConvexError", () => {
    it("handles generic Error", () => {
      const error = new Error("Something went wrong");
      const result = parseConvexError(error);
      expect(result.message).toBe("Something went wrong");
      expect(result.code).toBe("UNKNOWN_ERROR");
    });

    it("handles network errors", () => {
      const error = new Error("network connection failed");
      const result = parseConvexError(error);
      expect(result.code).toBe("NETWORK_ERROR");
      expect(result.retryable).toBe(true);
    });

    it("handles unknown error", () => {
      const result = parseConvexError("string error");
      expect(result.message).toBe("An unexpected error occurred");
      expect(result.code).toBe("UNKNOWN_ERROR");
    });
  });

  describe("getUserFriendlyMessage", () => {
    it("returns friendly message for network errors", () => {
      const error = new Error("network failed");
      expect(getUserFriendlyMessage(error)).toContain("connect");
    });

    it("returns message for generic errors", () => {
      expect(getUserFriendlyMessage(new Error("Unknown"))).toBe("Unknown");
    });
  });

  describe("getErrorSeverity", () => {
    it("returns critical for 5xx (generic Error has statusCode 500)", () => {
      const error = new Error("Server error");
      expect(getErrorSeverity(error)).toBe("critical");
    });
  });
});
