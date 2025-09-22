(function () {
  const PANEL_ID = "linear-ext-panel";
  const CONTAINER_SELECTOR =
    "#skip-nav+div>div>div>div:nth-child(2)>div>div:nth-child(2)";
  const HISTORY_ITEM_SELECTOR = "[data-history-entry-id]";

  const formatDuration = (ms) => {
    const time = {
      d: Math.floor(ms / 86400000),
      h: Math.floor(ms / 3600000) % 24,
    };
    return Object.entries(time)
      .filter((val) => val[1] !== 0)
      .map(([key, val]) => `${val}${key}`)
      .join(" ");
  };

  // Simple URL matcher for Linear issue detail pages.
  const isLinearIssueUrl = (url = location.href) => {
    try {
      const u = new URL(url);
      // Matches paths like /<workspace>/issue/<id> or /issues/<id> and in domain linear.app
      return (
        u.hostname === "linear.app" && /\/issue\/|\/issues?\//i.test(u.pathname)
      );
    } catch (e) {
      return false;
    }
  };
  const getStatusChangesFromHistoryEntries = () => {
    return [...document.querySelectorAll(HISTORY_ITEM_SELECTOR)]
      .map((i) => ({
        text: i.textContent,
        date: new Date(
          i.querySelector("a[aria-label]").getAttribute("aria-label")
        ),
        icon: i.querySelector("svg"),
        type:
          (i.textContent.includes("moved from") && "status_change") ||
          (i.textContent.includes("created the issue") && "created"),
      }))
      .filter(({ type }) => ["status_change", "created"].includes(type))
      .map((i) =>
        i.type === "status_change"
          ? {
              ...i,
              from: i.text.split("moved from ")[1].split(" to ")[0],
              to: i.text.split(" to ")[1].split("·")[0],
            }
          : i
      );
  };

  const calculateStatusTimes = (history) => {
    const statusesDictionary = {};
    if (history.length < 1) {
      return statusesDictionary;
    }
    // Iterate through the history to calculate time difference between events
    for (let i = 1; i < history.length; i++) {
      const statusName = history[i - 1].to || history[i].from;
      if (!statusesDictionary[statusName]) {
        statusesDictionary[statusName] = {
          icon: history[i - 1].icon,
          totalTime: 0,
        };
      }
      statusesDictionary[statusName].totalTime +=
        history[i].date.getTime() - history[i - 1].date.getTime();
    }

    // Handle the time for the *current* (final) status
    const lastEvent = history[history.length - 1];
    if (lastEvent.to) {
      if (!statusesDictionary[lastEvent.to]) {
        statusesDictionary[lastEvent.to] = {
          icon: lastEvent.icon,
          totalTime: 0,
        };
      }
      statusesDictionary[lastEvent.to].totalTime +=
        Date.now() - lastEvent.date.getTime();
    }
    return statusesDictionary;
  };

  const createTimeInStatusPanel = (statusesDictionary) => {
    if (document.getElementById(PANEL_ID)) {
      return null;
    }
    const statuses = Object.entries(statusesDictionary);
    if (statuses.length < 1) {
      return null;
    }
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "linear-ext-panel";

    panel.innerHTML = `
      <div class="linear-ext-title">
        <div class="linear-ext-title-container">
          <span>Time in status</span>
        </div>
      </div>
      ${Object.entries(statusesDictionary)
        .map(([status, { icon, totalTime }]) => {
          return `
              <div class="linear-ext-item">
                ${icon?.outerHTML || ""}
                <div class="linear-ext-item-name">
                  <span>${status}</span>
                </div>
                <div class="linear-ext-item-time">
                  <span>${formatDuration(totalTime)}</span>
                </div>
              </div>
            `;
        })
        .join("")}
    `;
    return panel;
  };

  const updateTimeInStatusPanel = () => {
    if (isLinearIssueUrl()) {
      const history = getStatusChangesFromHistoryEntries();
      const statusesDictionary = calculateStatusTimes(history);
      const panel = createTimeInStatusPanel(statusesDictionary);
      const container = document.querySelector(CONTAINER_SELECTOR);
      if (!container || !panel) {
        return;
      }
      container.appendChild(panel);
      return;
    }
    document.getElementById(PANEL_ID)?.remove();
  };

  // Observe DOM changes to attach panel when content loads asynchronously.
  const bodyObserver = new MutationObserver(() => {
    updateTimeInStatusPanel();
  });
  bodyObserver.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });

  // initial attempt
  updateTimeInStatusPanel();
  setInterval(updateTimeInStatusPanel, 3000);
})();
