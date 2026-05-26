const yearElement = document.querySelector("#year");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const serviceForm = document.querySelector("#serviceForm");
const formStatus = document.querySelector("#formStatus");
const githubActivity = document.querySelector("#githubActivity");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function initHeroCanvas() {
  const canvas = document.querySelector("#heroCanvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = {
    x: 0,
    y: 0,
    active: false
  };
  const nodes = [];
  let ratio = 1;
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  function resizeCanvas() {
    ratio = window.devicePixelRatio || 1;
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    nodes.length = 0;
    const nodeCount = Math.max(18, Math.min(42, Math.floor((width * height) / 27000)));

    for (let index = 0; index < nodeCount; index += 1) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.8 + Math.random() * 2.4,
        speedX: -0.16 + Math.random() * 0.32,
        speedY: -0.14 + Math.random() * 0.28,
        phase: Math.random() * Math.PI * 2
      });
    }

    if (reduceMotion.matches) {
      draw();
    }
  }

  function drawHex(x, y, time, row, col) {
    const pulse = Math.sin(time * 0.0014 + row * 0.7 + col * 0.5);
    const offset = reduceMotion.matches ? 0 : pulse * 7;
    const alpha = 0.13 + Math.max(0, pulse) * 0.12;

    context.strokeStyle = (row + col) % 3 === 0
      ? `rgba(50, 214, 197, ${alpha + 0.08})`
      : `rgba(255, 159, 90, ${alpha})`;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x + offset, y + 22);
    context.lineTo(x + 44 + offset, y);
    context.lineTo(x + 88 + offset, y + 22);
    context.lineTo(x + 88 + offset, y + 58);
    context.lineTo(x + 44 + offset, y + 72);
    context.lineTo(x + offset, y + 58);
    context.closePath();
    context.stroke();

    if ((row + col) % 4 === 0) {
      context.fillStyle = `rgba(50, 214, 197, ${alpha * 0.48})`;
      context.fillRect(x + 28 + offset, y + 28, 32, 8);
    }
  }

  function drawGrid(time) {
    const drift = reduceMotion.matches ? 0 : (time * 0.018) % 92;
    const columns = Math.ceil(width / 92) + 2;
    const rows = Math.ceil(height / 72) + 2;

    for (let row = -1; row < rows; row += 1) {
      for (let col = -1; col < columns; col += 1) {
        const x = col * 92 + (row % 2) * 28 - drift;
        const y = row * 72 + Math.sin(time * 0.0006 + col) * 5;
        drawHex(x, y, time, row, col);
      }
    }
  }

  function drawNodes(time) {
    for (const node of nodes) {
      if (!reduceMotion.matches) {
        node.x += node.speedX;
        node.y += node.speedY;

        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;
      }

      const glow = 0.38 + Math.sin(time * 0.002 + node.phase) * 0.22;
      context.fillStyle = `rgba(125, 247, 232, ${glow})`;
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fill();
    }

    for (let start = 0; start < nodes.length; start += 1) {
      for (let end = start + 1; end < nodes.length; end += 1) {
        const first = nodes[start];
        const second = nodes[end];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);

        if (distance < 150) {
          context.strokeStyle = `rgba(125, 247, 232, ${(1 - distance / 150) * 0.15})`;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }

      if (pointer.active) {
        const node = nodes[start];
        const distance = Math.hypot(node.x - pointer.x, node.y - pointer.y);

        if (distance < 210) {
          context.strokeStyle = `rgba(255, 159, 90, ${(1 - distance / 210) * 0.32})`;
          context.beginPath();
          context.moveTo(pointer.x, pointer.y);
          context.lineTo(node.x, node.y);
          context.stroke();
        }
      }
    }
  }

  function draw(time = 0) {
    context.clearRect(0, 0, width, height);
    drawGrid(time);
    drawNodes(time);

    const gradient = context.createRadialGradient(width * 0.72, height * 0.36, 0, width * 0.72, height * 0.36, Math.max(width, height) * 0.62);
    gradient.addColorStop(0, "rgba(50, 214, 197, 0.16)");
    gradient.addColorStop(0.46, "rgba(77, 166, 255, 0.06)");
    gradient.addColorStop(1, "rgba(8, 13, 18, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    if (!reduceMotion.matches) {
      animationFrame = window.requestAnimationFrame(draw);
    }
  }

  function handlePointerMove(event) {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  }

  function handlePointerLeave() {
    pointer.active = false;
  }

  function handleMotionChange() {
    window.cancelAnimationFrame(animationFrame);
    draw();
  }

  resizeCanvas();
  draw();

  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  reduceMotion.addEventListener("change", handleMotionChange);
}

