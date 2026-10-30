import type { ContextMenuItem } from "@t3tools/contracts";
import type { SnoozePreset } from "@t3tools/client-runtime/state/thread-settled";

import type { WebTranslate } from "../i18n/WebI18nContext";

/**
 * Ids for the per-thread action menu. Snooze presets are dispatched as
 * `snooze:<presetId>` so the union stays closed while the preset list
 * remains data-driven.
 */
export type ThreadActionMenuId =
  | "new-thread-on-branch"
  | "filter-by-project"
  | "turn-into-project"
  | "project-settings"
  | "pin"
  | "unpin"
  | "settle"
  | "unsettle"
  | "auto-settle"
  | "auto-settle:enabled"
  | "auto-settle:disabled"
  | "snooze"
  | `snooze:${string}`
  | "unsnooze"
  | "rename"
  | "regenerate-title"
  | "mark-unread"
  | "share-guest"
  | "copy"
  | "copy-path"
  | "copy-branch"
  | "copy-thread"
  | "copy-thread-id"
  | "archive"
  | "delete";

export type DraftActionMenuId =
  | "copy"
  | "copy-path"
  | "copy-branch"
  | "project-settings"
  | "discard";

export function buildDraftActionMenuItems(
  options: {
    readonly hasPath: boolean;
    readonly hasBranch: boolean;
    readonly hasProject: boolean;
  },
  translate: WebTranslate,
): ReadonlyArray<ContextMenuItem<DraftActionMenuId>> {
  return [
    {
      id: "copy",
      label: translate("sidebar.action.copy"),
      icon: "copy",
      disabled: !options.hasPath && !options.hasBranch,
      children: [
        ...(options.hasPath
          ? [{ id: "copy-path" as const, label: translate("sidebar.action.path"), icon: "folder" }]
          : []),
        ...(options.hasBranch
          ? [
              {
                id: "copy-branch" as const,
                label: translate("sidebar.action.branch"),
                icon: "git-branch",
              },
            ]
          : []),
      ],
    },
    ...(options.hasProject
      ? [
          {
            id: "project-settings" as const,
            label: translate("sidebar.action.projectSettings"),
            icon: "settings",
          },
        ]
      : []),
    {
      id: "discard",
      label: translate("sidebar.discardDraft"),
      icon: "trash",
      destructive: true,
      separatorBefore: true,
    },
  ];
}

export interface ThreadActionMenuState {
  readonly canOperate: boolean;
  readonly branch: string | null;
  readonly projectFilter: {
    readonly label: string;
    readonly isActive: boolean;
  } | null;
  readonly isPinned: boolean;
  readonly isSettled: boolean;
  readonly autoSettleEnabled: boolean;
  readonly isSnoozed: boolean;
  readonly canSnoozeNow: boolean;
  readonly isRegeneratingTitle: boolean;
  /** Archive rejects attached providers, so disable it while running. */
  readonly isRunning: boolean;
  readonly supports: {
    readonly settlement: boolean;
    readonly autoSettleOptOut: boolean;
    readonly snooze: boolean;
    readonly pinning: boolean;
    readonly titleRegeneration: boolean;
  };
  readonly snoozePresets: ReadonlyArray<SnoozePreset>;
  /** Guest links need their own grant, so the caller checks it instead of `canOperate`. */
  readonly canShareWithGuest?: boolean;
  /** A No project thread with its own folder, on a server that can promote it. */
  readonly canTurnIntoProject?: boolean;
}

export function localizeSnoozePresetLabel(preset: SnoozePreset, t: WebTranslate): string {
  if (preset.id.startsWith("after:")) {
    const minutes = Number(preset.id.slice("after:".length));
    if (Number.isInteger(minutes) && minutes > 0) {
      return minutes % 1440 === 0
        ? t(minutes === 1440 ? "sidebar.snooze.afterDay" : "sidebar.snooze.afterDays", {
            count: minutes / 1440,
          })
        : minutes % 60 === 0
          ? t(minutes === 60 ? "sidebar.snooze.afterHour" : "sidebar.snooze.afterHours", {
              count: minutes / 60,
            })
          : t(minutes === 1 ? "sidebar.snooze.afterMinute" : "sidebar.snooze.afterMinutes", {
              count: minutes,
            });
    }
  }
  const calendarLabels: Readonly<Record<string, Parameters<WebTranslate>[0]>> = {
    "This morning": "sidebar.snooze.morning",
    "This afternoon": "sidebar.snooze.afternoon",
    "This evening": "sidebar.snooze.evening",
    Tomorrow: "sidebar.snooze.tomorrow",
    "Next week": "sidebar.snooze.nextWeek",
    Monday: "sidebar.snooze.monday",
    Tuesday: "sidebar.snooze.tuesday",
    Wednesday: "sidebar.snooze.wednesday",
    Thursday: "sidebar.snooze.thursday",
    Friday: "sidebar.snooze.friday",
    Saturday: "sidebar.snooze.saturday",
    Sunday: "sidebar.snooze.sunday",
  };
  const key = calendarLabels[preset.label];
  if (key) return t(key);
  const nextDay = preset.label.startsWith("Next ")
    ? calendarLabels[preset.label.slice(5)]
    : undefined;
  return nextDay ? t("sidebar.snooze.nextDay", { day: t(nextDay) }) : preset.label;
}

