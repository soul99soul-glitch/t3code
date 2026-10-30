import { describe, expect, it } from "vite-plus/test";
import { translateWebMessage } from "../i18n/messages";

import {
  buildDraftActionMenuItems,
  buildThreadActionMenuItems,
  localizeSnoozePresetLabel,
  type ThreadActionMenuState,
} from "./threadActionMenu.logic";

const englishTranslate = (
  key: Parameters<typeof translateWebMessage>[1],
  values?: Parameters<typeof translateWebMessage>[2],
) => translateWebMessage("en", key, values);

const baseState: ThreadActionMenuState = {
  canOperate: true,
  branch: null,
  projectFilter: null,
  isPinned: false,
  isSettled: false,
  autoSettleEnabled: true,
  isSnoozed: false,
  canSnoozeNow: true,
  isRegeneratingTitle: false,
  isRunning: false,
  supports: {
    settlement: true,
    autoSettleOptOut: true,
    snooze: true,
    pinning: true,
    titleRegeneration: true,
  },
  snoozePresets: [
    {
      id: "after:60",
      label: "In 1 hour",
      whenLabel: "3:00 PM",
      snoozedUntil: "2026-08-07T15:00:00Z",
    },
  ],
};

describe("buildThreadActionMenuItems", () => {
  it("localizes nested actions while preserving IDs, permission flags and branch names", () => {
    const state = {
      ...baseState,
      branch: "feature/中文",
      projectFilter: { label: "AmberAgent", isActive: true },
      canTurnIntoProject: true,
    };
    const chinese = buildThreadActionMenuItems(state, (key, values) =>
      translateWebMessage("zh-CN", key, values),
    );
    const english = buildThreadActionMenuItems(state, englishTranslate);
    const withoutLabels = (items: typeof chinese): unknown =>
      items.map(({ label: _label, children, ...item }) => ({
        ...item,
        ...(children ? { children: withoutLabels(children) } : {}),
      }));
    expect(withoutLabels(chinese)).toEqual(withoutLabels(english));
    expect(chinese.find((item) => item.id === "new-thread-on-branch")?.label).toContain(
      "feature/中文",
    );
    expect(chinese.find((item) => item.id === "project-settings")?.label).toBe("项目设置");
    expect(
      chinese
        .find((item) => item.id === "snooze")
        ?.children?.find((item) => item.id === "snooze:custom")?.label,
    ).toBe("自定义…");
    expect(
      buildDraftActionMenuItems(
        { hasPath: false, hasBranch: true, hasProject: true },
        (key, values) => translateWebMessage("zh-CN", key, values),
      ).map((item) => item.label),
    ).toEqual(["复制", "项目设置", "丢弃草稿"]);
  });

  it.each([
    ["after:60", "In 1 hour", "1 小时后"],
    ["after:90", "In 90 minutes", "90 分钟后"],
    ["after:1440", "In 1 day", "1 天后"],
    ["at:today:09:00", "This morning", "今天上午"],
    ["at:tuesday:09:00", "Next Tuesday", "下星期二"],
  ])("localizes current snooze preset IDs (%s)", (id, label, expected) => {
    const preset = { id, label, whenLabel: "3:00 PM", snoozedUntil: "2099-01-01T15:00:00Z" };
    expect(
      localizeSnoozePresetLabel(preset, (key, values) => translateWebMessage("zh-CN", key, values)),
    ).toBe(expected);
    expect(localizeSnoozePresetLabel(preset, englishTranslate)).toBe(label);
  });

  it("localizes guest sharing without changing its capability gate", () => {
    const translate = (
      key: Parameters<typeof translateWebMessage>[1],
      values?: Parameters<typeof translateWebMessage>[2],
    ) => translateWebMessage("zh-CN", key, values);
    expect(
      buildThreadActionMenuItems(baseState, translate).some((item) => item.id === "share-guest"),
    ).toBe(false);
    const state = { ...baseState, canShareWithGuest: true };
    expect(
      buildThreadActionMenuItems(state, translate).find((item) => item.id === "share-guest")?.label,
    ).toBe("与访客共享");
    expect(
      buildThreadActionMenuItems(state, englishTranslate).find((item) => item.id === "share-guest")
        ?.label,
    ).toBe("Share with guest");
  });

  it("localizes snooze presets while preserving their formatted wake time", () => {
    const items = buildThreadActionMenuItems(baseState, (key, values) =>
      translateWebMessage("zh-CN", key, values),
    );
    const preset = items
      .find((item) => item.id === "snooze")
      ?.children?.find((item) => item.id === "snooze:after:60");
    expect(preset?.label).toBe(
      `${translateWebMessage("zh-CN", "sidebar.snooze.afterHour", { count: 1 })} (3:00 PM)`,
    );
    const englishItems = buildThreadActionMenuItems(baseState, englishTranslate);
    expect(
      englishItems
        .find((item) => item.id === "snooze")
        ?.children?.find((item) => item.id === "snooze:after:60")?.label,
    ).toBe("In 1 hour (3:00 PM)");
  });

  it.each([false, true])(
    "disables both lifecycle directions without permission (reversed: %s)",
    (reversed) => {
      const items = buildThreadActionMenuItems(
        {
          ...baseState,
          canOperate: false,
          isPinned: reversed,
          isSettled: reversed,
          isSnoozed: reversed,
        },
        englishTranslate,
      );
      const expected = reversed
        ? [
            "unpin",
            "unsettle",
            "unsnooze",
            "rename",
            "regenerate-title",
            "auto-settle",
            "archive",
            "delete",
          ]
        : [
            "pin",
            "settle",
            "snooze",
            "rename",
            "regenerate-title",
            "auto-settle",
            "archive",
            "delete",
          ];
      expect(items.filter((item) => item.disabled).map((item) => item.id)).toEqual(expected);
      expect(
        items.find((item) => item.id === "snooze")?.children?.every((child) => child.disabled) ??
          true,
      ).toBe(true);
    },
  );

  it("disables archive and turning into a project while the thread is running", () => {
    const items = buildThreadActionMenuItems(
      {
        ...baseState,
        isRunning: true,
        canTurnIntoProject: true,
      },
      englishTranslate,
    );
    expect(items.find((item) => item.id === "archive")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "turn-into-project")?.disabled).toBe(true);
  });
});
