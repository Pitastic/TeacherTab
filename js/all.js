// =================================================== //
// ================ Globale Variablen ================ //
// =================================================== //

var serverIP;
var userID;
var knownDevice;
var isPhone;

var dbversion;
var oStore;
var dbname;
var noSyncCols;

var klasse;
var SETTINGS;


$(document).ready(function() {
	// Init Vars
	noSyncCols = ["vorjahr"];
	isPhone = (screen.width > 767) ? false : true;
	
	// Device ist KEIN Phone
	if (!isPhone) {
		window.addEventListener('orientationchange', changeOrientation);
	}
	// Not the First Time ?
	if (localStorage.getItem('TeacherTab')){
		// DB Support und Init
		serverIP = localStorage.getItem('serverIP');
		userID = localStorage.getItem('userID');
		dbname = userID;
		knownDevice = true;
		klasse = sessionStorage.getItem('klasse');
	}else{
		// kein DB Init
		knownDevice = false;
	}

	// Links bleiben in WebApp
	$.stayInWebApp('a.stay');
});


// =================================================== //
// ================ Event - Listeners ================ //
// =================================================== //

function addListener() {
	var add = document.getElementById('btn_Add');
	add.onclick = function(){
		popUp(add.getAttribute('data-name'));
	};
}
function closeListener() {
	// Close 'X':
	var closeX = document.getElementsByClassName('close');
	var i;
	for(i=0; i<closeX.length; i++){
		closeX[i].getElementsByTagName('a')[0].onclick = function(){
			popUpClose(this);
		};
	}
}

// =================================================== //
// ================ Hilfs-Functionen  ================ //
// =================================================== //

function changeOrientation(){
	switch(window.orientation){
		case 180:
		case 0:
			// Portrait :
			document.getElementById('dynamicViewport').setAttribute('content', "width=device-width");
			break;
		default:
			// Landscape :
			document.getElementById('dynamicViewport').setAttribute('content', "");
			break;
		}
}

function Schuljahre() {
	var selectBox = document.getElementById("jahrKlasse");
	var copyBox = document.getElementById("jahrCopyKlasse");
	var thisYear = new Date().getFullYear()-1;
	var nextYear = (thisYear+1).toString().substring(2,4);
	var opt;
	opt = new Option(thisYear+" / "+nextYear+" (2. Hj.)");
		opt2 = new Option(thisYear+" / "+nextYear+" (2. Hj.)");
		selectBox.appendChild(opt);
		copyBox.appendChild(opt2);
	thisYear = thisYear+1;
	nextYear = (thisYear+1).toString().substring(2,4);
	opt = new Option(thisYear+" / "+nextYear+" (1. Hj.)");
		opt2 = new Option(thisYear+" / "+nextYear+" (1. Hj.)");
		selectBox.appendChild(opt);
		copyBox.appendChild(opt2);
	opt = new Option(thisYear+" / "+nextYear+" (2. Hj.)");
		opt2 = new Option(thisYear+" / "+nextYear+" (2. Hj.)");
		selectBox.appendChild(opt);
		copyBox.appendChild(opt2);
}

function loadVerteilung(Pkt_Verteilung) {
//--> Laden einer Verteilung (default="Standard") und updaten der Anzeige
	if (Pkt_Verteilung == null) {Pkt_Verteilung = "Standard"};
	return;
}

function updateVerteilungSession() {
//--> Update des SessionStorage aus WebSQL Daten
	db.transaction(
		function(transaction){
		var column = sessionStorage.getItem('leistung_column');
		var l_id = sessionStorage.getItem('leistung_id');
		transaction.executeSql(
		"SELECT "+column+" FROM "+klasse+" WHERE id='0';", [], function(t, r){
			var i, i2, katWert, gesamtWert;
			var verteilungsObj = {};
			var Leistung = JSON.parse(decodeURIComponent(r.rows.item(0)[column]))[l_id];
			// Alle Verteilungen hinterlegen
			for (i=0;i<Leistung.Verteilungen.length;i++){
				verteilungsObj = Leistung[Leistung.Verteilungen[i]];
				for (i2=0;i2<4;i2++){
					katWert = verteilungsObj['Kat'+(i2+1)];
					sessionStorage.setItem(Leistung.Verteilungen[i]+"_Kat"+(i2+1), katWert);
				}
				gesamtWert = verteilungsObj.Gesamt;
				sessionStorage.setItem(Leistung.Verteilungen[i]+'_Gesamt', gesamtWert);
			}
			updateVerteilungHTML("Standard"); // callback
		}, null);
	});
}

