import { expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { render } from "../../../test/render";
import { WebI18nContext } from "../../i18n/WebI18nContext";
import { translateWebMessage } from "../../i18n/messages";
import { SidebarProvider } from "../ui/sidebar";
import { SettingsSidebarNav } from "./SettingsSidebarNav";

vi.mock("./useAvailableSettingsSearchItems", () => ({
  useAvailableSettingsSearchItems: () => [
    { id: "app-language", title: "App language", to: "/settings/general" },
  ],
}));
vi.mock("../clerk/T3ConnectSidebarSignIn", () => ({
  T3ConnectSidebarSignIn: () => null,
  T3ConnectSidebarAvatar: () => null,
}));

function navigation(locale: "en" | "zh-CN") {
  return (
    <WebI18nContext
      value={{
        locale,
        appLocale: locale,
        setAppLocale: () => undefined,
        t: (key, values) => translateWebMessage(locale, key, values),
      }}
    >
      <SidebarProvider>
        <SettingsSidebarNav pathname="/settings/general" />
      </SidebarProvider>
    </WebI18nContext>
  );
}

it("switches the visible settings navigation and search to Chinese without changing route IDs", async () => {
  await page.viewport(1280, 900);
  await using screen = await render(navigation("en"), { router: "/settings/general" });
  await expect
    .element(screen.getByRole("treeitem", { name: "General", exact: true }))
    .toBeInTheDocument();

  await screen.rerender(navigation("zh-CN"));
  await expect
    .element(screen.getByRole("treeitem", { name: "常规", exact: true }))
    .toHaveAttribute("aria-selected", "true");
  await expect
    .element(screen.getByRole("treeitem", { name: "外观", exact: true }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("treeitem", { name: "差异与拉取请求", exact: true }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-settings-section="/settings/general"]'),
  ).not.toBeNull();
  const tree = screen.getByRole("tree").element();
  expect(tree.textContent).not.toMatch(/[A-Za-z]/);

  await userEvent.type(screen.getByRole("combobox", { name: "搜索设置" }), "应用语言");
  await expect.element(screen.getByRole("option", { name: /应用语言/ })).toBeInTheDocument();
});
