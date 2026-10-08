// panneau de brassage : survol, focus ou toucher d'une prise = ses cables s'allument
(function () {
  var bloc = document.querySelector(".brassage");
  if (!bloc) return;
  var lecture = bloc.querySelector(".lecture");
  var texteDefaut = lecture.innerHTML;
  var panneaux = bloc.querySelectorAll(".panneau");
  var fige = null;

  function noms(selector, attr, valeurs, svg) {
    var vus = [];
    valeurs.forEach(function (v) {
      var el = svg.querySelector(selector + '[' + attr + '="' + v + '"]');
      if (el && vus.indexOf(el.getAttribute("aria-label").split(",")[0]) < 0) vus.push(el.getAttribute("aria-label").split(",")[0].replace(" (en cours)", ""));
    });
    return vus;
  }

  function allumer(type, valeur) {
    panneaux.forEach(function (svg) {
      svg.classList.add("filtre");
      var lies = [];
      svg.querySelectorAll(".cable").forEach(function (c) {
        var ok = c.dataset[type] === valeur;
        c.classList.toggle("allume", ok);
        if (ok) lies.push(type === "s" ? c.dataset.p : c.dataset.s);
      });
      svg.querySelectorAll(".port").forEach(function (p) {
        var cle = p.dataset.s !== undefined ? "s" : "p";
        p.classList.toggle("allume", (cle === type && p.dataset[cle] === valeur) || (cle !== type && lies.indexOf(p.dataset[cle]) >= 0));
      });
      if (svg.getClientRects().length) {
        var source = svg.querySelector(".port[data-" + type + '="' + valeur + '"]').getAttribute("aria-label").split(",")[0].replace(" (en cours)", "");
        var autres = type === "s" ? noms(".port-p", "data-p", lies, svg) : noms(".port-s", "data-s", lies, svg);
        lecture.innerHTML = autres.length
          ? "<strong>" + source + "</strong> : " + autres.join(", ")
          : "<strong>" + source + "</strong> : pas encore de projet en ligne ici";
      }
    });
  }

  function eteindre() {
    if (fige) return allumer(fige[0], fige[1]);
    panneaux.forEach(function (svg) {
      svg.classList.remove("filtre");
      svg.querySelectorAll(".allume").forEach(function (e) { e.classList.remove("allume"); });
    });
    lecture.innerHTML = texteDefaut;
  }

  bloc.querySelectorAll(".port").forEach(function (port) {
    var type = port.dataset.s !== undefined ? "s" : "p";
    var valeur = port.dataset[type];
    port.addEventListener("pointerenter", function () { allumer(type, valeur); });
    port.addEventListener("pointerleave", eteindre);
    port.addEventListener("focus", function () { allumer(type, valeur); });
    port.addEventListener("blur", eteindre);
    if (type === "s") {
      var basculer = function () {
        fige = fige && fige[1] === valeur ? null : ["s", valeur];
        bloc.querySelectorAll('.port-s').forEach(function (p) { p.setAttribute("aria-pressed", fige && p.dataset.s === fige[1] ? "true" : "false"); });
        if (fige) allumer("s", valeur); else eteindre();
      };
      port.addEventListener("click", basculer);
      port.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); basculer(); }
      });
    }
  });

  // branchement des cables, une seule fois au chargement, puis on retire la classe
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!calme) {
    var nb = bloc.querySelectorAll(".panneau-h .cable").length;
    panneaux.forEach(function (svg) { svg.classList.add("branche"); });
    setTimeout(function () {
      panneaux.forEach(function (svg) { svg.classList.remove("branche"); });
    }, nb * 70 + 1200);
  }
})();

// frise du parcours : une station survolee, focalisee ou touchee affiche son detail
(function () {
  var zone = document.querySelector(".frise-zone");
  if (!zone) return;
  var bulle = zone.querySelector(".bulle");
  var items = document.querySelectorAll(".etapes li");
  var fixe = null;

  function montrer(st) {
    var cle = st.dataset.st;
    var d = st.dataset;
    var ligne = st.classList.contains("l-form") ? "l-form" : "l-exp";
    bulle.className = "bulle " + ligne;
    bulle.innerHTML = "<strong>" + d.role + "</strong><span class=\"b-dates\">" + d.dates + "</span><br><span class=\"b-lieu\">" + d.lieu + "</span>"
      + (d.detail ? "<br><span class=\"b-detail\">" + d.detail + "</span>" : "");
    bulle.hidden = false;
    var z = zone.getBoundingClientRect();
    var r = st.querySelector(".arret").getBoundingClientRect();
    var x = r.left + r.width / 2 - z.left - bulle.offsetWidth / 2;
    x = Math.max(8, Math.min(x, zone.clientWidth - bulle.offsetWidth - 8));
    var y = r.top - z.top - bulle.offsetHeight - 14;
    if (y < 4) y = r.bottom - z.top + 14;
    bulle.style.left = x + "px";
    bulle.style.top = y + "px";
    zone.querySelectorAll(".station").forEach(function (s) { s.classList.toggle("actif", s.dataset.st === cle); });
    items.forEach(function (i) {
      i.classList.toggle("actif", i.dataset.st === cle);
      i.classList.toggle("l-form", i.dataset.st === cle && ligne === "l-form");
      i.classList.toggle("l-exp", i.dataset.st === cle && ligne === "l-exp");
    });
  }

  function cacher() {
    if (fixe) return montrer(fixe);
    bulle.hidden = true;
    zone.querySelectorAll(".station.actif").forEach(function (s) { s.classList.remove("actif"); });
    items.forEach(function (i) { i.classList.remove("actif", "l-form", "l-exp"); });
  }

  zone.querySelectorAll(".station").forEach(function (st) {
    st.addEventListener("pointerenter", function () { montrer(st); });
    st.addEventListener("pointerleave", cacher);
    st.addEventListener("focus", function () { montrer(st); });
    st.addEventListener("blur", cacher);
    var basculer = function () {
      fixe = fixe === st ? null : st;
      if (fixe) montrer(st); else cacher();
    };
    st.addEventListener("click", basculer);
    st.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); basculer(); }
      if (e.key === "Escape") { fixe = null; cacher(); }
    });
  });
})();
