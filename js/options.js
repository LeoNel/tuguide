function showPage(pageId) {
  const panels = document.querySelectorAll('.options__panel');
  const tabButtons = document.querySelectorAll('.tab-button');

  for (const panel of panels) {
    const active = panel.id === pageId;
    panel.hidden = !active;
  }

  for (const button of tabButtons) {
    const active = `page-${button.dataset.page}` === pageId;
    button.setAttribute('aria-selected', active ? 'true' : 'false');
    button.tabIndex = active ? 0 : -1;
  }
}

function renderVersion(manifestProvider = () => chrome.runtime.getManifest()) {
  const versionNode = document.getElementById('extensionVersion');
  if (!versionNode) {
    return;
  }

  const manifest = manifestProvider();
  versionNode.textContent = manifest?.version || 'Unknown';
}

function initialiseOptionsPage() {
  const tabButtons = [...document.querySelectorAll('.tab-button')];

  for (const button of tabButtons) {
    button.addEventListener('click', () => {
      showPage(`page-${button.dataset.page}`);
    });

    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const currentIndex = tabButtons.indexOf(button);
      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabButtons.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabButtons.length - 1;
      }

      const nextTab = tabButtons[nextIndex];
      if (nextTab) {
        showPage(`page-${nextTab.dataset.page}`);
        nextTab.focus();
      }
    });
  }

  showPage('page-about');
  renderVersion();
}

document.addEventListener('DOMContentLoaded', initialiseOptionsPage);

if (typeof module !== 'undefined') {
  module.exports = {
    showPage,
    renderVersion
  };
}
