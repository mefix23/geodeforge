(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EN = document.documentElement.lang === "en";
  const T = (ru, en) => (EN ? en : ru);
  const H = { "Content-Type": "application/json", apikey: GF.anon, Authorization: "Bearer " + GF.anon };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---------- Анонимная статистика: откуда пришли и что нажимали ----------
  const qref = new URLSearchParams(location.search).get("ref");
  try { if (qref) sessionStorage.setItem("gf-ref", qref); } catch {}
  const ref = (() => { try { return sessionStorage.getItem("gf-ref") || (document.referrer ? new URL(document.referrer).hostname : ""); } catch { return ""; } })();
  const track = (kind) => { try { fetch(GF.api + "/track", { method: "POST", headers: H, body: JSON.stringify({ kind, ref }), keepalive: true }).catch(() => {}); } catch {} };
  track("visit");

  // ---------- Фон: движущиеся линии ----------
  const c = $("#lines");
  if (c) {
    const ctx = c.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px"; };
    resize(); addEventListener("resize", resize);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const L = Array.from({ length: 30 }, () => ({ p: Math.random(), q: Math.random(), len: .06 + Math.random() * .22, sp: .0003 + Math.random() * .001, v: Math.random() > .5 }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.lineWidth = dpr;
      for (const l of L) {
        if (!reduce) { l.q += l.sp; if (l.q > 1 + l.len) l.q = -l.len; }
        ctx.beginPath();
        if (l.v) { ctx.moveTo(l.p * c.width, l.q * c.height); ctx.lineTo(l.p * c.width, (l.q - l.len) * c.height); }
        else { ctx.moveTo(l.q * c.width, l.p * c.height); ctx.lineTo((l.q - l.len) * c.width, l.p * c.height); }
        ctx.stroke();
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    draw();
  }

  // ---------- Печатающийся заголовок ----------
  const words = EN ? ["Just with words.", "No code.", "In minutes.", "With any AI."] : ["Просто словами.", "Без кода.", "За минуты.", "С любым ИИ."];
  const t = $("#typed");
  if (t) {
    let wi = 0, ci = words[0].length, dir = -1, wait = 40;
    setInterval(() => {
      if (wait > 0) return void wait--;
      ci += dir;
      if (ci <= 0) { dir = 1; wi = (wi + 1) % words.length; wait = 4; }
      if (ci >= words[wi].length) { ci = words[wi].length; dir = -1; wait = 40; }
      t.textContent = words[wi].slice(0, Math.max(ci, 0)) || "\u00a0";
    }, 60);
  }

  // ---------- Скриншоты ----------
  $$(".shot-tabs button").forEach((b) => b.addEventListener("click", () => {
    $$(".shot-tabs button").forEach((x) => x.classList.toggle("on", x === b));
    $("#shot").src = b.dataset.src;
  }));

  // ---------- «Живой код» в демо ----------
  const code = `#include <Geode/Geode.hpp>
#include <Geode/modify/PlayLayer.hpp>
using namespace geode::prelude;

class $modify(FPSLayer, PlayLayer) {
    struct Fields { CCLabelBMFont* label; };

    bool init(GJGameLevel* level, bool r, bool d) {
        if (!PlayLayer::init(level, r, d)) return false;
        // надпись в углу экрана
        m_fields->label = CCLabelBMFont::create("FPS", "bigFont.fnt");
        m_fields->label->setScale(.4f);
        this->addChild(m_fields->label, 100);
        return true;
    }
};`;
  const box = $("#code");
  const hl = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/(\/\/.*)$/gm, '<span class="com">$1</span>')
    .replace(/("[^"]*")/g, '<span class="str">$1</span>')
    .replace(/\b(class|struct|bool|return|if|false|true|this|using|namespace|#include)\b/g, '<span class="kw">$1</span>')
    .replace(/\b([A-Z][A-Za-z]+)\b/g, '<span class="ty">$1</span>');
  if (box) {
    let n = 0;
    const tick = () => {
      n = n >= code.length + 60 ? 0 : n + 3;
      const txt = code.slice(0, n);
      box.innerHTML = txt.split("\n").map((l, i) => `<div><span class="ln">${i + 1}</span>${hl(l)}</div>`).join("") + '<span style="display:inline-block;width:8px;height:16px;background:#fff;margin-left:62px;vertical-align:-3px"></span>';
      box.scrollTop = box.scrollHeight;
    };
    setInterval(tick, 45);
  }

  // ---------- Ссылки из настроек ----------
  $("#dl").href = GF.download;
  $("#dl").addEventListener("click", () => track("download"));
  if (GF.telegram) $("#tg").innerHTML = `<a href="${GF.telegram}" target="_blank" rel="noopener">${T("Написать в Telegram", "Message on Telegram")}</a>`;
  $$("a[href='#download']").forEach((a) => a.addEventListener("click", () => track("trial_click")));


  // ---------- Цены, акция, отзывы (с сервера) ----------
  let sale = null;
  fetch(GF.api + "/site-info", { headers: H }).then((r) => r.json()).then((info) => {
    if (!info || !info.prices) return;
    sale = info.sale;
    GF.prices = info.prices;
    const amt = (id, p) => {
      const el = $("#amt-" + id);
      if (el) el.innerHTML = (sale ? `<s>${info.full[id]}</s>` : "") + `${p} <span>₽</span>`;
    };
    amt("basic", info.prices.basic);
    amt("pro", info.prices.pro);
    if ($("#amt-upgrade")) $("#amt-upgrade").textContent = info.prices.upgrade;
    if (sale) {
      const bar = $("#sale-bar");
      const till = new Date(sale.ends_at).toLocaleDateString(EN ? "en-GB" : "ru-RU", { timeZone: "Europe/Moscow", day: "numeric", month: "long" });
      bar.innerHTML = `🔥 ${esc(sale.title)}: −${sale.percent}% ${T("до", "until")} ${till} · <a href="#buy">${T("Купить со скидкой", "Buy with discount")}</a>`;
      bar.hidden = false;
    }
    if (info.reviews && info.reviews.length) {
      $("#reviews").hidden = false;
      $("#rating").textContent = `· ★ ${info.rating}`;
      $("#reviews-list").innerHTML = info.reviews.map((r) => `
        <div class="review">
          <div class="st">${"★".repeat(r.rating)}<i>${"★".repeat(5 - r.rating)}</i></div>
          <p>${esc(r.text)}</p>
          <b>${esc(r.name)}</b> <span class="dim" style="font-size:12px">· GeodeForge ${r.plan === "basic" ? T("Базовая", "Basic") : "Pro"}</span>
        </div>`).join("");
    }
  }).catch(() => {});

  // ---------- Галерея модов: лучшие / неделя / новые, лайки, конкурс ----------
  let gSort = "top";
  let liked = [];
  const post = (body) => fetch(GF.api + "/gallery", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ site: true, ...body }) }).then((r) => r.json());
  function loadGallery() {
    post({ action: "list", sort: gSort }).then((g) => {
      liked = g.liked || [];
      const c = g.contest;
      const cb = $("#contest");
      if (c && cb) {
        const left = new Date(c.ends_at) - Date.now();
        cb.hidden = false;
        cb.innerHTML = c.active
          ? `<b>🏆 ${esc(c.title)}</b><div>${T("Тема", "Theme")}: <b>${esc(c.theme)}</b>${c.prize ? ` · ${T("приз", "prize")}: ${esc(c.prize)}` : ""} · ${T("осталось", "left")} ${Math.max(0, Math.floor(left / 86400000))} ${T("дн.", "d")} ${Math.max(0, Math.floor((left % 86400000) / 3600000))} ${T("ч", "h")}</div><div class="dim" style="font-size:13px">${T("Сделай мод в GeodeForge и выложи в галерею с галочкой «Участвует в конкурсе». Побеждает мод с наибольшим числом ❤️ — голосуй ниже!", "Make a mod in GeodeForge and post it to the gallery with “Takes part in the contest”. The mod with the most ❤️ wins — vote below!")}</div>`
          : c.winner ? `<b>🏆 ${esc(c.title)}</b><div>${T("Победитель", "Winner")}: <b>${esc(c.winner.title)}</b> — ${esc(c.winner.author)}</div>` : "";
        if (!cb.innerHTML) cb.hidden = true;
      }
      if (!g.items || !g.items.length) {
        $("#gallery-list").innerHTML = `<div class="dim">${T("Пока пусто — стань первым! В программе: Сборка → Публикация → «В галерею».", "Empty for now — be the first! In the app: Build → Publishing → “To gallery”.")}</div>`;
        return;
      }
      $("#gallery-list").innerHTML = g.items.map((m, i) => `
      <div class="gcard">
        <div class="img" style="${m.image ? `background-image:url('${esc(m.image)}')` : ""}">${m.image ? "" : "◆"}${gSort !== "new" && i < 3 ? `<span class="rank">#${i + 1}</span>` : ""}</div>
        <div class="body">
          <b>${esc(m.title)}</b>
          <p>${esc(m.description)}</p>
          <div class="meta">${esc(m.author)} · ${T("скачан", "downloads")} ${m.downloads}</div>
          <div class="gacts">
            <button class="btn sm like${liked.includes(m.id) ? " on" : ""}" data-id="${m.id}">❤ <span>${m.likes || 0}</span></button>
            <a class="btn sm" href="${GF.api}/gallery?download=${m.id}">${T("Скачать .geode", "Download .geode")}</a>
          </div>
        </div>
      </div>`).join("");
    }).catch(() => {});
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".like");
    if (b) {
      const id = b.dataset.id;
      const on = !liked.includes(id);
      post({ action: "like", id, on }).then((r) => {
        if (r.error) return;
        liked = on ? [...liked, id] : liked.filter((x) => x !== id);
        b.classList.toggle("on", on);
        b.querySelector("span").textContent = r.likes;
      });
    }
    const t = e.target.closest && e.target.closest("[data-gsort]");
    if (t) {
      gSort = t.dataset.gsort;
      document.querySelectorAll("[data-gsort]").forEach((x) => x.classList.toggle("on", x === t));
      loadGallery();
    }
  });
  loadGallery();

  // ---------- Покупка ----------
  const modal = $("#modal");
  let plan = "pro", method = "card", promoOk = "";
  // Промокод из ссылки: ?promo=КОД
  const qp = new URLSearchParams(location.search);
  if (qp.get("promo")) $("#promo").value = qp.get("promo").toUpperCase();
  const quote = async () => {
    const code = $("#promo").value.trim().toUpperCase();
    const msg = $("#promo-msg");
    promoOk = "";
    if (!code) { msg.textContent = ""; msg.className = "promo-msg"; $("#m-sum").textContent = GF.prices[plan] + " ₽"; return; }
    msg.textContent = T("Проверяю…", "Checking…"); msg.className = "promo-msg";
    try {
      const r = await fetch(GF.api + "/pay-create", { method: "POST", headers: { "Content-Type": "application/json", apikey: GF.anon, Authorization: "Bearer " + GF.anon }, body: JSON.stringify({ quote: true, plan, promo: code }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Ошибка");
      promoOk = code;
      msg.textContent = j.sale ? T(`Действует акция −${j.percent}% (она выгоднее)`, `Sale −${j.percent}% applies (better deal)`) : T(`Скидка ${j.percent}% применена ✓`, `${j.percent}% discount applied ✓`); msg.className = "promo-msg ok";
      $("#m-sum").innerHTML = `<s>${j.full} ₽</s>${j.amount} ₽`;
    } catch (e) {
      msg.textContent = e.message; msg.className = "promo-msg err";
      $("#m-sum").textContent = GF.prices[plan] + " ₽";
    }
  };
  let qt; $("#promo").addEventListener("input", () => { clearTimeout(qt); qt = setTimeout(quote, 500); });
  const names = EN ? { basic: "GeodeForge Basic", pro: "GeodeForge Pro", upgrade: "Upgrade to Pro" } : { basic: "GeodeForge Базовая", pro: "GeodeForge Про", upgrade: "Переход на Про" };
  const open = (p, email, gift) => {
    plan = p;
    track("buy_click");
    $("#gift").checked = !!gift;
    $("#gift-fields").hidden = !gift;
    $("#gift").parentElement.hidden = p === "upgrade";
    $("#m-title").textContent = names[p];
    $("#m-sub").textContent = p === "upgrade" ? T("Укажи почту, с которой входишь в GeodeForge — тариф поменяется сам.", "Enter the email you use in GeodeForge — the plan changes automatically.") : T("Ключ навсегда, без подписки.", "A lifetime key, no subscription.");
    $("#m-email-label").textContent = p === "upgrade" ? T("Почта твоего аккаунта GeodeForge", "Your GeodeForge account email") : T("Почта — сюда придёт ключ", "Email — the key will be sent here");
    $("#m-sum").textContent = GF.prices[p] + " ₽";
    $("#m-err").textContent = "";
    if (email) $("#email").value = email;
    modal.classList.add("open");
    if ($("#promo").value.trim()) quote();
    setTimeout(() => $("#email").focus(), 50);
  };
  $$("[data-plan]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(b.dataset.plan, null, !!b.dataset.gift); }));
  $("#gift").addEventListener("change", () => { $("#gift-fields").hidden = !$("#gift").checked; });
  $(".x", modal).addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("mousedown", (e) => { if (e.target === modal) modal.classList.remove("open"); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.remove("open"); });
  $$(".seg button", modal).forEach((b) => b.addEventListener("click", () => {
    method = b.dataset.method;
    $$(".seg button", modal).forEach((x) => x.classList.toggle("on", x === b));
  }));
  $("#buyform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#paybtn");
    btn.disabled = true; btn.textContent = T("Создаю заказ…", "Creating order…"); $("#m-err").textContent = "";
    try {
      const r = await fetch(GF.api + "/pay-create", {
        method: "POST",
        headers: H,
        body: JSON.stringify({
          email: $("#email").value, plan, method, promo: $("#promo").value.trim(),
          ...($("#gift").checked ? { gift_to: $("#gift-to").value, gift_from: $("#gift-from").value, gift_msg: $("#gift-msg").value } : {}),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Ошибка " + r.status);
      try { localStorage.setItem("gf-last-order", j.order_id); } catch {}
      location.href = j.pay_url;
    } catch (err) {
      $("#m-err").textContent = err.message || String(err);
      btn.disabled = false; btn.textContent = T("Перейти к оплате", "Go to payment");
    }
  });

  // Ссылка из программы: ?upgrade=почта
  const qs = new URLSearchParams(location.search);
  if (qs.get("upgrade") !== null) open("upgrade", qs.get("upgrade"));
  else if (qs.get("promo") && location.hash === "#buy") open("pro");
})();
