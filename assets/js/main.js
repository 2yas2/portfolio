// petites interactions du site, toutes declenchees par l'utilisateur (sauf le branchement des cables au chargement)
(function () {
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // navigation : etiquette de la section visible
  var etiqs = document.querySelectorAll(".nav-liste .etiq[href*='#']");
  if ("IntersectionObserver" in window && etiqs.length) {
    var parId = {};
    etiqs.forEach(function (e) { parId[e.hash.slice(1)] = e; });
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (en.isIntersecting && parId[en.target.id]) {
          etiqs.forEach(function (e) { e.classList.remove("actif"); e.removeAttribute("aria-current"); });
          parId[en.target.id].classList.add("actif");
          parId[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(parId).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }
  var menu = document.querySelector(".nav-mobile");
  if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a")) menu.removeAttribute("open"); });

  // panneau de brassage
  var bloc = document.querySelector(".baie-panneau");
  if (bloc) {
    var lecture = bloc.querySelector(".lecture");
    var defaut = lecture.innerHTML;
    var panneaux = bloc.querySelectorAll(".panneau");
    var fige = null;
    var nomDe = function (svg, sel) { var el = svg.querySelector(sel); return el ? el.getAttribute("aria-label").split(" :")[0].replace(" (en cours)", "") : ""; };
    var allumer = function (type, val) {
      panneaux.forEach(function (svg) {
        svg.classList.add("filtre");
        var lies = [];
        svg.querySelectorAll(".cable").forEach(function (c) {
          var ok = c.dataset[type] === val;
          c.classList.toggle("allume", ok);
          if (ok) lies.push(type === "s" ? c.dataset.p : c.dataset.s);
        });
        svg.querySelectorAll(".port").forEach(function (p) {
          var k = p.dataset.s !== undefined ? "s" : "p";
          p.classList.toggle("allume", (k === type && p.dataset[k] === val) || (k !== type && lies.indexOf(p.dataset[k]) >= 0));
        });
        if (svg.getClientRects().length) {
          var source = nomDe(svg, ".port[data-" + type + '="' + val + '"]');
          var autres = lies.filter(function (v, i) { return lies.indexOf(v) === i; }).map(function (v) {
            return nomDe(svg, type === "s" ? '.port-p[data-p="' + v + '"]' : '.port-s[data-s="' + v + '"]');
          });
          lecture.innerHTML = "<strong>" + source + "</strong> : " + (autres.length ? autres.join(", ") : "pas encore de projet en ligne");
        }
      });
    };
    var eteindre = function () {
      if (fige) return allumer("s", fige);
      panneaux.forEach(function (svg) { svg.classList.remove("filtre"); svg.querySelectorAll(".allume").forEach(function (e) { e.classList.remove("allume"); }); });
      lecture.innerHTML = defaut;
    };
    bloc.querySelectorAll(".port").forEach(function (port) {
      var type = port.dataset.s !== undefined ? "s" : "p";
      var val = port.dataset[type];
      port.addEventListener("pointerenter", function () { allumer(type, val); });
      port.addEventListener("pointerleave", eteindre);
      port.addEventListener("focus", function () { allumer(type, val); });
      port.addEventListener("blur", eteindre);
      if (type === "s") {
        var basculer = function () {
          fige = fige === val ? null : val;
          bloc.querySelectorAll(".port-s").forEach(function (p) { p.setAttribute("aria-pressed", fige && p.dataset.s === fige ? "true" : "false"); });
          if (fige) allumer("s", val); else eteindre();
        };
        port.addEventListener("click", basculer);
        port.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); basculer(); } });
      }
    });
    if (!calme) {
      var n = bloc.querySelectorAll(".panneau-h .cable").length;
      panneaux.forEach(function (svg) { svg.classList.add("branche"); });
      setTimeout(function () { panneaux.forEach(function (svg) { svg.classList.remove("branche"); }); }, n * 55 + 1400);
    }
  }

  // filtres des projets
  var filtres = document.querySelectorAll(".filtre");
  if (filtres.length) {
    var cartes = document.querySelectorAll("[data-etat]");
    var etat = document.querySelector(".filtre-etat");
    filtres.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.dataset.filtre;
        filtres.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var vus = 0;
        cartes.forEach(function (c) {
          var ok = f === "tous" || c.dataset.etat === f || c.dataset.cat.split(" ").indexOf(f) >= 0;
          c.hidden = !ok;
          if (ok) vus++;
        });
        document.querySelectorAll(".groupe-projets").forEach(function (g) {
          var visibles = g.querySelectorAll("[data-etat]:not([hidden])").length;
          g.hidden = visibles === 0;
          var zone = g.closest("[data-groupe-zone]");
          if (zone) zone.hidden = visibles === 0;
        });
        etat.textContent = vus + " projet" + (vus > 1 ? "s" : "") + " affiché" + (vus > 1 ? "s" : "");
      });
    });
  }

  // frise du parcours
  var zone = document.querySelector(".frise-zone");
  if (zone) {
    var bulle = zone.querySelector(".bulle");
    var items = document.querySelectorAll(".etapes li[data-st]");
    var fixe = null;
    var montrer = function (st) {
      var cle = st.dataset.st;
      var li = document.querySelector('.etapes li[data-st="' + cle + '"]');
      var ligne = st.classList.contains("l-form") ? "l-form" : "l-exp";
      bulle.className = "bulle " + ligne;
      bulle.innerHTML = "<strong>" + li.querySelector("strong").textContent + "</strong><span class=\"b-dates\">" + li.querySelector(".etape-date").textContent + "</span><span class=\"b-lieu\">" + li.querySelector(".etape-lieu").textContent + "</span>"
        + (li.querySelector(".etape-missions") ? "<span class=\"b-missions\">" + li.querySelector(".etape-missions").textContent + "</span>" : "");
      bulle.hidden = false;
      var z = zone.getBoundingClientRect(), r = st.querySelector(".arret").getBoundingClientRect();
      var x = r.left + r.width / 2 - z.left - bulle.offsetWidth / 2;
      x = Math.max(8, Math.min(x, zone.clientWidth - bulle.offsetWidth - 8));
      var y = r.top - z.top - bulle.offsetHeight - 12;
      if (y < 4) y = r.bottom - z.top + 12;
      bulle.style.left = x + "px";
      bulle.style.top = y + "px";
      zone.querySelectorAll(".station").forEach(function (s) { s.classList.toggle("actif", s.dataset.st === cle); });
      items.forEach(function (i) { i.classList.toggle("actif", i.dataset.st === cle); });
    };
    var cacher = function () {
      if (fixe) return montrer(fixe);
      bulle.hidden = true;
      zone.querySelectorAll(".station.actif").forEach(function (s) { s.classList.remove("actif"); });
      items.forEach(function (i) { i.classList.remove("actif"); });
    };
    zone.querySelectorAll(".station").forEach(function (st) {
      st.addEventListener("pointerenter", function () { montrer(st); });
      st.addEventListener("pointerleave", cacher);
      st.addEventListener("focus", function () { montrer(st); });
      st.addEventListener("blur", cacher);
      var basculer = function () { fixe = fixe === st ? null : st; if (fixe) montrer(st); else cacher(); };
      st.addEventListener("click", basculer);
      st.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); basculer(); }
        if (e.key === "Escape") { fixe = null; cacher(); }
      });
    });
  }

  // copier l'e-mail
  document.querySelectorAll(".copier").forEach(function (b) {
    b.addEventListener("click", function () {
      var txt = b.dataset.copie, ok = b.closest(".contact-mail").querySelector(".copie-ok");
      var fini = function (m) { ok.textContent = m; setTimeout(function () { ok.textContent = ""; }, 4000); };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(function () { fini("Adresse copiée dans le presse-papiers."); }, function () { fini("Copie impossible : sélectionnez l'adresse à la main."); });
      } else { fini("Copie impossible : sélectionnez l'adresse à la main."); }
    });
  });

  // formulaire de contact : validation et envoi a formspree, avec repli classique sans javascript
  var form = document.querySelector(".formulaire");
  if (form) {
    var etatEnvoi = form.querySelector(".etat-envoi");
    var regles = [
      ["f-nom", "e-nom", function (v) { return v.trim().length >= 2 ? "" : "Indiquez votre nom."; }],
      ["f-email", "e-email", function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Indiquez une adresse e-mail valide, par exemple nom@domaine.fr."; }],
      ["f-objet", "e-objet", function (v) { return v ? "" : "Choisissez l'objet du message."; }],
      ["f-message", "e-message", function (v) { return v.trim().length >= 10 ? "" : "Écrivez un message d'au moins 10 caractères."; }],
      ["f-accord", "e-accord", function (v, el) { return el.checked ? "" : "Cochez la case pour que je puisse vous répondre."; }],
    ];
    var verifier = function (r) {
      var el = document.getElementById(r[0]), msg = r[2](el.value, el);
      document.getElementById(r[1]).textContent = msg;
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg) el.setAttribute("aria-describedby", r[1]); else el.removeAttribute("aria-describedby");
      return !msg;
    };
    regles.forEach(function (r) { document.getElementById(r[0]).addEventListener("blur", function () { verifier(r); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = regles.map(verifier).every(Boolean);
      if (!ok) { var premier = form.querySelector('[aria-invalid="true"]'); if (premier) premier.focus(); return; }
      var bouton = form.querySelector("button[type=submit]");
      bouton.disabled = true;
      etatEnvoi.className = "etat-envoi";
      etatEnvoi.textContent = "Envoi en cours…";
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          etatEnvoi.className = "etat-envoi ok";
          etatEnvoi.textContent = "Message envoyé, merci. Je vous réponds par e-mail.";
        })
        .catch(function () {
          etatEnvoi.className = "etat-envoi ko";
          etatEnvoi.innerHTML = "L'envoi n'a pas fonctionné. Vous pouvez m'écrire directement à <a href=\"mailto:yassine.aittalb123@gmail.com\">yassine.aittalb123@gmail.com</a>.";
        })
        .then(function () { bouton.disabled = false; });
    });
  }
})();

