"use strict";
// =================================================== //
// ================ Globale Variablen ================ //
// =================================================== //

// esLint Globals:
/* global $ GLOBALS hashData listStudents listLeistung
db_readMultiData db_readKlasse db_dropKlasse db_simpleUpdate db_dynamicUpdate db_deleteDoc db_readGeneric
sync_getAccount sync_deleteKlasse sync_pushBack sync_getKlasse*/

var SETTINGS;

window.addEventListener('load', function () {

	// Allgemeine EventListener
	window.addEventListener('online', setOnlineStatus);
	window.addEventListener('offline', setOnlineStatus);

	// Init Vars
	GLOBALS.noSyncCols = ["vorjahr"];
	setOnlineStatus();

	// Not the First Time ?
	if (localStorage.getItem('TeacherTab')) {
		// DB Support und Init
		GLOBALS.userID = localStorage.getItem('userID');
		GLOBALS.passW = localStorage.getItem('passW');
		GLOBALS.klasse = sessionStorage.getItem('klasse');
		GLOBALS.dbname = GLOBALS.userID;
		GLOBALS.dbversion = parseInt(localStorage.getItem("dbversion_" + GLOBALS.userID));
		GLOBALS.knownDevice = true;
	} else {
		// kein DB Init
		GLOBALS.knownDevice = false;
	}

	// Links bleiben in WebApp
	$.stayInWebApp('a.stay');

	// Anmeldestatus
	checkAuth();

});


// =================================================== //
// ================ Event - Listeners ================ //
// =================================================== //

function addListener() {
	var add = document.getElementById('btn_Add');
	add.onclick = function () {
		popUp(add.getAttribute('data-name'));
	};
}

function closeListener() {
	// Close 'X':
	var closeX = document.getElementsByClassName('close');
	var i;
	for (i = 0; i < closeX.length; i++) {
		closeX[i].getElementsByTagName('a')[0].onclick = function () {
			popUpClose(this);
		};
	}
}

function setOnlineStatus(evt) {
	var status = navigator.onLine;
	GLOBALS['ONLINE'] = status;
	var loc = window.location.pathname;

	if (loc == "/index.htm" || loc == "/") {
		// Index Status setzen
		var auth_status = document.getElementById('AuthStatus');
		var text = auth_status.getElementsByClassName('statusText')[0];
		var info = auth_status.getElementsByClassName('statusInfo')[0];
		if (GLOBALS.PRO && status) {
			text.classList.remove("offline");
			text.classList.remove("basic");
			text.classList.add("pro");
			if (GLOBALS.UNLIMITED === true) {
				text.innerHTML = 'PRO Account !';
				if (info) {info.parentNode.removeChild(info);}
			} else {
				text.innerHTML = 'PRO Account bis ' + datum(true, GLOBALS.UNLIMITED);
				if (info) {info.innerHTML = '<a href="https://my.teachertab.de/home.php" title="Zu deinem Account" class="button">unbegrenzt Pro holen</a>';}
			}
		} else if (!status) {
			text.innerHTML = 'Offline';
			text.classList.remove("pro");
			text.classList.remove("basic");
			text.classList.add("offline");
			if (info) {info.parentNode.removeChild(info);}
		} else {
			text.innerHTML = 'Basic Account';
			text.classList.remove("pro");
			text.classList.remove("offline");
			text.classList.add("basic");
			if (info) {info.innerHTML = '<a href="https://my.teachertab.de/home.php" title="Zu deinem Account" class="button">wechsel zu Pro !</a>';}
		}
	}
}

// =================================================== //
// ================ Hilfs-Functionen  ================ //
// =================================================== //

function Schuljahre() {
	var selectBox = document.getElementById("jahrKlasse");
	var thisYear = new Date().getFullYear() - 1;
	var nextYear = (thisYear + 1).toString().substring(2, 4);
	var opt, opt2;
	opt = new Option(thisYear + " / " + nextYear + " (2. Hj.)");
	selectBox.appendChild(opt);
	thisYear = thisYear + 1;
	nextYear = (thisYear + 1).toString().substring(2, 4);
	opt = new Option(thisYear + " / " + nextYear + " (1. Hj.)");
	selectBox.appendChild(opt);
	opt = new Option(thisYear + " / " + nextYear + " (2. Hj.)");
	selectBox.appendChild(opt);
}

function loadVerteilung(Pkt_Verteilung) {
	//--> Laden einer Verteilung (default="Standard") und updaten der Anzeige
	if (Pkt_Verteilung == null) { Pkt_Verteilung = "Standard"; }
	return;
}