initHeroCanvas();

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getContributionLevel(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function renderContributionGraph(events = []) {
  const graph = githubActivity.querySelector("[data-github-graph]");
  const months = githubActivity.querySelector("[data-github-months]");
  const summary = githubActivity.querySelector("[data-github-graph-summary]");

  if (!graph || !months) return;

  const eventCounts = new Map();

  events.forEach((event) => {
    if (!event.created_at) return;
    const key = formatDateKey(new Date(event.created_at));
    eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 51 * 7 - today.getDay());

  graph.innerHTML = "";
  months.innerHTML = "";

  let activeDays = 0;
  let totalEvents = 0;
  let previousMonth = "";

  for (let week = 0; week < 52; week += 1) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + week * 7);
    const monthLabel = weekStart.toLocaleDateString(undefined, { month: "short" });

    const month = document.createElement("span");
    month.textContent = monthLabel !== previousMonth ? monthLabel : "";
    months.appendChild(month);
    previousMonth = monthLabel;

    for (let day = 0; day < 7; day += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + day);

      const key = formatDateKey(date);
      const count = eventCounts.get(key) || 0;
      const cell = document.createElement("span");

      if (date > today) {
        cell.dataset.level = "0";
        cell.setAttribute("aria-hidden", "true");
      } else {
        const level = getContributionLevel(count);
        cell.dataset.level = String(level);
        cell.title = `${count} public event${count === 1 ? "" : "s"} on ${date.toLocaleDateString()}`;
        cell.setAttribute("aria-label", cell.title);

        if (count > 0) {
          activeDays += 1;
          totalEvents += count;
        }
      }

      graph.appendChild(cell);
    }
  }

  if (summary) {
    summary.textContent = `${totalEvents} public GitHub events across ${activeDays} active days in the recent public activity feed.`;
  }
}

async function initGithubActivity() {
  if (!githubActivity) return;

  const username = githubActivity.dataset.githubUser;
  const repoList = githubActivity.querySelector("[data-github-repos]");
  const reposStat = githubActivity.querySelector('[data-github-stat="repos"]');
  const followersStat = githubActivity.querySelector('[data-github-stat="followers"]');
  const followingStat = githubActivity.querySelector('[data-github-stat="following"]');
  const graphSummary = githubActivity.querySelector("[data-github-graph-summary]");

  try {
    const [profileResponse, reposResponse, eventsResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=4`),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=100`)
    ]);

    if (!profileResponse.ok || !reposResponse.ok) {
      throw new Error("GitHub activity is temporarily unavailable.");
    }

    const profile = await profileResponse.json();
    const repos = await reposResponse.json();
    const events = eventsResponse.ok ? await eventsResponse.json() : [];

    if (reposStat) reposStat.textContent = profile.public_repos ?? "--";
    if (followersStat) followersStat.textContent = profile.followers ?? "--";
    if (followingStat) followingStat.textContent = profile.following ?? "--";
    renderContributionGraph(events);

    if (repoList) {
      repoList.innerHTML = "";

      repos
        .filter((repo) => !repo.fork)
        .slice(0, 3)
        .forEach((repo) => {
          const repoLink = document.createElement("a");
          repoLink.className = "github-repo";
          repoLink.href = repo.html_url;
          repoLink.target = "_blank";
          repoLink.rel = "noreferrer";

          const updatedDate = new Date(repo.updated_at);
          const updatedLabel = Number.isNaN(updatedDate.getTime())
            ? "Recently updated"
            : `Updated ${updatedDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}`;

          repoLink.innerHTML = `
            <span class="github-repo-name">${repo.name}</span>
            <span class="github-repo-meta">${repo.language || "Code"} &bull; ${updatedLabel}</span>
          `;

          repoList.appendChild(repoLink);
        });

      if (!repoList.children.length) {
        repoList.innerHTML = "<p>No public repositories found yet.</p>";
      }
    }
  } catch (error) {
    if (graphSummary) {
      graphSummary.textContent = error.message;
    }

    renderContributionGraph([]);

    if (repoList) {
      repoList.innerHTML = `
        <p>${error.message}</p>
        <a class="card-link" href="https://github.com/${username}" target="_blank" rel="noreferrer">Open GitHub Directly</a>
      `;
    }
  }
}

initGithubActivity();

if (serviceForm && formStatus) {
  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = "Sending your request...";

    const formData = new FormData(serviceForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
      }

      formStatus.textContent = result.message;
      serviceForm.reset();
    } catch (error) {
      formStatus.textContent = error.message || "Unable to send the request right now.";
    }
  });
}