// visionneuse des captures (clavier : fleches et echap)
(function () {
  var dlg = document.querySelector(".visionneuse");
  var liens = Array.prototype.slice.call(document.querySelectorAll(".cap-lien"));
  if (!dlg || !liens.length || typeof dlg.showModal !== "function") return;
  var img = dlg.querySelector("img"), leg = dlg.querySelector("figcaption"), compte = dlg.querySelector(".vis-compte");
  var i = 0, origine = null;
  var montrer = function (k) {
    i = (k + liens.length) % liens.length;
    var a = liens[i];
    img.src = a.dataset.large;
    img.alt = a.querySelector("img").alt;
    leg.textContent = a.dataset.legende;
    compte.textContent = (i + 1) + " / " + liens.length;
  };
  liens.forEach(function (a, k) {
    a.addEventListener("click", function (e) { e.preventDefault(); origine = a; montrer(k); dlg.showModal(); });
  });
  dlg.querySelector(".vis-prec").addEventListener("click", function () { montrer(i - 1); });
  dlg.querySelector(".vis-suiv").addEventListener("click", function () { montrer(i + 1); });
  dlg.querySelector(".vis-fermer").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); montrer(i - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); montrer(i + 1); }
  });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { if (origine) origine.focus(); });
  if (liens.length < 2) { dlg.querySelector(".vis-prec").hidden = true; dlg.querySelector(".vis-suiv").hidden = true; }
})();