function updateNoten(liste, bol_singel, newObs_init) {
	//-> Errechnen und Anzeigen von eingetragenen Leistungen
	// -- Abwärtskompatibilität
	var newObs;
	if (newObs_init == null) {
		// keine Schülerdaten aus DB, bereits angezeigte Daten optisch updaten
		// In DB wird später gespeichert (Speichern Button)
		updateNotenHTML(liste, bol_singel);
		return;
	} else if (Array.isArray(newObs_init)) {
		newObs = {};
		for (var k = 0; k < newObs_init.length; k++) {
			newObs[newObs_init[k].id] = newObs_init[k];
		}
	} else {
		newObs = newObs_init;
	}

	// -- eigentliche Funktion
	var i, gesamtWert, erreicht, note, span;
	liste = (bol_singel) ? [liste] : liste.getElementsByTagName('li');
	var lART = sessionStorage.getItem('leistung_art');
	var lID = parseInt(sessionStorage.getItem('leistung_id'));
	for (i = 0; i < liste.length; i++) {
		var sID = parseInt(liste[i].getAttribute("data-rowid").substring(4));


		// Fehlende Daten für das Objekt errechnen und anzeigen
		if (liste[i].querySelector("[data-name=Gesamt]")) { // Kompetenzen
			span = liste[i].getElementsByClassName('Note')[0].getElementsByTagName('span');
			var erreicht_prozent;
			if (newObs[sID][lART][lID] && newObs[sID][lART][lID].Mitschreiber == true) {
				// Daten vorhanden
				gesamtWert = sessionStorage.getItem(newObs[sID][lART][lID].Verteilung + '_Gesamt');
				erreicht = newObs[sID][lART][lID].Gesamt || 0;
				erreicht_prozent = Math.round((erreicht / gesamtWert) / 0.005) * 0.5;
				note = RohpunkteAlsNote(erreicht_prozent, false);
				// anzeigen
				span[0].innerHTML = note;
				span[1].innerHTML = erreicht_prozent + " %";
				// Objekt eränzen
				newObs[sID][lART][lID].Gesamt = erreicht;
				newObs[sID][lART][lID].Note = note;
				newObs[sID][lART][lID].Prozent = erreicht_prozent;
			} else {
				// keine Daten
				span[0].innerHTML = "-";
				span[1].innerHTML = "%";
				// Objekt eränzen
				newObs[sID][lART][lID] = {
					'Gesamt': undefined,
					'Note': undefined,
					'Prozent': undefined,
				}
			}

		} else { // Punkte / Noten
			span = liste[i].getElementsByClassName('Note standalone')[0].getElementsByTagName('span')[0];
			if (newObs[sID][lART][lID] && newObs[sID][lART][lID].Mitschreiber == true) {
				gesamtWert = sessionStorage.getItem('Standard_Gesamt');
				erreicht = parseFloat(liste[i].getElementsByClassName('Gesamtpunkte')[0].getElementsByTagName('span')[0].innerHTML);
				erreicht_prozent = Math.round((erreicht / gesamtWert) / 0.005) * 0.5;
				note = RohpunkteAlsNote(erreicht_prozent, false);
				// anzeigen
				span.innerHTML = note;
				// Objekt eränzen
				newObs[sID][lART][lID].Note = note;
			} else {
				// keine Daten
				span.innerHTML = "-";
			}
		}

	}

	return newObs;
}

function updateNotenHTML(liste, bol_singel) {
	//--> Punkte in Prozentwerte umrechnen und als Note eintragen
	var i, gesamtWert, erreicht, note, span;
	liste = (bol_singel) ? [liste] : liste.getElementsByTagName('li');
	setTimeout(function () { // - sonst innerHTMl mit alten Werten
		for (i = 0; i < liste.length; i++) {
			if (liste[i].querySelector("[data-name=Gesamt]")) {
				gesamtWert = sessionStorage.getItem(liste[i].getAttribute('data-verteilung') + '_Gesamt');
				erreicht = parseFloat(liste[i].querySelector("[data-name=Gesamt]").innerHTML);
				erreicht = Math.round((erreicht / gesamtWert) / 0.005) * 0.5;
				note = RohpunkteAlsNote(erreicht, false);
				span = liste[i].getElementsByClassName('Note')[0].getElementsByTagName('span');
				span[0].innerHTML = (liste[i].getAttribute('data-mitschreiber') == "true") ? note : "-";
				span[1].innerHTML = erreicht + " %";
			} else {
				gesamtWert = sessionStorage.getItem('Standard_Gesamt');
				erreicht = parseFloat(liste[i].getElementsByClassName('Gesamtpunkte')[0].getElementsByTagName('span')[0].innerHTML);
				erreicht = Math.round((erreicht / gesamtWert) / 0.005) * 0.5;
				note = RohpunkteAlsNote(erreicht, false);
				span = liste[i].getElementsByClassName('Note standalone')[0].getElementsByTagName('span')[0];
				span.innerHTML = (liste[i].getAttribute('data-mitschreiber') == "true") ? note : "-";
			}
		}
	}, 10);
}

function RohpunkteAlsNote(val, bol_15pkt) {
	//--> Rechnet Prozentwerte in Noten um, universell für 15pkt und 6 Zensuren.
	if (val || val == 0) {
		var i;
		if (!bol_15pkt) {
			for (i = 1; i < 6; i++) {
				if (val >= parseFloat(SETTINGS.notenverteilung[i])) {
					return i;
				}
			}
			return 6;
		} else {
			for (i = 15; i > 0; i--) {
				if (val >= parseFloat(SETTINGS.notenverteilung[i])) {
					return i;
				}
			}
		}
	} else { return "-"; }
}

