const DATA_URL = "sechub-writeups-fa.json";

const list = document.querySelector("#writeup-list");
const search = document.querySelector("#search");
const category = document.querySelector("#category");
const count = document.querySelector("#count");
const empty = document.querySelector("#empty");
const statCount = document.querySelector("#stat-count");
const statTags = document.querySelector("#stat-tags");

const PAGE_SIZE = 10;
let page = 1;
let writeups = [];
let allTags = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toFaDigits(value) {
  return String(value ?? "").replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function normalize() {
  const unique = new Set();
  writeups.forEach(w => (w.bugsFa || []).forEach(t => unique.add(t)));
  allTags = [...unique].sort((a, b) => a.localeCompare(b));

  statCount.textContent = toFaDigits(writeups.length);
  statTags.textContent = toFaDigits(allTags.length);

  category.innerHTML =
    `<option value="">همه نوع‌ها</option>` +
    allTags.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

function matches(w, q, selectedTag) {
  const haystack = [
    w.titleFa, w.title,
    ...(w.bugsFa || []), ...(w.bugs || []),
    ...(w.programs || []), ...(w.authors || [])
  ].join(" ").toLowerCase();

  return (!selectedTag || (w.bugsFa || []).includes(selectedTag)) &&
         (!q || haystack.includes(q));
}

function card(w) {
  const tags = (w.bugsFa || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  const program = (w.programs || []).filter(Boolean).join("، ");
  const author = (w.authors || []).filter(Boolean).join("، ");
  const bounty = w.bounty && w.bounty !== "-" ? ` · ${escapeHtml(w.bounty)}` : "";

  return `
    <a class="writeup" href="writeups/${escapeHtml(w.slug)}.html">
      <div class="writeup-top">
        <div>
          <h3>${escapeHtml(w.titleFa)}</h3>
          <p>${escapeHtml(author)}${program && program !== "-" ? ` · ${escapeHtml(program)}` : ""}${bounty}</p>
        </div>
        <span class="meta">${escapeHtml(formatDate(w.publicationDate))}</span>
      </div>
      <p class="original-title">${escapeHtml(w.title)}</p><div class="source-line">منبع اصلی: ${escapeHtml(new URL(w.url).hostname.replace(/^www\./, ""))}</div>
      <div class="tags">${tags}</div>
    </a>
  `;
}

function render() {
  const q = search.value.trim().toLowerCase();
  const selectedTag = category.value;
  const filtered = writeups.filter(w => matches(w, q, selectedTag));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  page = Math.min(page, totalPages);

  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  count.textContent = `${toFaDigits(filtered.length)} رایتاپ`;

  list.innerHTML = visible.map(card).join("");
  empty.hidden = visible.length !== 0;

  document.querySelector("#pagination")?.remove();

  if (totalPages > 1) {
    const nav = document.createElement("div");
    nav.id = "pagination";
    nav.className = "pagination";

    const prev = document.createElement("button");
    prev.textContent = "قبلی";
    prev.disabled = page === 1;
    prev.onclick = () => { page--; render(); };

    const info = document.createElement("span");
    info.textContent = `صفحه ${toFaDigits(page)} از ${toFaDigits(totalPages)}`;

    const next = document.createElement("button");
    next.textContent = "بعدی";
    next.disabled = page === totalPages;
    next.onclick = () => { page++; render(); };

    nav.append(prev, info, next);
    list.after(nav);
  }
}

async function load() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeups = await res.json();

    normalize();
    render();
  } catch (error) {
    console.error(error);
    list.innerHTML = `
      <div class="load-error">
        <strong>دریافت فهرست رایتاپ‌ها انجام نشد.</strong>
        <p>فایل داده محلی پیدا نشد یا دسترسی به آن ممکن نیست.</p>
      </div>
    `;
    count.textContent = "خطا در دریافت داده";
  }
}

search.addEventListener("input", () => { page = 1; render(); });
category.addEventListener("change", () => { page = 1; render(); });

load();