function updateNoten(liste, bol_singel) {
//--> Punkte in Prozentwerte umrechnen und als Note eintragen
	var i, gesamtWert, erreicht, note, span;
	liste = (bol_singel) ? [liste] : liste.getElementsByTagName('li');
	setTimeout(function(){ // - sonst innerHTMl mit alten Werten
		for (i=0; i<liste.length; i++){
			if (liste[i].querySelector("[data-name=Gesamt]")) {
				gesamtWert = sessionStorage.getItem(liste[i].getAttribute('data-verteilung')+'_Gesamt');
				erreicht = parseFloat(liste[i].querySelector("[data-name=Gesamt]").innerHTML);
				erreicht = Math.round((erreicht/gesamtWert)/0.005)*0.5;
				note = RohpunkteAlsNote(erreicht, false);
				span = liste[i].getElementsByClassName('Note')[0].getElementsByTagName('span');
				span[0].innerHTML = (liste[i].getAttribute('data-mitschreiber') == "true") ? note : "-";
				span[1].innerHTML =  erreicht + " %";
			}else{
				gesamtWert = sessionStorage.getItem('Standard_Gesamt');
				erreicht = parseFloat(liste[i].getElementsByClassName('Gesamtpunkte')[0].getElementsByTagName('span')[0].innerHTML);
				erreicht = Math.round((erreicht/gesamtWert)/0.005)*0.5;
				note = RohpunkteAlsNote(erreicht, false);
				span = liste[i].getElementsByClassName('Note standalone')[0].getElementsByTagName('span')[0];
				span.innerHTML = (liste[i].getAttribute('data-mitschreiber') == "true") ? note : "-";
			}
		}
	}, 10)
}

