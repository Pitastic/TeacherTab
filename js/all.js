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

function quit(){
	if(window.confirm('Änderungen synchronisieren ?')){
		initSyncSQL();
	}else{
		window.location = "index.htm";
	}
}

function objLength(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
}

function sum(n){
	var i, r = 0;
	for (i=0;i<n.length;i++){
		r += parseInt(n[i]);
	}
	return r;
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

function datum(){
	var d = new Date();
	var monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	var tag, monat, jahr;
		tag = d.getDate();
		monat = monate[d.getMonth()];
		jahr = d.getFullYear();
	return tag+'. '+monat+' '+jahr;
}

function goBack(){
	readDB_tables(listIdx_Select,"");
	slide('uebersicht0_In', 'item0');
	noTouchSlider();
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
		readData(listStudents);
		readData(listLeistung);
	}
	thisElement.parentNode.parentNode.classList.remove('showPop');
	setTimeout(function() {
		thisElement.parentNode.parentNode.parentNode.classList.add('hide');
	}, 500);
	window.removeEventListener('keydown', keyFunctions);
}

// =================================================== //
// ================ Datenbank - Fnctn ================ //
// =================================================== //

function readSettings(callback){
	klasse = sessionStorage.getItem('klasse');
	readData(function(results){
		SETTINGS = results;
		delete SETTINGS.leistungen;
		console.log("Settings geladen");
		callback();
		}, 0);
}


function import_Column(from_column, from_klasse, to_column) {
	var sql_statement = 'UPDATE '+klasse+' SET '+to_column+'=(SELECT '+from_column+' FROM '+from_klasse+' WHERE '+from_klasse+'.nName = '+klasse+'.nName AND '+from_klasse+'.vName = '+klasse+'.vName) WHERE id != 0';
	db.transaction(
		function(transaction){
		transaction.executeSql(
		sql_statement, [], successHandler, errorHandler);
		});
	return;
}


function checkColumn(col, type) {
	type = type || "TEXT";
	var ergebnis;
	db.transaction(
		function(transaction){
		transaction.executeSql('SELECT '+col+' FROM '+klasse+'', [], null, function(){createColumn(col, type)});
	});
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