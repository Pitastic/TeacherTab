"use strict";
// esLint Globals:
/* global $ SETTINGS GLOBALS
closeListener formLeistung slide1 handleDeleteLeistung fspz_Bezeichnung compareStudents popUp popUpClose updateNoten sum timestamp handleSchnitt RohpunkteAlsNote
db_readMultiData db_readKlasse db_dropKlasse db_simpleUpdate db_dynamicUpdate db_deleteDoc db_replaceData db_readSingleData db_updateData
sync_deleteKlasse sync_pushBack sync_getKlasse*/

$(document).ready(function() {
	var id = parseInt(sessionStorage.getItem('student'));
	// Funktionen, die auf global SETTINGS warten müssen
	db_readMultiData(function(r){
		// Settings laden
		SETTINGS = r[0];

		// List first View
		db_readMultiData(function(r){
			firstListing(r, function(){
		
				// Fülle first View
				db_readSingleData(studentDetails, "student", id);
		
			});
		}, "leistung");
	
	}, "settings");

	// Event-Listener
	closeListener();
	//touchListener(['header', 'footer', 'fadeBlack', 'KeyBar'])
	var pop = document.getElementById('item0edit');

	// -- Editieren
	pop.getElementsByClassName('button OK')[0].addEventListener('click', function(){
		var that = this;
		document.getElementById('header').getElementsByTagName('h1')[0].innerHTML = document.getElementById('vName').value+" "+document.getElementById('nName').value;
		var newStudent = {};
		newStudent[id] = {
			'name' : {
				'nname': document.getElementById('nName').value,
				'vname': document.getElementById('vName').value,
				'sort': document.getElementById('s_flag').value,
				'changed' : timestamp(),
			}
		};
		db_updateData(function(){
			popUpClose(that);
			slide1('item1details', "uebersicht.htm");
		}, newStudent);
	});	

	// -- Löschen
	// DEV : Änderung syncen !?!
	pop.getElementsByClassName('button ABORT')[0].addEventListener('click', function(){
		if (window.confirm('Bist du sicher, dass du diesen Schüler inklusive allen Eintragungen unwiderruflich löschen möchtest ?')){
			pop.classList.remove('showPop');
			// Schüler löschen
			db_deleteDoc(
				// anschließend seine id auf Blacklist setzen
				function(){
					db_simpleUpdate(function(){
						slide1('item1details', "uebersicht.htm");
					}, 1, "blacklist", "push", id.toString());
				}, id);
		}
	});

	// -- Eventlistener für Leistungen
	setTimeout(function() {
		var i, liAll = document.getElementById('studentInfo').getElementsByTagName('li');
		for (i=0; i<liAll.length; i++){
			liAll[i].addEventListener('click', function(){
				sessionStorage.setItem('leistung_id', this.id);
				sessionStorage.setItem('leistung_art', this.getAttribute('data-column'));
				sessionStorage.setItem('jump_id', true);
				slide1('item1details', "details_leistungen.htm");				
			});
		}
	}, 200);

});


