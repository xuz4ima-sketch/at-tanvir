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
  var ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 6l6 6-6 6"/></svg>';
  var ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.7-.1 1.4Z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M21.9 4.2 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6.1 13.5 1.2 12c-1.1-.3-1.1-1 .2-1.6L20.5 3c.9-.3 1.7.2 1.4 1.2Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>'
  };

  /* ---------- Каталог ---------- */
  function buildCatalog() {
    var grid = $("#catalogGrid");
    BOOKS.forEach(function (b) {
      var card = el("article", "book reveal");
      card.dataset.id = b.id;

      var body = el("div", "book__body");
      var title = el("h3", "book__title", b.title);
      title.title = b.title;   // название обрезается до двух строк, полностью видно во всплывающей подсказке
      var author = el("p", "book__author", b.author);
      author.title = b.author;
      body.append(title, author);
      if (b.note) body.append(el("p", "book__note", b.note));

      var buy = el("div", "book__buy");
      buy.append(el("div", "price", rub(b.price)), el("div", "book__slot"));
      body.append(buy);

      card.append(bookMedia(b), body);
      grid.append(card);
    });
  }

  // Фото книги с метками поверх. Если фото несколько: лента со свайпом, стрелки и точки внизу
  function bookMedia(b) {
    var photos = b.images && b.images.length ? b.images : [b.image];
    var media = el("div", "book__media");
    var track = el("div", "book__track");
    photos.forEach(function (src, i) {
      var slide = el("div", "book__slide");
      var img = document.createElement("img");
      img.src = src; img.loading = "lazy"; img.width = 640; img.height = 800;
      img.alt = i === 0 ? "Обложка книги «" + b.title + "»" : "Фото " + (i + 1) + " книги «" + b.title + "»";
      slide.append(img);
      track.append(slide);
    });
    media.append(track);

    // Слева метки товара («Под заказ» ставится по preorder), справа одна метка badge, например формат
    var tags = (b.preorder ? ["Под заказ"] : []).concat(b.tags || []);
    if (tags.length || b.badge) {
      var pills = el("div", "book__pills");
      var left = el("div", "book__tags");
      tags.forEach(function (t) { left.append(el("span", "pill", t)); });
      pills.append(left);
      if (b.badge) pills.append(el("span", "pill book__badge", b.badge));
      media.append(pills);
    }

    if (photos.length > 1) {
      track.setAttribute("aria-label", "Фото книги «" + b.title + "»");
      track.tabIndex = 0;   // ленту можно листать стрелками клавиатуры
      var prev = el("button", "book__nav book__nav--prev");
      var next = el("button", "book__nav book__nav--next");
      prev.type = next.type = "button";
      prev.innerHTML = ARROW.replace("M10 6l6 6-6 6", "M14 6l-6 6 6 6");
      next.innerHTML = ARROW;
      prev.setAttribute("aria-label", "Предыдущее фото");
      next.setAttribute("aria-label", "Следующее фото");
      var dots = el("div", "book__dots");
      dots.setAttribute("aria-hidden", "true");
      photos.forEach(function () { dots.append(el("span", "book__dot")); });

      var mark = function (i) {
        Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("is-active", k === i); });
        prev.disabled = i === 0;
        next.disabled = i === photos.length - 1;
      };
      var current = function () { return Math.round(track.scrollLeft / (track.clientWidth || 1)); };
      // Стрелки отмечают точку сразу и не дают плавной прокрутке перебивать её по дороге; свайп — по ходу прокрутки
      var target = null;
      var go = function (step) {
        var i = Math.max(0, Math.min(photos.length - 1, (target != null ? target : current()) + step));
        target = i;
        track.scrollTo({ left: i * track.clientWidth });
        mark(i);
      };
      prev.addEventListener("click", function () { go(-1); });
      next.addEventListener("click", function () { go(1); });
      track.addEventListener("scroll", function () {
        if (target != null) { if (current() === target) target = null; return; }
        mark(current());
      }, { passive: true });
      track.addEventListener("pointerdown", function () { target = null; });   // свайп отменяет переход по стрелке
      mark(0);
      media.append(prev, next, dots);
    }
    return media;
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
        add.innerHTML = '<span>В корзину</span><span class="add-btn__icon">' + CART_PLUS + "</span>";
        add.type = "button"; add.dataset.act = "add"; add.dataset.id = b.id;
        add.setAttribute("aria-label", "Добавить в корзину: " + b.title);
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
    REVIEWS.forEach(function (r) {
      var card = el("figure", "review reveal");
      card.append(el("blockquote", "review__text", r.text));
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
  // Спокойное появление: элементы .reveal один раз проявляются, когда входят в экран. Здесь только
  // наблюдение (IntersectionObserver), сама анимация в style.css, раздел «Появление при прокрутке».
  // Вошедшие в экран вместе получают задержку с шагом 0.08с и идут каскадом.
  // На десктопе фото библиотеки и свечение первого экрана отстают от прокрутки на 18% (параллакс).
  // Секции складываются стопкой листов: следующий наезжает на предыдущий, тот уменьшается и темнеет (initStack).
  // Прокрутку не перехватываем. При «уменьшить движение» в системе всё видно сразу и ничего не двигается.
  var header = $(".header");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STAGGER = 0.08, MAX_DELAY = 0.48, PARALLAX = 0.18;

  function initHeader() {
    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      var shown = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      // Каскад идёт в порядке страницы: слева направо и сверху вниз
      shown.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      shown.forEach(function (n, i) {
        n.style.setProperty("--delay", Math.min(i * STAGGER, MAX_DELAY).toFixed(2) + "s");
        n.classList.add("is-visible");
        io.unobserve(n);
      });
    }, { rootMargin: "0px 0px -8% 0px" });   // срабатывает, когда элемент чуть поднялся над нижним краем экрана
    nodes.forEach(function (n) { io.observe(n); });
  }

  function initParallax() {
    var hero = $(".hero"), wide = window.matchMedia("(min-width: 900px)");
    var heroH = 1, last = "", queued = false;

    function frame() {
      queued = false;
      // Ниже первого экрана сдвиг уже не виден, дальше его не пересчитываем
      var v = wide.matches ? (Math.min(window.scrollY, heroH) * PARALLAX).toFixed(1) + "px" : "0px";
      if (v !== last) { hero.style.setProperty("--parallax", v); last = v; }
    }
    function measure() { heroH = hero.offsetHeight || 1; frame(); }

    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    }, { passive: true });
    window.addEventListener("resize", measure);
    measure();
  }

  // Стопка листов (style.css, «Листы при прокрутке»): прямые дети .stack, то есть секции и группы секций.
  // Лист останавливается (sticky): высокий, когда его низ дошёл до низа экрана, короткий сразу под шапкой.
  // Пока следующий лист поднимается от этого места до шапки, --cover растёт от 0 до 1.
  // Позиции считаем по обычному потоку один раз (и при смене размеров),
  // поэтому в кадре прокрутки раскладку не читаем.
  function initStack() {
    var stack = $(".stack");
    var items = Array.prototype.slice.call(stack.children);
    var tops = [], sticks = [], starts = [], covers = [], headH = 0, queued = false;

    function frame() {
      queued = false;
      var y = window.scrollY;
      for (var i = 0; i < items.length - 1; i++) {
        var at = tops[i + 1] - y;   // где сейчас на экране верх следующей секции
        var c = Math.min(Math.max((starts[i] - at) / Math.max(starts[i] - headH, 1), 0), 1).toFixed(3);
        if (c !== covers[i]) { items[i].style.setProperty("--cover", c); covers[i] = c; }
      }
    }
    function measure() {
      var vh = document.documentElement.clientHeight;   // без адресной строки телефона, поэтому не прыгает
      var y = stack.getBoundingClientRect().top + window.scrollY;
      headH = header.offsetHeight;
      items.forEach(function (s, i) {
        var h = s.offsetHeight;
        y += parseFloat(getComputedStyle(s).marginTop) || 0;   // лист заходит на предыдущую секцию
        tops[i] = y;
        y += h;
        sticks[i] = Math.min(headH, vh - h);
        s.style.top = sticks[i] + "px";
        // Видимая часть остановившегося листа: от точки у шапки до его низа. К этой точке лист уменьшается,
        // по этой части идёт затемнение с размытием
        var seen = Math.max(0, h - (vh - headH));
        s.style.setProperty("--seen", seen + "px");
        s.style.setProperty("--seen-h", h - seen + "px");
      });
      // Где на экране верх следующей секции в момент, когда эта остановилась: отсюда начинается накрытие
      for (var i = 0; i < items.length - 1; i++) starts[i] = tops[i + 1] - tops[i] + sticks[i];
      frame();
    }

    // Браузер ведёт ссылку к секции туда, где она сейчас остановилась, а не к её месту в потоке.
    // Поэтому переходы по ссылкам на разделы считаем сами. Секция бывает листом или лежит в группе
    // (тогда offsetTop отсчитан от группы: она sticky, то есть позиционирована). Нижняя секция группы
    // не поднимется к шапке: группа остановится раньше. Тогда едем до остановки, пока следующий лист не наехал
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      var target = a && document.getElementById(a.getAttribute("href").slice(1));
      var i = -1;
      items.forEach(function (s, k) { if (target && s.contains(target)) i = k; });
      if (!target || (i < 0 && target !== header)) return;
      e.preventDefault();
      var y = i < 0 ? 0 : tops[i] + (target === items[i] ? 0 : target.offsetTop) - headH;
      if (i >= 0 && i < items.length - 1) y = Math.min(y, tops[i] - sticks[i]);
      window.scrollTo({ top: Math.max(y, 0), behavior: "smooth" });
      history.pushState(null, "", a.getAttribute("href"));
    });

    stack.classList.add("is-stacked");
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    }, { passive: true });
    window.addEventListener("resize", measure);
    // Высота секций меняется после загрузки шрифтов и фото: тогда пересчитываем
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(measure);
      items.forEach(function (s) { ro.observe(s); });
    }
    measure();
  }

  /* ---------- Старт ---------- */
  $("#year").textContent = new Date().getFullYear();
  buildCatalog();
  buildReviews();
  buildContacts();
  render();
  initHeader();
  initReveal();
  if (!reduceMotion) { initParallax(); initStack(); }
})();
