
(function() {
  const PANEL_ID = 'linear-ext-panel-v1';

  // Simple URL matcher for Linear issue detail pages.
  function isLinearIssueUrl(url = location.href) {
    try {
      const u = new URL(url);
      // Matches paths like /<workspace>/issue/<id> or /issues/<id>
      return /\/issue\/|\/issues?\//i.test(u.pathname);
    } catch (e) {
      return false;
    }
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return null;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'linear-ext-panel';

    panel.innerHTML = `
      <div class="linear-ext-title">
        <div class="linear-ext-title-container">
          <span>Time in status</span>
        </div>
      </div>
    `;
    return panel;
  }

  const getContainer = () => {
    const attachTo = document.querySelector('#skip-nav+div>div>div>div:nth-child(2)>div>div:nth-child(2)');
    if (!attachTo) return;
    return attachTo;
  };

  const removeContainer = () => {
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();
  };

  const addContainer = () => {
    const panel = createPanel();
    const attachTo = getContainer();
    if (!attachTo) return;
    attachTo.appendChild(panel);
  };

  function addOrRemoveContainer() {
    if (isLinearIssueUrl()) {
      addContainer();
      return;
    }
    removeContainer();
  }

  // Detect SPA navigation: monitor history changes and DOM mutations.
  function onUrlChange(callback) {
    let last = location.href;
    const check = () => {
      const href = location.href;
      if (href !== last) {
        last = href;
        callback(href);
      }
    };

    // history API hooks
    const pushState = history.pushState;
    history.pushState = function() {
      pushState.apply(this, arguments);
      check();
    };
    const replaceState = history.replaceState;
    history.replaceState = function() {
      replaceState.apply(this, arguments);
      check();
    };
    window.addEventListener('popstate', check);

    // also periodically check (covers edge cases)
    setInterval(check, 500);
  }

  // Observe DOM changes to attach panel when content loads asynchronously.
  
  const bodyObserver = new MutationObserver(() => {
    addOrRemoveContainer();
  });
  bodyObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });
  
  // initial attempt
  addOrRemoveContainer();

  onUrlChange(() => {
    // small delay to allow SPA content to render
    setTimeout(addOrRemoveContainer, 300);
  });

})();