// Maske mit Standardeintragungen erstellen
function firstListing(results, callback) {
	if (typeof results === 'undefined') {results = [];}
	// - Alle Leistungen vorbereiten und auflisten
	var span, ul, li, h3;
	
	// - Leistungsindex speichern
	var mndl = {};
	var fspz = {};
	var schr = {};
	for (var idx = 0; idx < results.length; idx++) {
		var result = results[idx];
		if (result.subtyp == "mndl") {
			mndl[result.id] = result;
		}else if (result.subtyp == "fspz") {
			fspz[result.id] = result;
		}else if (result.subtyp == "schr") {
			schr[result.id] = result;
		}
	}

	// Vordruck erstellen
	// -- Gesamtleistung
	// -- -- im Markup enthalten
	// -- -- Gewichtung
	var gew_mndl = SETTINGS.gewichtung["mündlich"]*100;
	var gew_fspz = SETTINGS.gewichtung["davon fachspezifisch"]*100;
	var gew_schr = SETTINGS.gewichtung["schriftlich"]*100;
	var gew_divs = document.getElementById('item1_gewichtung').getElementsByTagName('div');
	gew_divs[0].style.width = gew_mndl+"%";
	span = document.createElement('span');
	span.innerHTML = "mündlich : "+gew_mndl+" %";
	gew_divs[0].appendChild(span);
	gew_divs[1].style.width = gew_fspz+"%";
	span = document.createElement('span');
	span.innerHTML = "("+gew_fspz+" %)";
	gew_divs[1].appendChild(span);
	gew_divs[2].style.width = gew_schr+"%";
	span = document.createElement('span');
	span.innerHTML = "schriftlich : "+gew_schr+" %";
	gew_divs[2].appendChild(span);

	// -- mündlich
	var mndl_div = document.getElementById("item1_mndl");
	ul = document.createElement('ul');
	for (var _id in mndl) {
		li= document.createElement('li');
		li.id = _id;
		li.setAttribute('data-column', 'mndl');
		span = document.createElement('span');
		span.innerHTML = mndl[_id].Bezeichnung;
		li.appendChild(span);
		span = document.createElement('span');
		span.innerHTML = mndl[_id].Datum;
		li.appendChild(span);
		span = document.createElement('span'); // Gewichtung
		span.innerHTML = mndl[_id].Gewichtung + "x";
		span.className = 'gewichtung';
		li.appendChild(span);
		span = document.createElement('span'); // Lupe
		span.className = 'lupe';
		li.appendChild(span);
		span = document.createElement('span');
		span.className = "note";
		span.innerHTML = "-";
		li.appendChild(span);
		ul.appendChild(li);
		mndl_div.appendChild(ul);
	}
	var fspz_div = document.createElement("div");
	fspz_div.className = "fspz_div";
	var fspz_Vok = document.createElement("ul");
	var fspz_Gra = document.createElement("ul");
	// -- -- -- Vok oder Gra
	if (!SETTINGS.fspzDiff){
		// -- -- fspz zusammenfassen
		for (var _id2 in fspz) {
			li= document.createElement('li');
			li.id = _id2;
			li.setAttribute('data-column', 'fspz');
			span = document.createElement('span');
			span.innerHTML = fspz[_id2].Bezeichnung;
			li.appendChild(span);
			span = document.createElement('span');
			span.innerHTML = fspz[_id2].Datum;
			li.appendChild(span);
			span = document.createElement('span'); // Gewichtung
			span.innerHTML = fspz[_id2].Gewichtung + "x";
			span.className = 'gewichtung';
			li.appendChild(span);
			span = document.createElement('span'); // Lupe
			span.className = 'lupe';
			li.appendChild(span);
			span = document.createElement('span');
			span.className = "note";
			span.innerHTML = "-";
			li.appendChild(span);
			fspz_Vok.appendChild(li);
		}
		h3 = document.createElement("h3");
		h3.innerHTML = "Fachspezifisches";
		h3.id = "ds_fspz";
		span = document.createElement('span');
		span.className = "Notendurchschnitt";
		h3.appendChild(span);
		fspz_div.appendChild(h3);
		fspz_div.appendChild(fspz_Vok);
	}else{
		// -- -- fspz differenzieren
		for (var _id3 in fspz) {
			li= document.createElement('li');
			li.id = _id3;
			li.setAttribute('data-column', 'fspz');
			span = document.createElement('span');
			li.appendChild(span);
			span = document.createElement('span');
			span.innerHTML = fspz[_id3].Datum;
			li.appendChild(span);
			span = document.createElement('span'); // Gewichtung
			span.innerHTML = fspz[_id3].Gewichtung + "x";
			span.className = 'gewichtung';
			li.appendChild(span);
			span = document.createElement('span'); // Lupe
			span.className = 'lupe';
			li.appendChild(span);
			span = document.createElement('span');
			span.className = "note";
			span.innerHTML = "-";
			li.appendChild(span);
			if (fspz[_id3].Bezeichnung.substring(0,3) == "Vok"){
				fspz_Vok.appendChild(li);
			}else{
				fspz_Gra.appendChild(li);
			}
		}
		h3 = document.createElement("h3");
		h3.innerHTML = "Vokabeln";
		h3.id = "ds_fspz_vok";
		span = document.createElement('span');
		span.className = "Notendurchschnitt";
		h3.appendChild(span);
		fspz_div.appendChild(h3);
		fspz_div.appendChild(fspz_Vok);
		h3 = document.createElement("h3");
		h3.innerHTML = "Grammatik";
		h3.id = "ds_fspz_gra";
		span = document.createElement('span');
		span.className = "Notendurchschnitt";
		h3.appendChild(span);
		fspz_div.appendChild(h3);
		fspz_div.appendChild(fspz_Gra);
	}
	mndl_div.appendChild(fspz_div);

	// -- schriftlich
	var schr_div = document.getElementById("item1_schr");
	ul = document.createElement('ul');
	for (var _id4 in schr) {
		li= document.createElement('li');
		li.id = _id4;
		li.setAttribute('data-column', 'schr');
		span = document.createElement('span');
		span.innerHTML = schr[_id4].Bezeichnung;
		li.appendChild(span);
		span = document.createElement('span');
		span.innerHTML = schr[_id4].Datum;
		li.appendChild(span);
		span = document.createElement('span'); // Gewichtung
		span.innerHTML = schr[_id4].Gewichtung + "x";
		span.className = 'gewichtung';
		li.appendChild(span);
		span = document.createElement('span'); // Lupe
		span.className = 'lupe';
		li.appendChild(span);
		span = document.createElement('span');
		span.className = "note";
		span.innerHTML = "-";
		li.appendChild(span);
		ul.appendChild(li);
		schr_div.appendChild(ul);
	}
	// -- Kategorien
	h3 = document.createElement("h3");
	h3.innerHTML = "Kategorien";
	ul = document.createElement('div');
	ul.id = "differenzierteLeistung";
		
	li= document.createElement('div');
	li.className = "Kategorien";
	span = document.createElement('span');
	span.classList.add('katSpans');
	li.appendChild(span);
	span = document.createElement('span');
	span.innerHTML = SETTINGS.kompetenzen.Kat1;
	li.appendChild(span);
	ul.appendChild(li);
			
	li= document.createElement('div');
	li.className = "Kategorien";
	span = document.createElement('span');
	span.classList.add('katSpans');
	li.appendChild(span);
	span = document.createElement('span');
	span.innerHTML = SETTINGS.kompetenzen.Kat2;
	li.appendChild(span);
	ul.appendChild(li);
		
	li= document.createElement('div');
	li.className = "Kategorien";
	span = document.createElement('span');
	span.classList.add('katSpans');
	li.appendChild(span);
	span = document.createElement('span');
	span.innerHTML = SETTINGS.kompetenzen.Kat3;
	li.appendChild(span);
	ul.appendChild(li);
		
	li= document.createElement('div');
	li.className = "Kategorien";
	span = document.createElement('span');
	span.classList.add('katSpans');
	li.appendChild(span);
	span = document.createElement('span');
	span.innerHTML = SETTINGS.kompetenzen.Kat4;
	li.appendChild(span);
	ul.appendChild(li);
		
	schr_div.appendChild(h3);
	schr_div.appendChild(ul);


	// Listing abgeschlossen - Callback
	callback();
	return;
}

