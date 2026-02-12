import type { OutboundRegexRule } from "../config/types.messages.js";

/**
 * 将出站正则替换规则应用到回复文本上。
 * 按规则顺序依次执行 replace，无效正则模式会被跳过并打印警告。
 *
 * @param text - 待处理的回复文本
 * @param rules - 正则替换规则列表
 * @returns 替换后的文本
 */
export function applyOutboundRegex(
  text: string,
  rules: OutboundRegexRule[] | undefined,
): string {
  if (!rules?.length) {
    return text;
  }

  let result = text;
  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern, rule.flags ?? "g");
      result = result.replace(regex, rule.replacement);
    } catch (err) {
      // 无效的正则模式——跳过并警告
      console.warn(
        `[outbound-regex] 跳过无效正则规则 pattern=${JSON.stringify(rule.pattern)}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return result;
}