function updateStatus(progress, statustext, statustitle, elements, error) {
	//-> Animation der Statusleiste im PopUp
	if (document.getElementById('item0Sync')) {
		// Elemente
		if (!elements || elements == [] || typeof elements == "undefined") { elements = false; }

		var el_statusbar = (elements) ? elements[0] : document.getElementById('syncStatus');
		var el_statustitle = (elements) ? elements[1] : document.getElementById('syncText');
		var el_statustext = (elements) ? elements[2] : document.getElementById('syncInnerText');

		// DOM-Werte setzen
		el_statusbar.style.width = progress.toString() + "%";
		if (statustitle || statustitle == "") { el_statustitle.innerHTML = statustitle; }
		if (statustext || statustext == "") { el_statustext.innerHTML = statustext; }

		// Success oder Fehler
		if (progress >= 100 && !error) {
			el_statusbar.classList.add('ok');
			el_statusbar.classList.remove('error');
		} else if (error === true) {
			el_statusbar.style.width = "100%";
			el_statusbar.classList.remove('ok');
			el_statusbar.classList.add('error');
		} else if (error == "info") {
			el_statusbar.style.width = "100%";
			el_statusbar.classList.add('info');
		}
	}
	return;
}

// =================================================== //
// ================     Standards     ================ //
// =================================================== //

function isObject(item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
}

function objLength(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
}

function mergeObjects(old1, new1) {
	for (var k in new1) {
		// Verschachtelungen assignen, Werte zuordnen
		if (typeof (new1[k]) == "object") {
			Object.assign(old1[k], new1[k]);
		} else {
			old1[k] = new1[k];
		}
	}
	return old1;
}

