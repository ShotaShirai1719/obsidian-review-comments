import { App, Modal } from "obsidian";
import { I18n } from "./i18n";

export class CommentInputModal extends Modal {
  private readonly i18n: I18n;
  private readonly typeLabel: string;
  private readonly onSubmit: (body: string) => void;

  constructor(
    app: App,
    i18n: I18n,
    typeLabel: string,
    onSubmit: (body: string) => void
  ) {
    super(app);
    this.i18n = i18n;
    this.typeLabel = typeLabel;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("review-comment-modal");
    this.setTitle(
      this.i18n.t("modal.titleTemplate", { type: this.typeLabel })
    );

    contentEl.createEl("p", {
      text: this.i18n.t("modal.help"),
      cls: "review-comment-modal-help",
    });

    const textarea = contentEl.createEl("textarea", {
      cls: "review-comment-modal-textarea",
    });
    textarea.placeholder = this.i18n.t("modal.placeholder");

    const actions = contentEl.createDiv({
      cls: "review-comment-modal-actions",
    });
    const cancelBtn = actions.createEl("button", {
      text: this.i18n.t("modal.cancel"),
      cls: "mod-muted",
    });
    const submitBtn = actions.createEl("button", {
      text: this.i18n.t("modal.addComment"),
      cls: "mod-cta",
    });

    cancelBtn.addEventListener("click", () => this.close());
    submitBtn.addEventListener("click", () => this.submit(textarea.value));
    textarea.addEventListener("keydown", (evt: KeyboardEvent) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key === "Enter") {
        evt.preventDefault();
        this.submit(textarea.value);
      }
    });

    window.setTimeout(() => textarea.focus(), 0);
  }

  private submit(body: string) {
    this.onSubmit(body);
    this.close();
  }
}
