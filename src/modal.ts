import { App, Modal } from "obsidian";
import { I18n } from "./i18n";

export interface CommentInputModalOptions {
  // 渡すと編集として開く。未指定なら新規追加
  initialBody?: string;
}

export class CommentInputModal extends Modal {
  private readonly i18n: I18n;
  private readonly typeLabel: string;
  private readonly onSubmit: (body: string) => void;
  private readonly options: CommentInputModalOptions;

  constructor(
    app: App,
    i18n: I18n,
    typeLabel: string,
    onSubmit: (body: string) => void,
    options: CommentInputModalOptions = {}
  ) {
    super(app);
    this.i18n = i18n;
    this.typeLabel = typeLabel;
    this.onSubmit = onSubmit;
    this.options = options;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("review-comment-modal");
    const isEdit = this.options.initialBody !== undefined;
    this.setTitle(
      this.i18n.t(isEdit ? "modal.editTitleTemplate" : "modal.titleTemplate", {
        type: this.typeLabel,
      })
    );

    contentEl.createEl("p", {
      text: this.i18n.t("modal.help"),
      cls: "review-comment-modal-help",
    });

    const textarea = contentEl.createEl("textarea", {
      cls: "review-comment-modal-textarea",
    });
    textarea.placeholder = this.i18n.t("modal.placeholder");
    if (isEdit) {
      textarea.value = this.options.initialBody ?? "";
    }

    const actions = contentEl.createDiv({
      cls: "review-comment-modal-actions",
    });
    const cancelBtn = actions.createEl("button", {
      text: this.i18n.t("modal.cancel"),
      cls: "mod-muted",
    });
    const submitBtn = actions.createEl("button", {
      text: this.i18n.t(isEdit ? "panel.save" : "modal.addComment"),
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

    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }, 0);
  }

  private submit(body: string) {
    this.onSubmit(body);
    this.close();
  }
}
