function showPage(pageId) {
  const panels = document.querySelectorAll(".options__panel");
  const tabButtons = document.querySelectorAll(".tab-button");

  for (const panel of panels) {
    panel.hidden = panel.id !== pageId;
  }

  for (const button of tabButtons) {
    const active = `page-${button.dataset.page}` === pageId;
    button.setAttribute("aria-current", active ? "page" : "false");
  }
}

function initialiseOptionsPage() {
  const tabButtons = document.querySelectorAll(".tab-button");

  for (const button of tabButtons) {
    button.addEventListener("click", () => {
      showPage(`page-${button.dataset.page}`);
    });
  }

  showPage("page-about");
}

document.addEventListener("DOMContentLoaded", initialiseOptionsPage);
