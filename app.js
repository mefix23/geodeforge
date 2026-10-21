(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

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
  const words = ["Просто словами.", "Без кода.", "За минуты.", "С любым ИИ."];
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
  if (GF.telegram) $("#tg").innerHTML = `<a href="${GF.telegram}" target="_blank" rel="noopener">Написать в Telegram</a>`;

  // ---------- Покупка ----------
  const modal = $("#modal");
  let plan = "pro", method = "card";
  const names = { basic: "GeodeForge Базовая", pro: "GeodeForge Про", upgrade: "Переход на Про" };
  const open = (p, email) => {
    plan = p;
    $("#m-title").textContent = names[p];
    $("#m-sub").textContent = p === "upgrade" ? "Укажи почту, с которой входишь в GeodeForge — тариф поменяется сам." : "Ключ навсегда, без подписки.";
    $("#m-email-label").textContent = p === "upgrade" ? "Почта твоего аккаунта GeodeForge" : "Почта — сюда придёт ключ";
    $("#m-sum").textContent = GF.prices[p] + " ₽";
    $("#m-err").textContent = "";
    if (email) $("#email").value = email;
    modal.classList.add("open");
    setTimeout(() => $("#email").focus(), 50);
  };
  $$("[data-plan]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(b.dataset.plan); }));
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
    btn.disabled = true; btn.textContent = "Создаю заказ…"; $("#m-err").textContent = "";
    try {
      const r = await fetch(GF.api + "/pay-create", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: GF.anon, Authorization: "Bearer " + GF.anon },
        body: JSON.stringify({ email: $("#email").value, plan, method }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Ошибка " + r.status);
      try { localStorage.setItem("gf-last-order", j.order_id); } catch {}
      location.href = j.pay_url;
    } catch (err) {
      $("#m-err").textContent = err.message || String(err);
      btn.disabled = false; btn.textContent = "Перейти к оплате";
    }
  });

  // Ссылка из программы: ?upgrade=почта
  const qs = new URLSearchParams(location.search);
  if (qs.get("upgrade") !== null) open("upgrade", qs.get("upgrade"));
})();