function studentDetails(row){
	var note, temp_el;
	var mndl = row.mndl;
	var fspz = row.fspz;
	var schr = row.schr;
	
	document.getElementById('header').getElementsByTagName('h1')[0].innerHTML = row.name.vname+" "+row.name.nname;
	document.getElementById('vName').value = row.name.vname;
	document.getElementById('nName').value =row.name.nname;
	document.getElementById('s_flag').value = row.name.sort || "";

	// Einzelne Leistungen
	// -- mündlich
	for (var l_id in mndl){
		temp_el = document.getElementById(l_id) || null;
		if (temp_el) {
			temp_el = temp_el.getElementsByTagName('span')[4];
			if (mndl[l_id].Note && mndl[l_id].Prozent){
				note = mndl[l_id].Note+" ("+mndl[l_id].Prozent+")";
			}else{
				note = mndl[l_id].Note;
			}
			temp_el.innerHTML = note || "-";
		}
	}
	// -- fachspezifisch
	for (var l_id2 in fspz){
		temp_el = document.getElementById(l_id2) || null;
		if (temp_el) {
			temp_el = temp_el.getElementsByTagName('span')[4];
			if (fspz[l_id2].Note && fspz[l_id2].Prozent){
				note = "("+fspz[l_id2].Prozent+") "+fspz[l_id2].Note;
			}else{
				note = fspz[l_id2].Note;
			}
			temp_el.innerHTML = note || "-";
		}
	}
	// -- schriftlich
	for (var l_id3 in schr){
		temp_el = document.getElementById(l_id3) || null;
		if (temp_el) {
			temp_el = temp_el.getElementsByTagName('span')[4];
			if (schr[l_id3].Note && schr[l_id3].Prozent){
				note = schr[l_id3].Note+" ("+schr[l_id3].Prozent+") ";
			}else{
				note = schr[l_id3].Note;
			}
			temp_el.innerHTML = note || "-";
		}
	}
	// Gesamt Noten (bestehende Ergebnisse aus der Datenbank)
	if (SETTINGS.set_showVorjahr) {
		var vorjahr = JSON.parse(decodeURIComponent(row.vorjahr));
		var vorjSpan = document.getElementById('ds_gesamt').getElementsByClassName('Vorjahresnote')[0];
		vorjSpan.innerHTML += (vorjahr) ? vorjahr.eingetragen+") " : "n/a) ";
		vorjSpan.classList.remove('hide');
	}
	document.getElementById('ds_gesamt').getElementsByClassName('Notendurchschnitt')[0].innerHTML = (row.gesamt.rechnerisch) ? row.gesamt.rechnerisch.toPrecision(3) : "-";
	document.getElementById('ds_gesamt_eingetragen').getElementsByTagName('select')[0].value = row.gesamt.eingetragen || "-";
	document.getElementById('ds_mndl').getElementsByClassName('Notendurchschnitt')[0].innerHTML = row.gesamt.omndl || "-";
	if (!SETTINGS.fspzDiff){
		document.getElementById('ds_fspz').getElementsByClassName('Notendurchschnitt')[0].innerHTML = row.gesamt.ofspz.Gesamt || "-";
	}else{
		document.getElementById('ds_fspz_vok').getElementsByClassName('Notendurchschnitt')[0].innerHTML = row.gesamt.ofspz.Vokabeln || "-";
		document.getElementById('ds_fspz_gra').getElementsByClassName('Notendurchschnitt')[0].innerHTML = row.gesamt.ofspz.Grammatik || "-";
	}
	document.getElementById('ds_schr').getElementsByClassName('Notendurchschnitt')[0].innerHTML = row.gesamt.oschr || "-";
	// Kompetenzen
	var k, katDivs = document.getElementById('differenzierteLeistung').getElementsByClassName('katSpans');
	for (var i=0;i<katDivs.length;i++){
		k = Math.round((row.kompetenzen[i]*100));
		katDivs[i].innerHTML = (k) ? k +" &#037;" : "-";
	}

	// Save-Button
	document.getElementById('Save').onclick = function(){
		item1Save(row.id);
	};

	// Animation
	//slide1('item1details');
	return;
}

// Speichern und Verlassen
function item1Save(id){
//--> ggf. neue Schülerdaten aktualisieren und Note eintragen
	var changed = timestamp();
	var newStudent = {};
	newStudent[id] = {
		'name' : {
			'nname' : document.getElementById('nName').value,
			'vname' : document.getElementById('vName').value,
			'sex' : document.getElementById('s_flag').value,
			'changed' : changed,
		},
		'gesamt' : {
			'eingetragen' : parseInt(document.getElementById('ds_gesamt_eingetragen').getElementsByTagName('select')[0].value) || null,
			'changed' : changed,
		},
	};

	db_updateData(
		function(){
			// Animation
			slide1('item1details', "uebersicht.htm");
		}, newStudent);
}