/** Local navigation, read markers, and copying remain available to read-only clients. */
export function threadActionRequiresOperate(action: ThreadActionMenuId): boolean {
  return ![
    "new-thread-on-branch",
    "project-settings",
    "mark-unread",
    "share-guest",
    "copy",
    "copy-path",
    "copy-branch",
    "copy-thread",
    "copy-thread-id",
  ].includes(action);
}

export function buildThreadActionMenuItems(
  state: ThreadActionMenuState,
  translate: WebTranslate,
): ReadonlyArray<ContextMenuItem<ThreadActionMenuId>> {
  const items: ReadonlyArray<ContextMenuItem<ThreadActionMenuId>> = [
    ...(state.branch
      ? [
          {
            id: "new-thread-on-branch" as const,
            label: translate("sidebar.action.newThreadOnBranch", {
              branch: state.branch,
            }),
            icon: "message-square-plus",
          },
        ]
      : []),
    ...(state.supports.pinning
      ? [
          state.isPinned
            ? {
                id: "unpin" as const,
                label: translate("sidebar.action.unpin"),
                icon: "pin-off",
              }
            : {
                id: "pin" as const,
                label: translate("sidebar.action.pin"),
                icon: "pin",
              },
        ]
      : []),
    ...(state.supports.settlement
      ? [
          state.isSettled
            ? {
                id: "unsettle" as const,
                label: translate("sidebar.action.unsettle"),
                icon: "circle-check",
              }
            : {
                id: "settle" as const,
                label: translate("sidebar.action.settle"),
                icon: "circle-check",
              },
        ]
      : []),
    ...(state.supports.snooze
      ? [
          state.isSnoozed
            ? {
                id: "unsnooze" as const,
                label: translate("sidebar.action.wake"),
                icon: "clock",
              }
            : {
                id: "snooze" as const,
                label: translate("sidebar.action.snooze"),
                icon: "clock",
                disabled: !state.canSnoozeNow,
                children: [
                  ...state.snoozePresets.map((preset) => ({
                    id: `snooze:${preset.id}` as const,
                    label: `${localizeSnoozePresetLabel(preset, translate)} (${preset.whenLabel})`,
                  })),
                  {
                    id: "snooze:custom" as const,
                    label: translate("sidebar.snooze.custom"),
                    separatorBefore: state.snoozePresets.length > 0,
                  },
                ],
              },
        ]
      : []),
    {
      id: "rename",
      label: translate("sidebar.action.rename"),
      icon: "pencil",
      separatorBefore: true,
    },
    ...(state.supports.titleRegeneration
      ? [
          {
            id: "regenerate-title" as const,
            label: state.isRegeneratingTitle
              ? translate("sidebar.action.regenerating")
              : translate("sidebar.action.regenerateTitle"),
            icon: "refresh-cw",
            disabled: state.isRegeneratingTitle,
          },
        ]
      : []),
    {
      id: "mark-unread",
      label: translate("sidebar.action.markUnread"),
      icon: "mail-open",
    },
    ...(state.canShareWithGuest
      ? [
          {
            id: "share-guest" as const,
            label: translate("sidebar.action.shareGuest"),
            icon: "user-plus",
          },
        ]
      : []),
    ...(state.projectFilter
      ? [
          {
            id: "filter-by-project" as const,
            label: state.projectFilter.isActive
              ? translate("upstream.sidebar.allProjects")
              : translate("upstream.sidebar.projectFilter", {
                  project: state.projectFilter.label,
                }),
            icon: "folder-tree",
          },
        ]
      : []),
    ...(state.canTurnIntoProject
      ? [
          {
            id: "turn-into-project" as const,
            label: translate("sidebar.action.turnIntoProject"),
            icon: "folder-plus",
            disabled: state.isRunning,
          },
        ]
      : []),
    ...(state.supports.autoSettleOptOut
      ? [
          {
            id: "auto-settle" as const,
            label: translate("upstream.sidebar.autoSettle"),
            icon: "timer",
            children: [
              {
                id: "auto-settle:enabled" as const,
                label: translate("upstream.sidebar.enabled"),
                checked: state.autoSettleEnabled,
              },
              {
                id: "auto-settle:disabled" as const,
                label: translate("upstream.sidebar.disabled"),
                checked: !state.autoSettleEnabled,
              },
            ],
          },
        ]
      : []),
    {
      id: "copy",
      label: translate("sidebar.action.copy"),
      icon: "copy",
      separatorBefore: true,
      children: [
        { id: "copy-path", label: translate("sidebar.action.path"), icon: "folder" },
        ...(state.branch
          ? [
              {
                id: "copy-branch" as const,
                label: translate("sidebar.action.branch"),
                icon: "git-branch",
              },
            ]
          : []),
        {
          id: "copy-thread",
          label: translate("sidebar.action.thread"),
          icon: "message-square",
        },
        {
          id: "copy-thread-id",
          label: translate("sidebar.action.threadId"),
          icon: "hash",
        },
      ],
    },
    {
      id: "project-settings",
      label: translate("sidebar.action.projectSettings"),
      icon: "settings",
    },
    {
      id: "archive",
      label: translate("sidebar.action.archive"),
      icon: "archive",
      disabled: state.isRunning,
      separatorBefore: true,
    },
    {
      id: "delete",
      label: translate("common.delete"),
      destructive: true,
      icon: "trash",
    },
  ];
  return state.canOperate
    ? items
    : items.map((item) =>
        threadActionRequiresOperate(item.id)
          ? {
              ...item,
              disabled: true,
              ...(item.children
                ? { children: item.children.map((child) => ({ ...child, disabled: true })) }
                : {}),
            }
          : item,
      );
}
