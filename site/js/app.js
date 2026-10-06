(function () {
  "use strict";

  var SITE = window.SITE;
  var BOOKS = window.BOOKS;
  var REVIEWS = window.REVIEWS || [];
  var STORAGE_KEY = "attanvir_cart_v1";
  var MAX_QTY = 99;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var rub = function (n) { return n.toLocaleString("ru-RU").replace(/ /g, " ") + " ₽"; };
  var byId = {};
  BOOKS.forEach(function (b) { byId[b.id] = b; });

  /* ---------- Состояние корзины ---------- */
  var cart = loadCart();

  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      var clean = {};
      Object.keys(raw).forEach(function (id) {
        var q = Math.floor(Number(raw[id]));
        if (byId[id] && byId[id].inStock && q > 0) clean[id] = Math.min(q, MAX_QTY);
      });
      return clean;
    } catch (e) {
      return {};
    }
  }
  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* без хранилища работаем в памяти */ }
  }
  function setQty(id, q) {
    q = Math.max(0, Math.min(MAX_QTY, q));
    if (q === 0) delete cart[id]; else cart[id] = q;
    saveCart();
    render();
  }
  function totalCount() {
    return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0);
  }
  function totalSum() {
    return Object.keys(cart).reduce(function (s, id) { return s + cart[id] * byId[id].price; }, 0);
  }

  /* ---------- Вспомогательные построители ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function qtyControl(id, cls) {
    var box = el("div", "qty " + cls);
    var minus = el("button", "qty__btn", "−");
    minus.type = "button";
    minus.setAttribute("aria-label", "Уменьшить количество: " + byId[id].title);
    minus.dataset.act = "dec"; minus.dataset.id = id;
    var num = el("span", "qty__num", String(cart[id] || 0));
    num.setAttribute("aria-live", "polite");
    var plus = el("button", "qty__btn", "+");
    plus.type = "button";
    plus.setAttribute("aria-label", "Увеличить количество: " + byId[id].title);
    plus.dataset.act = "inc"; plus.dataset.id = id;
    box.append(minus, num, plus);
    return box;
  }
  var CART_PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2.4l2.1 11h9.6l2-8H6.2M9 20a1 1 0 1 0 0 .01M17 20a1 1 0 1 0 0 .01M12.8 9v4M10.8 11h4"/></svg>';
  var ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.7-.1 1.4Z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M21.9 4.2 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6.1 13.5 1.2 12c-1.1-.3-1.1-1 .2-1.6L20.5 3c.9-.3 1.7.2 1.4 1.2Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>'
  };

  /* ---------- Каталог ---------- */
  function buildCatalog() {
    var grid = $("#catalogGrid");
    BOOKS.forEach(function (b, i) {
      var card = el("article", "book");
      // Правая колонка поднимается из большей глубины: карточки приходят ступенькой
      card.dataset.rise = i % 2 ? 190 : 100;
      card.dataset.id = b.id;

      var cover = el("div", "book__cover");
      var img = document.createElement("img");
      img.src = b.image; img.alt = "Обложка книги «" + b.title + "»";
      img.loading = "lazy"; img.width = 600; img.height = 800;
      cover.append(img);

      var body = el("div", "book__body");
      if (b.preorder) body.append(el("p", "book__tag", "Под заказ"));
      body.append(el("h3", "book__title", b.title), el("p", "book__author", b.author));
      if (b.note) body.append(el("p", "book__note", b.note));

      var buy = el("div", "book__buy");
      var price = el("div", "price");
      price.textContent = b.price.toLocaleString("ru-RU").replace(/ /g, " ") + " ";
      price.append(el("small", null, "₽"));
      var slot = el("div", "book__slot");
      buy.append(price, slot);
      body.append(buy);

      card.append(cover, body);
      grid.append(card);
    });
  }

  function renderCatalog() {
    BOOKS.forEach(function (b) {
      var slot = $('.book[data-id="' + b.id + '"] .book__slot');
      var had = slot.contains(document.activeElement) ? document.activeElement.dataset.act : null;
      slot.textContent = "";
      if (!b.inStock) {
        var off = el("button", "add-btn", "Нет в наличии");
        off.disabled = true;
        slot.append(off);
      } else if (cart[b.id]) {
        slot.append(qtyControl(b.id, "qty--card"));
        if (had) { var again = slot.querySelector('[data-act="' + had + '"]'); if (again) again.focus(); }
      } else {
        var add = el("button", "add-btn");
        add.innerHTML = CART_PLUS + "<span>Добавить в корзину</span>";
        add.type = "button"; add.dataset.act = "add"; add.dataset.id = b.id;
        slot.append(add);
        if (had === "dec") add.focus();
      }
    });
  }

  /* ---------- Корзина ---------- */
  function renderCart() {
    var ids = Object.keys(cart);
    var list = $("#cartList");
    list.textContent = "";
    ids.forEach(function (id) {
      var b = byId[id];
      var li = el("li", "cart-item");
      var img = document.createElement("img");
      img.src = b.image; img.alt = ""; img.width = 64; img.height = 86;
      var info = el("div");
      info.append(el("p", "cart-item__title", b.title));
      var row = el("div", "cart-item__row");
      row.append(qtyControl(id, "qty--cart"), el("span", "cart-item__sum", rub(b.price * cart[id])));
      var rm = el("button", "remove", "Удалить");
      rm.type = "button"; rm.dataset.act = "del"; rm.dataset.id = id;
      rm.setAttribute("aria-label", "Удалить из корзины: " + b.title);
      info.append(row, rm);
      li.append(img, info);
      list.append(li);
    });
    $("#cartEmpty").hidden = ids.length > 0;
    $("#orderForm").hidden = ids.length === 0;
    $("#cartTotal").textContent = rub(totalSum());
  }

  function renderBadge() {
    var n = totalCount();
    var badge = $("#cartCount");
    badge.textContent = String(n);
    $("#openCart").setAttribute("aria-label", "Открыть корзину, книг: " + n);
  }

  function render() {
    renderCatalog();
    renderCart();
    renderBadge();
  }

  /* ---------- Отзывы и контакты ---------- */
  function buildReviews() {
    var box = $("#reviewsList");
    REVIEWS.forEach(function (r, i) {
      var card = el("figure", "review");
      card.dataset.rise = [80, 160, 120][i % 3];
      card.append(el("blockquote", "review__text", r.text), el("figcaption", "review__author", r.author));
      box.append(card);
    });
  }

  function buildContacts() {
    var box = $("#contactsList");
    var items = [
      { key: "whatsapp", title: "WhatsApp", sub: "Написать напрямую", href: waLink("Ассаламу алейкум! У меня вопрос по книгам.") },
      { key: "telegram", title: "Telegram", sub: "Наш канал и чат", href: SITE.telegram },
      { key: "instagram", title: "Instagram", sub: "@" + SITE.instagramHandle, href: SITE.instagram }
    ];
    items.forEach(function (it) {
      var a = el("a", "contact");
      a.href = it.href; a.target = "_blank"; a.rel = "noopener noreferrer";
      var icon = el("span", "contact__icon"); icon.innerHTML = ICONS[it.key];
      var txt = el("span");
      txt.append(el("span", "contact__title", it.title), el("span", "contact__sub", it.sub));
      a.append(icon, txt);
      box.append(a);
    });
  }

  /* ---------- Drawer ---------- */
  var drawer = $("#drawer"), overlay = $("#overlay"), lastFocus = null;

  function openCart() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add("is-open"); });
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock");
    drawer.focus();
  }
  function closeCart() {
    overlay.classList.remove("is-open");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock");
    setTimeout(function () { overlay.hidden = true; }, 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function isOpen() { return drawer.classList.contains("is-open"); }

  document.addEventListener("keydown", function (e) {
    if (!isOpen()) return;
    if (e.key === "Escape") { closeCart(); return; }
    if (e.key !== "Tab") return;
    var f = drawer.querySelectorAll('button, input, textarea, a[href], [tabindex]:not([tabindex="-1"])');
    f = Array.prototype.filter.call(f, function (n) { return !n.disabled && n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === drawer)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- Действия ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t) return;
    var id = t.dataset.id, act = t.dataset.act;
    if (act === "add") { setQty(id, 1); bump(); }
    else if (act === "inc") { setQty(id, (cart[id] || 0) + 1); }
    else if (act === "dec") { setQty(id, (cart[id] || 0) - 1); }
    else if (act === "del") { setQty(id, 0); }
  });
  function bump() {
    var b = $("#openCart");
    b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
  $("#openCart").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  /* ---------- Форма и WhatsApp ---------- */
  var form = $("#orderForm");

  function syncDeliveryLabel() {
    var d = form.elements.delivery.value;
    $("#addressLabel").textContent = d === "Ozon" ? "Пункт выдачи Ozon (адрес или код)" : "Адрес и индекс или отделение Почты России";
  }
  form.addEventListener("change", function (e) { if (e.target.name === "delivery") syncDeliveryLabel(); });
  syncDeliveryLabel();

  function waLink(text) {
    return "https://wa.me/" + SITE.whatsapp + "?text=" + encodeURIComponent(text);
  }
  function waConfigured() {
    return /^\d{11,15}$/.test(SITE.whatsapp) && !/^70{7,}/.test(SITE.whatsapp);
  }

  function setErr(name, msg) {
    var span = form.querySelector('[data-err="' + name + '"]');
    var input = form.elements[name];
    if (span) span.textContent = msg || "";
    if (input) { input.classList.toggle("invalid", !!msg); if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid"); }
  }
  function validate() {
    var v = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      city: form.elements.city.value.trim(),
      address: form.elements.address.value.trim()
    };
    var digits = v.phone.replace(/\D/g, "");
    var errs = {};
    if (v.name.length < 2) errs.name = "Укажите имя";
    if (digits.length < 10 || digits.length > 15 || !/^[\d\s()+\-.]+$/.test(v.phone)) errs.phone = "Укажите телефон, например +7 900 000-00-00";
    if (v.city.length < 2) errs.city = "Укажите город";
    if (v.address.length < 3) errs.address = "Укажите адрес или пункт выдачи";
    ["name", "phone", "city", "address"].forEach(function (k) { setErr(k, errs[k]); });
    var first = Object.keys(errs)[0];
    if (first) form.elements[first].focus();
    return !first;
  }

  function buildMessage() {
    var lines = ["Ассаламу алейкум! Хочу заказать:", ""];
    Object.keys(cart).forEach(function (id, i) {
      var b = byId[id];
      lines.push((i + 1) + ". " + b.title + " × " + cart[id] + " — " + rub(b.price * cart[id]));
    });
    lines.push("", "Итого за книги: " + rub(totalSum()), "",
      "Имя: " + form.elements.name.value.trim(),
      "Телефон: " + form.elements.phone.value.trim(),
      "Доставка: " + form.elements.delivery.value,
      "Город: " + form.elements.city.value.trim(),
      "Адрес / пункт выдачи: " + form.elements.address.value.trim());
    var c = form.elements.comment.value.trim();
    if (c) lines.push("Комментарий: " + c);
    return lines.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var status = $("#formStatus");
    status.textContent = "";
    if (!totalCount()) { status.textContent = "Корзина пуста"; return; }
    if (!validate()) return;
    if (!waConfigured()) { status.textContent = "Номер WhatsApp магазина ещё не указан. Напишите нам в Telegram или Instagram."; return; }
    var url = waLink(buildMessage());
    var w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
  });
  ["name", "phone", "city", "address"].forEach(function (k) {
    form.elements[k].addEventListener("input", function () { setErr(k, ""); });
  });

  /* ---------- Движение ---------- */
  // Всё привязано к положению прокрутки, а не ко времени, поэтому при прокрутке назад движение идёт обратно.
  // Первый экран: текст уходит вверх быстрее страницы и гаснет, каллиграфия и узор отстают (параллакс).
  // Элементы с data-rise="N" поднимаются из глубины N пикселей, пока входят в экран. Разная глубина
  // у соседей даёт ступеньку. На тёмном фоне они ещё и выходят из тени. Прогресс 0…1 пишется в --p,
  // от него раскрываются орнамент, золотая линия над шагом и ромб над отзывом.
  var header = $(".header");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function initMotion() {
    var hero = $(".hero"), heroBg = $(".hero__layer"), heroText = $(".hero__text"), heroArt = $(".hero__art");
    var risers = Array.prototype.slice.call(document.querySelectorAll("[data-rise]"));
    var items = [], heroH = 1, vh = 1, maxScroll = 1, queued = false;

    function measure() {
      var y = window.scrollY;
      var w = window.innerWidth;
      var depthScale = w < 640 ? 0.55 : w < 900 ? 0.75 : 1;
      vh = window.innerHeight;
      heroH = hero.offsetHeight || 1;
      maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
      items = risers.map(function (n) {
        // Положение без нашего сдвига: из координат вычитаем текущий translateY
        var top = n.getBoundingClientRect().top + y - (n._shift || 0);
        var start = top - vh;                                   // верх элемента у нижнего края экрана
        var end = Math.min(top - vh * 0.3, maxScroll);          // поднялся на 30% экрана, либо конец страницы
        if (end <= start) end = start + 1;
        return { node: n, start: start, end: end, depth: Number(n.dataset.rise) * depthScale, dark: !!n.closest(".tone-dark") };
      });
      frame();
    }

    function frame() {
      queued = false;
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 8);

      if (y <= heroH) {
        var h = clamp(y / heroH);
        // Каллиграфия стоит над названием и уходит вверх быстрее него, поэтому они не наезжают друг на друга
        heroText.style.transform = "translate3d(0," + (-y * 0.18).toFixed(1) + "px,0)";
        heroText.style.opacity = clamp(1 - h * 1.5).toFixed(3);
        heroArt.style.transform = "translate3d(0," + (-y * 0.3).toFixed(1) + "px,0) scale(" + (1 - h * 0.08).toFixed(4) + ")";
        heroArt.style.opacity = clamp(1 - h * 1.15).toFixed(3);
        heroBg.style.transform = "translate3d(0," + (y * 0.4).toFixed(1) + "px,0)";
      }

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var q = clamp((y - it.start) / (it.end - it.start));
        var e = easeOut(q);
        var shift = (1 - e) * it.depth;
        var s = it.node.style;
        it.node._shift = shift;
        s.transform = shift > 0.1 ? "translate3d(0," + shift.toFixed(1) + "px,0)" : "";
        s.opacity = q < 0.66 ? (q * 1.5).toFixed(3) : "";
        if (it.dark) s.filter = e < 0.995 ? "brightness(" + (0.3 + 0.7 * e).toFixed(3) + ")" : "";
        s.setProperty("--p", e.toFixed(3));
      }
    }

    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    }

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    // Высота страницы меняется (догрузились обложки, шрифты): пересчитываем позиции
    if ("ResizeObserver" in window) new ResizeObserver(function () { measure(); }).observe(document.body);
    measure();
  }

  function initStatic() {
    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Старт ---------- */
  $("#year").textContent = new Date().getFullYear();
  buildCatalog();
  buildReviews();
  buildContacts();
  render();
  if (reduceMotion) initStatic(); else initMotion();
})();