// Objekte rekursiv zusammenführen:
// von: https://stackoverflow.com/a/34749873
function mergeDeep(target, ...sources) {
	if (!sources.length) return target;
	var source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (var key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return mergeDeep(target, ...sources);
}

function copyObject(src) {
	return JSON.parse(JSON.stringify(src));
}

function jsGET() {
	var result = {};
	var arr_GET, s_GET = window.location.search.split("?")[1];
	if (s_GET) {
		arr_GET = s_GET.split("&");

		for (var i = arr_GET.length - 1; i >= 0; i--) {
			var kv = arr_GET[i].split("=");

			if ( Array.isArray( result[kv[0]] ) ) {
				// Eintrag schon als Array vorhanden
				result[kv[0]].push(kv[1]);
			}else if (result[kv[0]]) {
				// Eintrag einzeln vorhanden
				result[kv[0]] = [ result[kv[0]], kv[1] ];
			}else{
				// Eintrag nicht vorhanden
				result[kv[0]] = kv[1];
			}

		}

	}
	return result;
}

function checkAuth() {
	GLOBALS.AUTH = (localStorage.getItem("auth") == "true") ? true : false;
	return;
}

function checkUpdate(newVersion) {
	if (newVersion && newVersion > GLOBALS['appversion']) {
		document.getElementById('syncUpdate').classList.remove('hide');
		document.getElementById('newVersion').innerHTML = "( v"+newVersion+" )";
	}
}

function sum(n) {
	var i, r = 0;
	for (i = 0; i < n.length; i++) {
		r += parseInt(n[i]);
	}
	return r;
}

function removeDups(a, filter) {
	//-> Doppelte Einträge aus Array filtern
	//-> https://stackoverflow.com/a/9229821/2978727
	if (typeof filter == "undefined") { filter = []; }
	var seen = {};
	var out = [];
	var len = a.length;
	var j = 0;
	for (var i = 0; i < len; i++) {
		var item = a[i];
		if (seen[item] !== 1) {
			seen[item] = 1;
			if (filter) {
				if (filter.indexOf(item) === -1 && filter.indexOf(item.toString()) === -1 && filter.indexOf(parseInt(item)) === -1) {
					out[j++] = item;
				}
			} else {
				out[j++] = item;
			}
		}
	}
	return out;
}

function compareKlassen(a, b) {
	//-> Vergleichsfunktion für die Liste aller Klassen
	if (a[1].bezeichnung < b[1].bezeichnung)
		return -1;
	if (a[1].bezeichnung > b[1].bezeichnung)
		return 1;
	return 0;
}

function compareStudents(a, b) {
	if (SETTINGS.studSort) {
		// Sortieren nach Gruppe und Namen
		var a_sort = (a.name.sort) ? a.name.sort + ">" : "zzz>";
		var a_name = a.name.nname + ">" + a.name.vname;
		var b_sort = (b.name.sort) ? b.name.sort + ">" : "zzz>";
		var b_name = b.name.nname + ">" + b.name.vname;
		return (a_sort + a_name).localeCompare(b_sort + b_name);
	} else {
		// Sortieren nach Namen
		return (a.name.nname + ">" + a.name.vname).localeCompare(b.name.nname + ">" + b.name.vname);
	}
}

function compareDate(a, b) {
	a = (a.Datum.split("-").length == 3) ? a.Datum : datum("ISO", a.Datum);
	b = (b.Datum.split("-").length == 3) ? b.Datum : datum("ISO", b.Datum);
	return (a > b) ? 1 : -1;
}

function datum(numeric, given) {
	var d;
	if (!given) {
		d = new Date();
	} else {
		given = given.replace(". ", " ");
		given = given.replace(".", " ");
		d = new Date(given);
	}
	var tag = d.getDate();
	var jahr = d.getFullYear();
	var monat = d.getMonth();
	var monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	if (!numeric) {
		monat = monate[monat];
		if (!monat) {
			return "?"
		}else{
			return tag + '. ' + monat + ' ' + jahr;
		}
	} else {
		var options;
		monat ++;
		if (numeric == "ISO") {
			if (tag < 10) {tag = "0" + tag;}
			if (monat < 10) {monat = "0" + monat;}
			return jahr +"-"+ monat +"-"+ tag;
		}else{
			var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
			return d.toLocaleDateString("de-DE", options);
		}
	}
}

function timestamp() {
	return Math.round(new Date().getTime() / 1000);
}

function uniqueID() {
	// Add Time
	var part_ts = new Date().getTime().toString().substring(2);
	// -- plus extra-Counter für Batch
	part_ts += GLOBALS.dbToGo;
	// Add Device Details
	var nav = window.navigator;
	var screen = window.screen;
	var part_guid = nav.mimeTypes.length;
	part_guid += nav.plugins.length;
	part_guid += screen.height || '';
	part_guid += screen.width || '';
	part_guid += screen.pixelDepth || '';
	var id = parseInt(part_ts + part_guid) || parseInt(part_ts);
	return id;
}

function uniqueClassID(klassenname) {
	return hashData(klassenname + timestamp());
}

function stampImport(importData, stamp) {
	//-> Überschreiben eines Klassenobjekts mit Timestamp
	if (typeof stamp == "undefined") {
		stamp = timestamp();
	}
	for (var key in importData) {
		if (importData.hasOwnProperty(key)) {
			// Settings / Leistungen
			if (importData[key].typ == "leistung" || importData[key].typ == "settings") {
				importData[key].changed = stamp;
			}
			// Students
			if (importData[key].typ == "student") {
				// -- allgemein
				importData[key].name.changed = stamp;
				importData[key].gesamt.changed = stamp;
				// -- fspz
				var leistung;
				for (leistung in importData[key].fspz) {
					importData[key].fspz[leistung].changed = stamp;
				}
				// -- mndl
				for (leistung in importData[key].mndl) {
					importData[key].mndl[leistung].changed = stamp;
				}
				// -- schr
				for (leistung in importData[key].schr) {
					importData[key].schr[leistung].changed = stamp;
				}
			}
		}
	}
	return importData;
}


// =================================================== //
// ================ Durchschnitte === ================ //
// =================================================== //


// Schnitt für einen Schüler berechnen
function schnitt_gesamt(Student, Leistungen) {
	var ds_art;
	var art = ["mndl", "fspz", "schr"];
	var i;

	// Durchschnitt aller Bereiche
	for (i = 0; i < art.length; i++) {
		ds_art = "o" + art[i];
		if (ds_art == "ofspz") {
			// Spezialfall Fspz und Verrechnung mit Mndl beachten
			Student.gesamt["ofspz"] = schnitt(Student[art[i]], true);
			Student.gesamt['omndl'] = schnitt_m_f(Student.gesamt['omndl'], Student.gesamt['ofspz'].Gesamt);
		} else {
			Student.gesamt[ds_art] = schnitt(Student[art[i]], false);
		}
	}

	// Durchschnitt insgesamt
	if (Student.gesamt['omndl'] && Student.gesamt['oschr']) {
		Student.gesamt.rechnerisch = Student.gesamt['omndl'] * SETTINGS.gewichtung['mündlich'] + Student.gesamt['oschr'] * SETTINGS.gewichtung['schriftlich'];
	} else {
		Student.gesamt.rechnerisch = Student.gesamt['omndl'] || Student.gesamt['oschr'] || 0;
	}

	// Kompetenzen
	var kompetenzen = [0, 0, 0, 0, [0,0,0,0]];
	var Infos, temp_leistung, i2;
	// -- Itteriere durch Leistungsart
	for (i2 = 0; i2 < Leistungen.length; i2++) {
		// Itteriere durch Leistung und Auswahl von mitgeschriebenen Objekten erstellen
		Infos = Leistungen[i2];
		temp_leistung = Student[Infos.subtyp][Infos.id];
		// mitgeschrieben und mit Kategrorien ?
		if (temp_leistung && temp_leistung.Mitschreiber && temp_leistung.Verteilung) {
			var hundertProzent = Infos.Verteilungen[temp_leistung.Verteilung];
			// Prozentsummen
			if (hundertProzent.Kat1) {
				kompetenzen[0] += (temp_leistung.Kat1 / hundertProzent.Kat1)
				kompetenzen[4][0] += 1;}
			if (hundertProzent.Kat2) {
				kompetenzen[1] += (temp_leistung.Kat2 / hundertProzent.Kat2)
				kompetenzen[4][1] += 1;}
			if (hundertProzent.Kat3) {
				kompetenzen[2] += (temp_leistung.Kat3 / hundertProzent.Kat3)
				kompetenzen[4][2] += 1;}
			if (hundertProzent.Kat4) {
				kompetenzen[3] += (temp_leistung.Kat4 / hundertProzent.Kat4)
				kompetenzen[4][3] += 1;}
		}
	}
	Student.kompetenzen = [
		Math.round((kompetenzen[0] / kompetenzen[4][0]) * 100) / 100 || 0,
		Math.round((kompetenzen[1] / kompetenzen[4][1]) * 100) / 100 || 0,
		Math.round((kompetenzen[2] / kompetenzen[4][2]) * 100) / 100 || 0,
		Math.round((kompetenzen[3] / kompetenzen[4][3]) * 100) / 100 || 0,
	];

	return Student;
}


function schnitt(_obj, bol_fspz) {
	// Besonderheiten bei Trennung von Vok und Gra beachten !
	var _row, r = 0;
	var iAnz = 0;
	var _Gra = {};
	var _Vok = {};
	if (!bol_fspz) {
		if (_obj == {}) {
			return "";
		} else {
			for (_row in _obj) {
				if (_obj[_row].Mitschreiber) {
					iAnz += _obj[_row].Gewichtung;
					r = r + parseFloat(_obj[_row].Note * _obj[_row].Gewichtung);
				}
			}
			return Math.round((r / iAnz) * 100) / 100 || "";
		}
	} else {
		for (_row in _obj) {
			if (_obj[_row].Bezeichnung == "Grammatik") {
				_Gra[_row] = _obj[_row];
			} else if (_obj[_row].Bezeichnung == "Vokabeln") {
				_Vok[_row] = _obj[_row];
			}
		}
		return { Vokabeln: schnitt(_Vok) || "", Grammatik: schnitt(_Gra) || "", Gesamt: schnitt(_obj) };
	}
}


function schnitt_m_f(omndl, ofspz) {
	// Schnitt zwischen oMndl und Fspz
	var gew_fspz = SETTINGS.gewichtung["davon fachspezifisch"];
	var gew_mndl0 = 1.0 - gew_fspz;
	if (ofspz > 0 && omndl > 0) {
		return Math.round((omndl * gew_mndl0 + ofspz * gew_fspz) * 100) / 100 || "";
	} else if (omndl) {
		return Math.round((omndl) * 100) / 100 || "";
	} else if (ofspz) {
		return Math.round((ofspz) * 100) / 100 || "";
	}
	return "";
}


// =================================================== //
// ================ Slider  Functions ================ //
// =================================================== //


function itemAbort(names, target_site) {
	var i;
	for (i = 0; i < names.length; i++) {
		document.getElementById(names[i]).classList.remove('show');
	}
	setTimeout(function () {
		window.location = target_site;
	}, 400);
}

function slide() {
	//-> Onclick dreht die Ansicht
	scroll(0, 0);
	var addBtn = document.getElementById('btn_Add');
	var i, slideElements = document.getElementsByClassName('uebersicht');
	// Flip
	for (i = 0; i < slideElements.length; i++) {
		var slide = slideElements[i];
		slide.classList.toggle('show');
		// > MacBook Trackpad Fix
		macTrackPadFix(slide);
	}
	// Add-Button
	var slideIndex = document.getElementsByClassName('uebersicht show')[0].id;
	addBtn.setAttribute('data-name', slideIndex + 'Add');
	// Marker
	document.getElementsByClassName('marker')[0].className = "marker " + slideIndex;
	// Store
	sessionStorage.setItem('lastview', slideIndex);
}

function slide1(id, location) {
	//-> nur für die Panels (Settings, Schüler, Leistung)
	if (typeof location == "undefined") {
		var slide = document.getElementById(id);
		slide.classList.remove('hide');
		setTimeout(function () {
			slide.classList.add('show');
			// > MacBook Trackpad Fix
			macTrackPadFix(slide);
		}, 250);
		return;
	} else {
		setTimeout(function () {
			window.location = location;
		}, 500);
		document.getElementById(id).classList.remove('show');
	}
}

function slide2(slideName) {
	//-> Nur für die Übersichten
	scroll(0, 0);
	var addBtn = document.getElementById('btn_Add');
	document.getElementsByClassName('marker')[0].className = "marker " + slideName;
	var items = ["item1", "item2"];
	var slide = items.splice(items.indexOf(slideName), 1)[0];
	slide = document.getElementById(slide);
	slide.classList.add('show');
	var hideElement = document.getElementById(items[0]);
	hideElement.classList.remove('show');
	addBtn.setAttribute('data-name', slideName + 'Add');
	sessionStorage.setItem('lastview', slideName);

	// > MacBook Trackpad Fix
	macTrackPadFix(slide);
}

function macTrackPadFix(element) {
	// -- make a change to be able to revert this change
	element.style.bottom = "1px";
	// -- change some style (reset the prev. change)
	setTimeout(function(){
	    element.style.bottom = "";
	}, 1000 + 10); // CSS animation time + 10ms
}

function keyFunctions(event) {
	var keyStroke = event.key || event.keyCode;
	var closeButton = document.querySelector('.showPop .close a');
	if (closeButton) {

		if (keyStroke == "Escape" || keyStroke == 27) {
			popUpClose(closeButton, false);

		}else if (keyStroke == "Enter" || keyStroke == 13) {
			var allBtns = document.querySelectorAll(".showPop.popUp .OK");
			for (var i = 0; i < allBtns.length; i++) {
				if (!allBtns[i].classList.contains("hide") && allBtns[i].id != "saveI") {
					allBtns[i].click();
				}
			}
		}
	}
}

function fspz_Bezeichnung() {
	//-> Bezeichnungsfeld verinheitlichen
	var nArt = document.getElementById('notenArt');
	var gewichtung = document.getElementById('rangeSlide');
	if (SETTINGS.fspzDiff) {
		var textfield = document.getElementById('notenBezeichnung');
		var selectfield = document.getElementById('notenBezeichnung_Select');
		if (nArt.value == "fspz") {
			textfield.classList.add("hide");
			selectfield.classList.remove("hide");
			textfield.value = selectfield.value;
		} else {
			textfield.classList.remove("hide");
			selectfield.classList.add("hide");
		}
	}
	if (nArt.value == "fspz") {
		gewichtung.setAttribute('disabled', 'disabled');
		document.getElementById('rangeWert').innerHTML = 1;
		gewichtung.value = 1;
	} else if (gewichtung.getAttribute("disabled")) {
		gewichtung.removeAttribute('disabled');
	}
	return true;
}

function fspz_Bezeichnung2() {
	document.getElementById('notenBezeichnung').value = document.getElementById('notenBezeichnung_Select').value;
}


function popUp(popWindow) {
	document.getElementById('fadeBlack').classList.remove('hide');
	setTimeout(function () {
		document.getElementById(popWindow).classList.add('showPop');
		document.getElementById('fadeBlack').classList.add('show');
	}, 50);
	document.addEventListener('keydown', keyFunctions);
}


function popUpClose(thisElement, bol_refresh, keepBlack) {
	if (bol_refresh) {
		db_readMultiData(listStudents, "student");
		db_readMultiData(listLeistung, "leistung");
	}
	thisElement.parentNode.parentNode.classList.remove('showPop');

	if (!(keepBlack)) {
		document.getElementById('fadeBlack').classList.remove('show');
		setTimeout(function () {
			thisElement.parentNode.parentNode.parentNode.classList.add('hide');
		}, 250);
	}
	document.removeEventListener('keydown', keyFunctions);
}


function popUpSwitch(thisElement, target_id) {
	thisElement.parentNode.parentNode.classList.remove('showPop');
	if (target_id) {
		document.getElementById('fadeBlack').classList.remove('hide');
		setTimeout(function () {
			document.getElementById(target_id).classList.add('showPop');
			document.getElementById('fadeBlack').classList.add('show');
		}, 50);
	}
}


function shake(target) {
//-> Hinweis Animation auf Target
	target.classList.add('alert');
	setTimeout(function(){
		target.classList.remove('alert');
		return false;
	}, 2000);
}

// =================================================== //
// ============= Datenbank - Objekt-Hilfe ============ //
// =================================================== //

// Account anlegen
function createAccount(accountname) {
	return {
		'id': 1,
		'username': accountname,
		'klassenliste': {},	// # Alle Klassen auf Gerät und Archiv
		'local': [],			// # Alle Klassen auf Gerät
		'blacklist': [],		// # Gelöschte Klassen, die nicht wieder ins Archiv dürfen
	};
}

// Standard Einstellungen
function formSettings(id, bezeichnung) {
	return {
		'id': 1,
		'typ': "settings",
		'changed': 0,
		'fspzDiff': false,
		'gewichtung': {
			"mündlich": 0.6,
			"davon fachspezifisch": 0.2,
			"schriftlich": 0.4,
		},
		'klasse': id,
		'name': bezeichnung,
		'kompetenzen': { 'Gesamt': "Gesamt", 1: "Kategorie 1", 2: "Kategorie 2", 3: "Kategorie 3", 4: "Kategorie 4" },
		'notenverteilung': { 1: 95, 2: 80, 3: 75, 4: 50, 5: 25, 6: 0 },
		'showVorjahr': false,
		'studSort': false,
		'blacklist': [],
	};
}

// Schüler mit ersten Daten
function formStudent(vName, nName, sex) {
	sex = (typeof sex == "undefined") ? sex : "-";
	var id = uniqueID();
	return {
		'id': id,
		'typ': "student",
		'name': {
			'nname': nName,
			'vname': vName,
			'sex': sex,
			'sort': null,
			'changed': 0,
		},
		'mndl': {},
		'fspz': {},
		'schr': {},
		'gesamt': {
			'omndl': null,
			'ofspz': {
				'gesamt': null,
				'vokabeln': null,
				'grammatik': null,
			},
			'oschr': null,
			'rechnerisch': null,
			'eingetragen': null,
			'vorjahr': null,
			'changed': 0,
		},
		'kompetenzen': [],
	};
}

// Leistung mit ersten Daten
function formLeistung(art, bezeichnung, theDate, eintragung, gewicht) {
	var id = uniqueID();

	bezeichnung = (bezeichnung) ? bezeichnung : "Leistung";
	theDate = (theDate) ? datum("ISO", theDate) : datum("ISO");

	return {
		'id': id,
		'typ': "leistung",
		'subtyp': art,
		'changed': 0,
		'Bezeichnung': bezeichnung,
		'Datum': theDate,
		'Eintragung': eintragung,
		'DS': undefined,
		'Gewichtung': gewicht,
		'Verteilungen': {
			'Standard': {
				'Kat1': 0,
				'Kat2': 0,
				'Kat3': 0,
				'Kat4': 0,
				'Gesamt': 0,
			},
		},
		'Schreiber': {
			'Bester': undefined,
			'Schlechtester': undefined,
			'nMitschr': undefined,
		},
	};
}


// Wait for DB (wenn Callback nicht geht)
function waitForDB(callback, delay) {
	if (typeof delay == "undefined") { delay = 250; }
	if (GLOBALS.dbFinished >= GLOBALS.dbToGo) {
		callback();
	} else {
		setTimeout(function () {
			waitForDB(callback);
		}, delay);
	}
}


function klassenSyncHandler(location, newWindow) {
	//-> Synchronisierung, Animation und Weiterleitung
	GLOBALS.perfStart = performance.now();// DEV
	popUp("item0Sync");

	// Animation, Sync und DB
	var progress = 0;
	progress += 10;
	updateStatus(progress, "Lokale Daten lesen", "Synchronisiere...");


	if (GLOBALS.ONLINE) {


	db_readKlasse(function (klassenObject) {

		progress += 50; // Statusbar
		updateStatus(progress, "Serverdaten anfordern", "Synchronisiere...");
		//DEV console.log("DEV: kurz vor sync_getKlasse");

		sync_getKlasse(function (mergedKlasse) {

			GLOBALS.perfEnd = performance.now();// DEV
			console.log("INFO: Finished opening Class in " + Math.round((GLOBALS.perfEnd - GLOBALS.perfStart), 1) + " milliseconds.");// DEV

			if (isObject(mergedKlasse)) {

				progress += 30; // Statusbar
				updateStatus(progress, "Daten entschlüsseln und zusammenführen", "Synchronisiere...");

				setTimeout(function () {
					progress += 10; // Statusbar
					updateStatus(progress, progress + " %", "Synchronisation erfolgreich !");
					// --- Klasse aufrufen/schließen ---
					setTimeout(function () {
						if (newWindow) {
							window.open(location, '_blank');
							window.location.reload();
						} else {
							window.location.href = location;
						}
					}, 1200);
				}, 500);

			} else {

				// mergedKlasse als Fehlermeldung ausgeben (msg vom Server)
				if (klassenObject) {
					// Klasse kann trotzdem geöffnet
					updateStatus(progress, mergedKlasse, "Keine Synchronisation durchgeführt !", false, "info");
					setTimeout(function () {
						if (newWindow) {
							window.open(location, '_blank');
						} else {
							window.location.href = location;
						}
					}, 3000);
				} else {
					// Klasse nicht lokal vorhanden und kein Sync
					GLOBALS.PRO = false;
					updateStatus(progress, mergedKlasse, "Keine Synchronisation möglich und Klasse lokal nicht vorhanden !", false, true);
				}

			}

		}, klassenObject);

	});

	}else{
		updateStatus(100, "Du bist offline!", "Keine Synchronisation durchgeführt !", false, true);
		setTimeout(function () {
			if (newWindow) {
				window.open(location, '_blank');
			} else {
				window.location.href = location;
			}
		}, 3000);
	}
}


function klassenDeleteHandler() {
	//-> Löschen, Synchronisierung, Animation
	popUp("item0Sync");

	// Animation, Sync und DB
	var progress = 0;
	progress += 30;
	updateStatus(progress, progress + " %", "Lösche Klassendaten: Aus dem Speicher und Verzeichnis dieses Geräts");

	db_dropKlasse(GLOBALS.klasse, function () {


		sync_deleteKlasse(GLOBALS.klasse, function (msg) {
			progress += 40;
			updateStatus(progress, progress + " %", "Lösche Klassendaten: Aus dem Speicher und Verzeichnis des Servers");
			if (msg) {
				// bei Erfolg mit Blacklist löschen
				db_simpleUpdate(function () {

					// sofort Account syncen
					db_readGeneric(function (localAccount) {
						sync_getAccount(function () {
							setTimeout(function () {
								window.location.reload();
							}, 2000);
						}, localAccount);
					}, 1, "account");
					progress = 100;
					updateStatus(progress, progress + " %", "Lösche Klassendaten: Erfolgreich !");

				}, 1, "klassenliste", "delKlasse", GLOBALS.klasse, "account");

			} else {
				// nur lokale Änderungen möglich
				db_simpleUpdate(function () {

					updateStatus(progress, "Klasse auf dem Server nicht vorhanden", "Klasse nur lokal gelöscht", false, true);
					setTimeout(function () {
						window.location.reload();
					}, 2000);

				}, 1, "klassenliste", "delKlasse", GLOBALS.klasse, "account");

			}
		});


	});
	return;
}

function klassenImportHandler() {
	//-> Lesen, Formatieren, Senden
	popUp("item0Sync");

	// Animation, Sync und DB
	var progress = 0;

	if (GLOBALS.PRO) {
		progress += 50;
		updateStatus(progress, "Einlesen der Daten", "Importiere Backup...");

		// Textfeld lesen, untersuchen und Timestamp setzen
		var jsonBackup = document.getElementById("jsonBackup").value;
		try {
			jsonBackup = decodeURIComponent(jsonBackup);
		console.log(jsonBackup);
			jsonBackup = JSON.parse(jsonBackup);
			jsonBackup = stampImport(jsonBackup, changed);
			jsonBackup[1].name = jsonBackup[1].name + " (Import " + datum(true) + ")";
			jsonBackup[1].klasse = uniqueClassID(jsonBackup[1].name);
			var changed = timestamp();
			var target = jsonBackup[1].klasse;
		} catch (e) {
			updateStatus(progress, "Falsches Datenformat!", "Importiere Backup: Ein Fehler ist aufgetreten !", false, true);
			return false;
		}

		// Sync an Server
		progress += 30; // Statusbar
		updateStatus(progress, "verschlüsselte Daten senden", "Importiere Backup...");
		sync_pushBack(function (unencrypted, errormsg) {

			if (errormsg && typeof errormsg != "undefined") {
				setTimeout(function () {
					updateStatus(progress, errormsg, "Import fehlgeschlagen !", false, true);
				}, 3000);
			}
			// auf Klassenliste setzen oder aktualisieren
			console.log("IDB: adding Class to Account (not local)");
			db_simpleUpdate(function () {

				setTimeout(function () {
					progress = 100; // Statusbar
					updateStatus(progress, progress + " %", "Import erfolgreich abgeschlossen !");
					// --- Klasse aufrufen/schließen ---
					setTimeout(function () {
						window.location.reload();
					}, 1200);
				}, 500);

			}, 1, "notlocal", "addKlasse", [target, { 'bezeichnung': jsonBackup[1].name, 'id': target, 'changed': changed }], "account");

		}, jsonBackup, ["class", target]);


	} else {
		// Kein Pro, kein Import
		updateStatus(progress, "Dafür wird ein PRO Account benötigt", "Import fehlgeschlagen !", false, true);

	}

	return;
}

function klassenExportHandler(mode) {
	var thisButton = document.getElementById("export_to_" + mode)
	popUpSwitch(thisButton);
	// ein neues Tab außerhalb der App hat ggf. keinen Zugriff auf SessionsStorage der App
	//sessionStorage.setItem("export_type", mode);
	klassenSyncHandler("export.htm?" + "x="+mode, false);
}

// Helper zum Löschen von Leistunge
function handleDeleteLeistung(callback, lART, lID) {
	db_dynamicUpdate(
		function (r) { // neue Callback Function
			db_deleteDoc(function () {
				db_simpleUpdate(callback, 1, "blacklist", "push", lID.toString());
			}, lID);
		},
		function (Student) { // Apply Function
			delete Student[lART][lID];
			return Student;
		},
		"student");
}

// Helper um Klassenkopie vorzubereiten
function handleCopyKlasse(thisElement) {
	db_readGeneric(function (localAccount) {
		if (localAccount.local.indexOf(GLOBALS.klasse) > -1) {
			var btn_OK = document.querySelector("#item0Add .button.OK");
			var heading = document.querySelector("#item0Add h3");
			btn_OK.onclick = function(){copyKlasse(this)};
			heading.innerHTML = "Kopieren von "+ GLOBALS['klassenbezeichnung'];
			popUpSwitch(thisElement, "item0Add");
		}else{
			alert("Die Klasse ist auf deinem Gerät noch nicht vorhanden. Rufe sie kurz einmal auf, um sie zu synchronisieren.");
		}
	}, 1, "account");
}


// Helper zum geordneten Aufrufen der Schnitt-Update-Datenbankfunktionen
function handleSchnitt(callback, sID) {
	db_readMultiData(function (Leistungen) {
		console.log("INFO: Schnittberechnung wird durchgeführt");
		db_dynamicUpdate(
			callback,
			function (Student) { // Apply (anonym wegen Argumente)
				return schnitt_gesamt(Student, Leistungen);
			}, "student", sID);
	}, "leistung", function () {
		console.log("INFO: keine Schnittberechnung wegen leerer DB-Abfrage");
		callback();
	}
	);
}

// Helper zum einfachen Aufruf der Blacklistbereinigung
// TODO: Account[klassenliste] ist meist schon leer ?! (issue #46)
function handleCleanUpBlacklist() {
	db_readGeneric(function (localAccount) {
		sync_cleanBlacklist(function () { console.log("Blacklist should be clean now", localAccount['blacklist']) }, localAccount);
	}, 1, "account");
}
