import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type ReviewCommentsPlugin from "./main";
import { TYPES } from "./constants";
import {
  LanguageSetting,
  LOCALE_LABELS,
  StringKey,
  SUPPORTED_LOCALES,
} from "./i18n";

export interface ReviewCommentsSettings {
  authorName: string;
  dateFormat: "iso" | "japanese";
  language: LanguageSetting;
}

export const DEFAULT_SETTINGS: ReviewCommentsSettings = {
  authorName: "you",
  dateFormat: "iso",
  language: "auto",
};

export class ReviewCommentsSettingTab extends PluginSettingTab {
  plugin: ReviewCommentsPlugin;

  constructor(app: App, plugin: ReviewCommentsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    const t = (key: StringKey, vars?: Record<string, string>) =>
      this.plugin.i18n.t(key, vars);

    new Setting(containerEl)
      .setName(t("settings.authorName"))
      .setDesc(t("settings.authorNameDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.authorName)
          .onChange(async (value) => {
            this.plugin.settings.authorName = value || "you";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.dateFormat"))
      .addDropdown((dd) =>
        dd
          .addOption("iso", "2026-05-13")
          .addOption("japanese", "2026年05月13日")
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value: string) => {
            this.plugin.settings.dateFormat = value as "iso" | "japanese";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.language"))
      .setDesc(t("settings.languageDesc"))
      .addDropdown((dd) => {
        dd.addOption("auto", t("locale.auto"));
        for (const locale of SUPPORTED_LOCALES) {
          dd.addOption(locale, LOCALE_LABELS[locale]);
        }
        dd.setValue(this.plugin.settings.language).onChange(
          async (value: string) => {
            this.plugin.settings.language = value as LanguageSetting;
            await this.plugin.saveSettings();
            this.plugin.refreshLocale();
            new Notice(this.plugin.i18n.t("settings.languageReloadNotice"));
            this.display();
          }
        );
      });

    containerEl.createEl("h3", { text: t("settings.commentTypesHeading") });
    const list = containerEl.createEl("ul");
    for (const type of TYPES) {
      const li = list.createEl("li");
      const label = t(type.labelKey);
      li.textContent = t("settings.commentTypeItemTemplate", {
        icon: type.icon,
        label,
        tag: type.tag,
      });
    }

    containerEl.createEl("p", {
      text: t("settings.commentTypesDesc"),
      cls: "setting-item-description",
    });
  }
}
