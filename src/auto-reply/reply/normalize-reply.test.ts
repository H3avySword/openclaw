import { describe, expect, it } from "vitest";
import { SILENT_REPLY_TOKEN } from "../tokens.js";
import { normalizeReplyPayload } from "./normalize-reply.js";

// Keep channelData-only payloads so channel-specific replies survive normalization.
describe("normalizeReplyPayload", () => {
  it("keeps channelData-only replies", () => {
    const payload = {
      channelData: {
        line: {
          flexMessage: { type: "bubble" },
        },
      },
    };

    const normalized = normalizeReplyPayload(payload);

    expect(normalized).not.toBeNull();
    expect(normalized?.text).toBeUndefined();
    expect(normalized?.channelData).toEqual(payload.channelData);
  });

  it("records silent skips", () => {
    const reasons: string[] = [];
    const normalized = normalizeReplyPayload(
      { text: SILENT_REPLY_TOKEN },
      {
        onSkip: (reason) => reasons.push(reason),
      },
    );

    expect(normalized).toBeNull();
    expect(reasons).toEqual(["silent"]);
  });

  it("records empty skips", () => {
    const reasons: string[] = [];
    const normalized = normalizeReplyPayload(
      { text: "   " },
      {
        onSkip: (reason) => reasons.push(reason),
      },
    );

    expect(normalized).toBeNull();
    expect(reasons).toEqual(["empty"]);
  });

  it("applies outboundRegex rules to text", () => {
    const normalized = normalizeReplyPayload(
      { text: "正常内容<delete>删除内容</delete>保留" },
      {
        outboundRegex: [
          { pattern: "<delete>[\\s\\S]*?</delete>", replacement: "", flags: "gi" },
        ],
      },
    );
    expect(normalized?.text).toBe("正常内容保留");
  });

  it("applies multiple outboundRegex rules in order", () => {
    const normalized = normalizeReplyPayload(
      { text: "<delete>gone</delete> hello <hide>hidden</hide>" },
      {
        outboundRegex: [
          { pattern: "<delete>[\\s\\S]*?</delete>", replacement: "", flags: "gi" },
          { pattern: "<hide>[\\s\\S]*?</hide>", replacement: "[已隐藏]", flags: "gi" },
        ],
      },
    );
    expect(normalized?.text).toBe(" hello [已隐藏]");
  });

  it("skips as empty when outboundRegex strips all text", () => {
    const reasons: string[] = [];
    const normalized = normalizeReplyPayload(
      { text: "<delete>all content</delete>" },
      {
        outboundRegex: [
          { pattern: "<delete>[\\s\\S]*?</delete>", replacement: "", flags: "gi" },
        ],
        onSkip: (reason) => reasons.push(reason),
      },
    );
    expect(normalized).toBeNull();
    expect(reasons).toEqual(["empty"]);
  });
});
