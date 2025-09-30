(function () {
  const PANEL_ID = "linear-time-in-status-panel";
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
    const statusesDictionary = { Total: { totalTime: 0 } };
    if (history.length < 1) {
      return statusesDictionary;
    }
    const addTimeToStatus = (start, end) => {
      const statusName = start.to || end?.from;
      statusesDictionary[statusName] = statusesDictionary[statusName] || {
        icon: start.icon,
        totalTime: 0,
      };
      const endTime = end ? end.date.getTime() : Date.now();
      const elaspsedTime = endTime - start.date.getTime();
      statusesDictionary[statusName].totalTime += elaspsedTime;
      statusesDictionary.Total.totalTime += elaspsedTime;
    };
    // Iterate through the history to calculate time difference between events
    history.forEach((start, i) => {
      const end = i + 1 < history.length ? history[i + 1] : undefined;
      addTimeToStatus(start, end);
    });
    return statusesDictionary;
  };

  const createTimeInStatusPanel = (statusesDictionary) => {
    if (document.getElementById(PANEL_ID)) {
      return;
    }
    const statuses = Object.entries(statusesDictionary);
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "linear-ext-panel";

    panel.innerHTML = `
      <div class="linear-ext-title">
        <div class="linear-ext-title-container">
          <span>Time in status</span>
        </div>
      </div>
      ${statuses
        .map(
          ([status, { icon, totalTime }]) => `
          <div class="linear-ext-item">
            ${icon?.outerHTML || ""}
            <div class="linear-ext-item-name">
              <span>${status}</span>
            </div>
            <div class="linear-ext-item-time">
              <span>${formatDuration(totalTime)}</span>
            </div>
          </div>
        `
        )
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
  updateTimeInStatusPanel();
  setInterval(updateTimeInStatusPanel, 3000);
})();
