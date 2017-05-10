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

function createTest (newKlasse) {
	var now = Math.round(new Date().getTime() / 1000);
	// Leere Objekte (mndl, schr, fspz)
	var mndl, schr, fspz;
	mndl = schr = fspz = encodeURIComponent(JSON.stringify([]));
	db.transaction(
		function(transaction){
		transaction.executeSql(
		'CREATE TABLE IF NOT EXISTS '+newKlasse+'(id INTEGER PRIMARY KEY AUTOINCREMENT, vName TEXT, nName TEXT, sex TEXT, mndl TEXT, fspz TEXT, schr TEXT, omndl TEXT, oschr TEXT, gesamt TEXT, Kompetenzen TEXT, changed INTEGER);', [], null, errorHandler);
		transaction.executeSql(
		'INSERT OR IGNORE INTO '+newKlasse+'(id, mndl, fspz, schr, changed) VALUES (?, ?, ?, ?, ?)', [0, mndl, fspz, schr, now], null, errorHandler);
		transaction.executeSql(
		'INSERT OR IGNORE INTO '+newKlasse+'(nName, vName, mndl, fspz, schr, changed) VALUES (?, ?, ?, ?, ?, ?)', ["Humberg", "Cornelia", mndl, fspz, schr, now], null, errorHandler);
		transaction.executeSql(
		'INSERT OR IGNORE INTO '+newKlasse+'(nName, vName, mndl, fspz, schr, changed) VALUES (?, ?, ?, ?, ?, ?)', ["Prior", "Michael", mndl, fspz, schr, now], null, errorHandler);
		});
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

function calc_Durchschnitt(){
// --> nach neuer Eintragung die Gesamtnote aller Schüler neu berechnen
	db.transaction(
	function(transaction){
	transaction.executeSql(
		'SELECT id, oschr, omndl, ofspz, gesamt FROM '+klasse+' WHERE id !=0', [], function(t, results){
			// schr und mndl und fspz neuberechnen
			var omndl, oschr, gesamt, rechnerisch, eingetragen;
			var gew_mndl = SETTINGS.gewichtung["mündlich"];
			var gew_schr = SETTINGS.gewichtung["schriftlich"];
			for (var i=0;i<results.rows.length;i++){
				var id = results.rows.item(i).id;
				// Gesamtnote mit Gewichtung errechnen :
				// -- Gewichtung mndl-schr
				omndl = results.rows.item(i).omndl;
				oschr = results.rows.item(i).oschr;
				if (oschr == 0 || omndl == 0){
					rechnerisch = 0;
				}else{
					rechnerisch = omndl*gew_mndl+oschr*gew_schr;
				}
				eingetragen = JSON.parse(decodeURIComponent(results.rows.item(i).gesamt)).eingetragen;
				gesamt = encodeURIComponent(JSON.stringify({"rechnerisch": rechnerisch, "eingetragen": eingetragen}));
				// DB Update
				transaction.executeSql('UPDATE '+klasse+' SET gesamt="'+gesamt+'" WHERE id="'+id+'";', [], null, errorHandler);
			}
		});
	}
	);
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

function updateVerteilungHTML(Pkt_Verteilung){
//--> Update der Anzeige anhand von SessionStorage-Daten
	var i;
	var werteBox = document.getElementById('item2_info_Verteilung');
	// Balken Grafik ---
	var balken = werteBox.getElementsByClassName('balken');
	var gesamtWert = sessionStorage.getItem(Pkt_Verteilung+'_Gesamt');
	for ( i=0 ; i<balken.length; i++){
		var katWert = sessionStorage.getItem(Pkt_Verteilung+'_Kat'+(i+1));
		var schiene_span = balken[i].parentNode.getElementsByTagName('span')[0];
		var kat_span = document.getElementById('item2_info_Kat'+(i+1));
			kat_span.innerHTML = katWert;
		balken[i].style.width = ((katWert/gesamtWert)*100).toFixed(0) +"%";
		schiene_span.innerHTML = ((katWert/gesamtWert)*100).toFixed(1) +" %";
	}
	var gesamt_div = document.getElementById('item2_info_gesamt');
		gesamt_div.innerHTML = "Gesamt : "+gesamtWert;
}

function updateVerteilung(inputs, Pkt_Verteilung){
//--> Verteilungen ändern, WebSQL update und SessionStorage update
	var i, wertArray = [];
	var alleSchuler = document.getElementById('arbeit_leistung');
	if (inputs.length>1) {
		for (i=0; i<inputs.length;i++){
			wertArray[i] = parseFloat(inputs[i].value);
			sessionStorage.setItem(Pkt_Verteilung+'_Kat'+(i+1), wertArray[i]);
		}
		sessionStorage.setItem(Pkt_Verteilung+'_Gesamt', sum(wertArray));
	}
	db.transaction(
		function(transaction){
		var column = sessionStorage.getItem('leistung_column');
		var l_id = sessionStorage.getItem('leistung_id');
		transaction.executeSql(
		'SELECT '+column+' FROM '+klasse+' WHERE id="0";', [], function(t, results){
			var Leistung = JSON.parse(decodeURIComponent(results.rows.item(0)[column]))[l_id];
			var obj = JSON.parse(decodeURIComponent(results.rows.item(0)[column]));
			if (inputs.length>1) {
				Leistung[Pkt_Verteilung] = {
					"Kat1" : wertArray[0],
					"Kat2" : wertArray[1],
					"Kat3" : wertArray[2],
					"Kat4" : wertArray[3],
					"Gesamt" : sum(wertArray),
				};
			}else{
				Leistung[Pkt_Verteilung] = {
					"Gesamt" : inputs,
				};
			}
			if (Leistung.Verteilungen.indexOf(Pkt_Verteilung)<0){
				Leistung.Verteilungen.push(Pkt_Verteilung);
			}
			obj[l_id] = Leistung;
			updateDB(column, JSON.stringify(obj), 0);
		}
		);
		}
	);
	if (inputs.length>1){
		updateVerteilungHTML(Pkt_Verteilung);
	}
	updateNoten(alleSchuler, false);
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
	var i, _row, r = 0;
	var iAnz = 0;
	var _Gra = {};
	var _Vok = {};
	if (!bol_fspz){
		for (i=0;i<_obj.alle.length;i++){
			_row = _obj[_obj.alle[i]];
			iAnz += _row.Gewichtung;
			r = r + parseFloat(_row.Note*_row.Gewichtung);
		}
		return Math.round((r/iAnz)*100)/100 || "";
	}else{
		_Gra.alle = [];
		_Vok.alle = [];
		for (i=0;i<_obj.alle.length;i++){
			// Array mit je Vok und Gra erstellen
			if (_obj[_obj.alle[i]].Bezeichnung == "Grammatik"){
				_Gra.alle.push(_obj.alle[i]);
				_Gra[_obj.alle[i]] = _obj[_obj.alle[i]];
			}else if (_obj[_obj.alle[i]].Bezeichnung == "Vokabeln"){
				_Vok.alle.push(_obj.alle[i]);
				_Vok[_obj.alle[i]] = _obj[_obj.alle[i]];
			}
		}
		return {Vokabeln:schnitt(_Vok)||"", Grammatik:schnitt(_Gra)||"", Gesamt:schnitt(_obj)};
	}
}

function schnitt_m_f(omndl, ofspz){
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

function calc_KatDs(id){
//--> Durchschnittserrechnung aller Kats, die mitgeschrieben wurden.
	// Daten neu berechnen, speichern, Flag löschen
	db.transaction(
	function(transaction){
	transaction.executeSql(
		'SELECT * FROM '+klasse+' WHERE id = 0 OR id= '+id, [], function(transaction, results){
			var temp_leistung, i, _id;
			var schrInfo = JSON.parse(decodeURIComponent(results.rows.item(0).schr));
			var oschr = JSON.parse(decodeURIComponent(results.rows.item(1).schr));
			var kat = [0,0,0,0];
			var kat_S = [0,0,0,0];
			for (i=0;i<oschr.alle.length;i++){
				_id = oschr.alle[i];
				if (schrInfo[_id].Eintragung == "Rohpunkte" && oschr[_id].Mitschreiber == "true"){
					temp_leistung = schrInfo[_id][oschr[_id].Verteilung];
					kat[0] += temp_leistung.Kat1;
					kat[1] += temp_leistung.Kat2;
					kat[2] += temp_leistung.Kat3;
					kat[3] += temp_leistung.Kat4;
					kat_S[0] += oschr[_id].Kat1;
					kat_S[1] += oschr[_id].Kat2;
					kat_S[2] += oschr[_id].Kat3;
					kat_S[3] += oschr[_id].Kat4;
				}
			}
			kat_S[0] = (kat_S[0] !== 0) ? (kat_S[0]/kat[0])*100 : 0;
			kat_S[1] = (kat_S[1] !== 0) ? (kat_S[1]/kat[1])*100 : 0;
			kat_S[2] = (kat_S[2] !== 0) ? (kat_S[2]/kat[2])*100 : 0;
			kat_S[3] = (kat_S[3] !== 0) ? (kat_S[3]/kat[3])*100 : 0;
			// Werte in DB schreiben
			var toSave = []
			for (i=0;i<4;i++){
				toSave.push(Math.round(kat_S[i]));
			}
			updateDB("Kompetenzen",JSON.stringify(toSave),id)
		}
	)});
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