function RohpunkteAlsNote(val, bol_15pkt){
//--> Rechnet Prozentwerte in Noten um, universell für 15pkt und 6 Zensuren.
	if (val || val==0){
		var i;
		if (!bol_15pkt){
			for (i=1;i<6;i++){
				if (val >= parseFloat(SETTINGS.notenverteilung[i])){
					return i;
				}
			}
			return 6;
		}else{
			for (i=15;i>0;i--){
				if (val >= parseFloat(SETTINGS.notenverteilung[i])){
					return i;
				}
			}
		}
	}else{return "-"}
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

function mergeObjects(old1, new1){
	for (k in new1){
		// Verschachtelungen assignen, Werte zuordnen
		if (typeof(new1[k]) == "object") {
			Object.assign(old1[k], new1[k]);
		}else{
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


function sum(n){
	var i, r = 0;
	for (i=0;i<n.length;i++){
		r += parseInt(n[i]);
	}
	return r;
}


function datum(){
	var d = new Date();
	var monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	var tag, monat, jahr;
		tag = d.getDate();
		monat = monate[d.getMonth()];
		jahr = d.getFullYear();
	return tag+'. '+monat+' '+jahr;
}


function timestamp() {
	return Math.round(new Date().getTime() / 1000);
}

function goBack(){
	readDB_tables(listIdx_Select,"");
	slide('uebersicht0_In', 'item0');
	noTouchSlider();
}


function quit(){
	if(window.confirm('Änderungen synchronisieren ?')){
		initSyncSQL();
	}else{
		window.location = "index.htm";
	}
}


// =================================================== //
// ================ Durchschnitte === ================ //
// =================================================== //


// Schnitt für einen Schüler berechnen
function schnitt_gesamt(Student, Leistungen) {
	var ds_art, neuerStudent;
	var art = ["mndl","fspz","schr"];

	// Durchschnitt aller Bereiche
	for (var i = 0; i < art.length; i++) {
		ds_art = "o"+art[i];
		if (ds_art == "ofspz") {
			// Spezialfall Fspz und Verrechnung mit Mndl beachten
			Student.gesamt["ofspz"] = schnitt(Student[art[i]], true);
			Student.gesamt['omndl'] = schnitt_m_f(Student.gesamt['omndl'], Student.gesamt['ofspz'].Gesamt);						
		}else{
			Student.gesamt[ds_art] = schnitt(Student[art[i]], false);
		}
	}

	// Durchschnitt insgesamt
	if (Student.gesamt['omndl'] && Student.gesamt['schriftlich']){
		Student.gesamt.rechnerisch = Student.gesamt['omndl']*SETTINGS.gewichtung['mündlich'] + Student.gesamt['oschr']*SETTINGS.gewichtung['schriftlich']
	}else{
		Student.gesamt.rechnerisch = 0;
	}

	// Kompetenzen
	var kompetenzen = [0,0,0,0,0];
	var Infos, temp_leistung;
	// -- Itteriere durch Leistungsart
	for (var i = 0; i < art.length; i++) {
		// Itteriere durch Leistung und Auswahl von mitgeschriebenen Objekten erstellen
		Infos = Leistungen[art[i]];
		for (l in Infos) {
			temp_leistung = Student[art[i]][l];
			// mitgeschrieben und mit Kategrorien ?
			if (temp_leistung && temp_leistung.Mitschreiber == "true" && temp_leistung.Verteilung) {
				var hundertProzent = Infos[l].Verteilungen[temp_leistung.Verteilung];
				// Prozentsummen
				kompetenzen[0] += temp_leistung.Kat1 / hundertProzent.Kat1;
				kompetenzen[1] += temp_leistung.Kat2 / hundertProzent.Kat2;
				kompetenzen[2] += temp_leistung.Kat3 / hundertProzent.Kat3;
				kompetenzen[3] += temp_leistung.Kat4 / hundertProzent.Kat4;
				// Counter
				kompetenzen[4] += 1;
			}
		}
	}
	Student.kompetenzen = Array(
		Math.round((kompetenzen[0]/kompetenzen[4])*100)/100 || 0,
		Math.round((kompetenzen[1]/kompetenzen[4])*100)/100 || 0,
		Math.round((kompetenzen[2]/kompetenzen[4])*100)/100 || 0,
		Math.round((kompetenzen[3]/kompetenzen[4])*100)/100 || 0,
	);

	return Student;
}


function schnitt(_obj, bol_fspz){
	// Besonderheiten bei Trennung von Vok und Gra beachten !
	var i, _row, r = 0;
	var iAnz = 0;
	var _Gra = {};
	var _Vok = {};
	if (!bol_fspz){
		if (_obj == {}) {
			return "";
		}else{
			for (_row in _obj){
				iAnz += _obj[_row].Gewichtung;
				r = r + parseFloat(_obj[_row].Note*_obj[_row].Gewichtung);
			}
			return Math.round((r/iAnz)*100)/100 || "";
		}
	}else{
		for (_row in _obj){
			if (_obj[_row].Bezeichnung == "Grammatik"){
				_Gra[_row] = _obj[_row];
			}else if (_obj[_row].Bezeichnung == "Vokabeln"){
				_Vok[_row] = _obj[_row];
			}
		}
		return {Vokabeln:schnitt(_Vok)||"", Grammatik:schnitt(_Gra)||"", Gesamt:schnitt(_obj)};
	}
}


function schnitt_m_f(omndl, ofspz){
// Schnitt zwischen oMndl und Fspz
	var gew_fspz = SETTINGS.gewichtung["davon fachspezifisch"];
	var gew_mndl0 = 1.0 - gew_fspz;
	if (ofspz > 0 && omndl > 0){
		return Math.round((omndl*gew_mndl0+ofspz*gew_fspz)*100)/100 || "";
	}else if (omndl){
		return Math.round((omndl)*100)/100 || "";
	}else if (ofspz){
		return Math.round((ofspz)*100)/100 || "";
	}
	return "";
}


// =================================================== //
// ================ Slider  Functions ================ //
// =================================================== //


function itemAbort(names, target_site) {
	var i;
	for (i=0;i<names.length;i++){
		document.getElementById(names[i]).classList.remove('show');
	}
	setTimeout(function(){
		window.location = target_site;
	},400);
}

function slide(event) {
	scroll(0,0);
	var addBtn = document.getElementById('btn_Add');
	var i, slideElements = document.getElementsByClassName('uebersicht');
	// Flip
	for (i=0;i<slideElements.length;i++){
		slideElements[i].classList.toggle('show');
	}
	// Add-Button
	var slideIndex = document.getElementsByClassName('uebersicht show')[0].id;
	addBtn.setAttribute('data-name', slideIndex+'Add');
	// Marker
	document.getElementsByClassName('marker')[0].className = "marker "+slideIndex;
	document.getElementsByClassName('marker')[1].className = "marker "+slideIndex;
	// Store
	sessionStorage.setItem('lastview', slideIndex);
}

function slide2(slideName){
// Nur für die Übersichten
	scroll(0,0);
	var addBtn = document.getElementById('btn_Add');
	document.getElementsByClassName('marker')[0].className = "marker "+slideName;
	document.getElementsByClassName('marker')[1].className = "marker "+slideName;
	var items = ["item1","item2"];
	var slideElement = items.splice(items.indexOf(slideName),1)[0];
		slideElement = document.getElementById(slideElement);
		slideElement.classList.add('show');
	var hideElement = document.getElementById(items[0]);
		hideElement.classList.remove('show');
	addBtn.setAttribute('data-name', slideName+'Add');
	sessionStorage.setItem('lastview', slideName);
}

function popUp(popWindow){
	setTimeout(function() {
	document.getElementById(popWindow).classList.add('showPop');
	}, 100);
	document.getElementById('fadeBlack').classList.remove('hide');
	window.addEventListener('keydown', keyFunctions);
}

function keyFunctions(event){
	if (event.keyCode == 27){
		var popUp = document.querySelector('.showPop .close a');
		popUpClose(popUp, false);
	}
}

function fspz_Bezeichnung(){
// --> Bezeichnungsfeld verinheitlichen
	var nArt = document.getElementById('notenArt');
	var gewichtung = document.getElementById('rangeSlide');
	if (SETTINGS.fspzDiff){
		var textfield = document.getElementById('notenBezeichnung');
		var selectfield = document.getElementById('notenBezeichnung_Select');
		if (nArt.value == "fspz"){
			textfield.classList.add("hide");
			selectfield.classList.remove("hide");
			textfield.value = selectfield.value;
		}else{
			textfield.classList.remove("hide");
			selectfield.classList.add("hide");
		}
	}
	if (nArt.value == "fspz"){
		gewichtung.setAttribute('disabled', 'disabled');
		document.getElementById('rangeWert').innerHTML = 1;
		gewichtung.value = 1;
	} else if (gewichtung.getAttribute("disabled")){
		gewichtung.removeAttribute('disabled');
	}		
	return true;
}

function fspz_Bezeichnung2(){
	document.getElementById('notenBezeichnung').value = document.getElementById('notenBezeichnung_Select').value;
}

function popUpClose(thisElement, bol_refresh){
	if(bol_refresh){
		db_readMultiData(listStudents, "student");
		db_readMultiData(listLeistung, "leistung");
	}
	thisElement.parentNode.parentNode.classList.remove('showPop');
	setTimeout(function() {
		thisElement.parentNode.parentNode.parentNode.classList.add('hide');
	}, 500);
	window.removeEventListener('keydown', keyFunctions);
}


// =================================================== //
// ============= Datenbank - Objekt-Hilfe ============ //
// =================================================== //

// Standard Einstellungen
function formSettings() {
	return {
		'typ': "settings",
		'changed': 0,
		'fspzDiff' : false,
		'gewichtung' : {
			"mündlich" : 0.6,
			"davon fachspezifisch" : 0.2,
			"schriftlich" : 0.4,
		},
		'klasse' : klasse,
		'kompetenzen' : {'Gesamt': "Gesamt", 1:"Kategorie 1", 2:"Kategorie 2", 3:"Kategorie 3", 4:"Kategorie 4"},
		'notenverteilung' : {1:95,2:80,3:75,4:50,5:25,6:0},
		'showVorjahr' : false,
		'studSort' : false,
	};
}

// Schüler mit ersten Daten
function formStudent(vName, nName, sex){
	sex = (sex) ? sex : "-";
	return {
		'typ' : "student",
		'name' : {
			'nname': nName,
			'vname': vName,
			'sex': sex,
		},
		'mndl' : {},
		'fspz' : {},
		'schr' : {},
		'gesamt' : {
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
		},
		'kompetenzen' : [],
		'changed' : 0,
	}
}

// Leistung mit ersten Daten
function formLeistung(art, bezeichnung, datum, eintragung, gewicht) {
	return {
		'typ': "leistung",
		'subtyp': art,
		'changed': 0,
		'Bezeichnung' : bezeichnung,
		'Datum' : datum,
		'Eintragung' : eintragung,
		'DS' : undefined,
		'Gewichtung' : gewicht,
		'Verteilungen' : {
			'Standard' : {
				'Kat1' : 0,
				'Kat2' : 0,
				'Kat3' : 0,
				'Kat4' : 0,
				'Gesamt' : 0,
			},
		},
		'Schreiber' : {
			'Bester' : undefined,
			'Schlechtester' : undefined,
			'nMitschr' : undefined,},
	};
}


// Helper zum geordneten Aufrufen der Schnitt-Update-Datenbankfunktionen
function handleSchnitt(callback, sID) {
	db_readMultiData(function(Leistungen){
		db_dynamicUpdate(
			callback,
			function(Student){ // Apply (anonym wegen Argumente)
				return schnitt_gesamt(Student, Leistungen);
			}, "student", sID)
	}, "leistung", function(){
			console.log("noch keine Leistungen da... Callback!");
			callback();
		}
	);
}


// ==============================================================
// ================== Smartphone Anpassungen ====================
// ==============================================================

function change_buttons(buttons) {
	for (key in buttons) {
		document.getElementById(key).innerHTML = buttons[key]
	}
	/*
	var btn_add = document.getElementById('btn_Add')
		btn_add.innerHTML = "&#65291;";
	var btn_delete = document.getElementById('btn_Delete')
		btn_delete.innerHTML = "&#10006;";
	var btn_export = document.getElementById('export')
		btn_export.innerHTML = "&#9650;";
	*/
}