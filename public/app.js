// IdleProxy provider dashboard. Vanilla ESM, no bundler, no framework —
// SPEC.md D10. Talks directly to the endpoints in server.ts.

const state = {
  address: null,
  session: null,
};

const $ = (id) => document.getElementById(id);

function showError(el, message) {
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearError(el) {
  el.textContent = "";
  el.classList.add("hidden");
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (state.session) headers.Authorization = `Bearer ${state.session}`;
  const res = await fetch(path, { ...opts, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error?.message || `HTTP ${res.status}`);
  return body;
}

// --- Step 1: connect wallet + SIWE-lite sign-in ---

async function connectWallet() {
  const errEl = $("connect-error");
  clearError(errEl);

  if (!window.ethereum) {
    showError(errEl, "No browser wallet found. Install MetaMask or a compatible wallet.");
    return;
  }

  try {
    const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });
    state.address = address;
    $("connect-status").textContent = `Wallet: ${address}`;

    const { nonce, message } = await api("/api/siwe/nonce");
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });

    const verified = await api("/api/siwe/verify", {
      method: "POST",
      body: JSON.stringify({ address, nonce, signature }),
    });
    state.session = verified.session;

    $("connect-status").textContent = `Signed in as ${address}`;
    $("connect-btn").disabled = true;
    await loadDisclosure();
    $("disclosure-card").classList.remove("hidden");
    await refreshDashboardIfOnboarded();
  } catch (e) {
    showError(errEl, e.message);
  }
}

// --- Step 2: disclosure ---

async function loadDisclosure() {
  const { points } = await api("/api/provider/disclosure");
  const ol = document.createElement("ol");
  for (const point of points) {
    const li = document.createElement("li");
    li.textContent = point;
    ol.appendChild(li);
  }
  const container = $("disclosure-text");
  container.innerHTML = "";
  container.appendChild(ol);
}

function updateAcceptButton() {
  $("accept-btn").disabled = !$("accept-main").checked;
}

async function acceptDisclosure() {
  const tier1Accepted = $("accept-tier1").checked;
  await api("/api/provider/accept-disclosure", {
    method: "POST",
    body: JSON.stringify({ tier1Accepted }),
  });
  $("caps-card").classList.remove("hidden");
}

// --- Step 3 + 4: caps -> node token -> command ---

async function requestNodeToken() {
  const body = {
    dailyUsdCap: Number($("cap-usd").value),
    dailyRequestCap: Number($("cap-requests").value),
    maxConcurrency: Number($("cap-concurrency").value),
    reserveFraction: Number($("cap-reserve").value),
  };
  const result = await api("/api/provider/node-token", { method: "POST", body: JSON.stringify(body) });
  $("node-command").textContent = result.command;
  $("command-card").classList.remove("hidden");
  $("dashboard-card").classList.remove("hidden");
  refreshDashboard();
}

function copyCommand() {
  navigator.clipboard.writeText($("node-command").textContent);
}

// --- Dashboard ---

async function refreshDashboardIfOnboarded() {
  try {
    await refreshDashboard();
    $("dashboard-card").classList.remove("hidden");
  } catch {
    // Not onboarded yet — dashboard stays hidden until caps are set.
  }
}

async function refreshDashboard() {
  const me = await api("/api/provider/me");

  const nodesEl = $("nodes-list");
  nodesEl.innerHTML = "";
  if (me.nodes.length === 0) {
    nodesEl.innerHTML = '<p class="note">No nodes connected yet.</p>';
  } else {
    for (const node of me.nodes) {
      const pill = document.createElement("span");
      pill.className = `pill ${node.status}`;
      pill.textContent = `${node.adapter}: ${node.status}`;
      nodesEl.appendChild(pill);
      nodesEl.appendChild(document.createTextNode(" "));
    }
  }

  const bal = me.balance;
  $("balance-info").textContent = bal
    ? `Accrued: ${bal.accrued_micros} µUSD · Paid out: ${bal.paid_out_micros} µUSD`
    : "No balance yet.";

  const jobsBody = document.querySelector("#jobs-table tbody");
  jobsBody.innerHTML = "";
  for (const job of me.jobs) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${job.model}</td><td>${job.band}</td><td>${job.status}</td><td>${job.cost_usd_micros ?? ""}</td>`;
    jobsBody.appendChild(tr);
  }

  const payoutsBody = document.querySelector("#payouts-table tbody");
  payoutsBody.innerHTML = "";
  for (const payout of me.payouts) {
    const tr = document.createElement("tr");
    const link = payout.transaction_link ? `<a href="${payout.transaction_link}" target="_blank" rel="noopener">view</a>` : "";
    tr.innerHTML = `<td>${payout.amount_micros}</td><td>${payout.status}</td><td>${link}</td>`;
    payoutsBody.appendChild(tr);
  }
}

async function killSwitch() {
  await api("/api/provider/kill-switch", { method: "POST", body: JSON.stringify({ enabled: true }) });
  refreshDashboard();
}

$("connect-btn").addEventListener("click", connectWallet);
$("accept-main").addEventListener("change", updateAcceptButton);
$("accept-btn").addEventListener("click", acceptDisclosure);
$("caps-btn").addEventListener("click", requestNodeToken);
$("copy-btn").addEventListener("click", copyCommand);
$("refresh-btn").addEventListener("click", refreshDashboard);
$("kill-btn").addEventListener("click", killSwitch);
