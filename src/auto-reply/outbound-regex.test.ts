import { describe, expect, it, vi } from "vitest";
import { applyOutboundRegex } from "./outbound-regex.js";

describe("applyOutboundRegex", () => {
  it("规则列表为空时不修改文本", () => {
    expect(applyOutboundRegex("hello world", [])).toBe("hello world");
  });

  it("规则列表为 undefined 时不修改文本", () => {
    expect(applyOutboundRegex("hello world", undefined)).toBe("hello world");
  });

  it("基本正则替换", () => {
    const result = applyOutboundRegex("hello world", [
      { pattern: "world", replacement: "OpenClaw" },
    ]);
    expect(result).toBe("hello OpenClaw");
  });

  it("默认使用 g 标志", () => {
    const result = applyOutboundRegex("aaa", [{ pattern: "a", replacement: "b" }]);
    expect(result).toBe("bbb");
  });

  it("自定义标志（不带 g 时只替换第一个）", () => {
    const result = applyOutboundRegex("aaa", [{ pattern: "a", replacement: "b", flags: "" }]);
    expect(result).toBe("baa");
  });

  it("去除 HTML 标签及内容", () => {
    const input = "正常内容<delete>这是要删除的内容</delete>保留的内容";
    const result = applyOutboundRegex(input, [
      { pattern: "<delete>[\\s\\S]*?</delete>", replacement: "", flags: "gi" },
    ]);
    expect(result).toBe("正常内容保留的内容");
  });

  it("去除多个 HTML 标签", () => {
    const input = "开始<delete>删1</delete>中间<delete>删2</delete>结尾";
    const result = applyOutboundRegex(input, [
      { pattern: "<delete>[\\s\\S]*?</delete>", replacement: "", flags: "gi" },
    ]);
    expect(result).toBe("开始中间结尾");
  });

  it("支持捕获组引用", () => {
    const result = applyOutboundRegex("hello world", [
      { pattern: "(hello) (world)", replacement: "$2 $1" },
    ]);
    expect(result).toBe("world hello");
  });

  it("多条规则按顺序执行", () => {
    const result = applyOutboundRegex("foo bar baz", [
      { pattern: "foo", replacement: "hello" },
      { pattern: "bar", replacement: "beautiful" },
      { pattern: "baz", replacement: "world" },
    ]);
    expect(result).toBe("hello beautiful world");
  });

  it("无效正则模式被跳过并发出警告", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = applyOutboundRegex("hello world", [
      { pattern: "[invalid", replacement: "x" },
    ]);
    expect(result).toBe("hello world");
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it("无效规则不影响后续规则执行", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = applyOutboundRegex("hello world", [
      { pattern: "[invalid", replacement: "x" },
      { pattern: "world", replacement: "OpenClaw" },
    ]);
    expect(result).toBe("hello OpenClaw");
    warnSpy.mockRestore();
  });

  it("大小写不敏感替换（带 i 标志）", () => {
    const result = applyOutboundRegex("<DELETE>content</DELETE>", [
      { pattern: "<delete>[\\s\\S]*?</delete>", replacement: "", flags: "gi" },
    ]);
    expect(result).toBe("");
  });
});
