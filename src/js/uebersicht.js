"use strict";
// esLint Globals:
/* global $ SETTINGS GLOBALS SHIMindexedDB CryptoJS objLength
removeDups closeListener addListener slide2 change_buttons datum itemAbort formStudent formLeistung slide1 handleDeleteLeistung fspz_Bezeichnung compareStudents popUp popUpClose updateNoten sum timestamp handleSchnitt RohpunkteAlsNote createAccount isObject updateStatus mergeDeep formSettings
db_addDocument waitForDB db_neueKlasse db_readMultiData db_readKlasse db_dropKlasse db_simpleUpdate db_dynamicUpdate db_deleteDoc db_replaceData db_readSingleData db_updateData
sync_deleteKlasse sync_pushBack sync_getKlasse*/

window.addEventListener('load', function () {
	// Funktionen, die auf global SETTINGS warten müssen
	db_readMultiData(function(r){
		SETTINGS = r[0];
		db_readMultiData(listLeistung, "leistung", function(){listLeistung([]);});
		// List first View
		handleSchnitt(function(){
			db_readMultiData(listStudents, "student");
		});
	}, "settings");

	// Event-Listener
	addListener();
	closeListener();
	setTimeout(function(){
		slide2(sessionStorage.getItem('lastview'));
	},100);
});


// ===================================================== //
// ============ Listings =============================== //
// ===================================================== //

// Tabellenübersicht aus Array aller Schüler erstellen
function listStudents(results) {
	if (typeof results === 'undefined') {results = [];}

	// Sortieren der Schüler
	results.sort(compareStudents);

	// Listing
	var c, r, ul, old, row, omndl, ofspz, oschr, len;
	old = document.getElementById("listStudents").getElementsByTagName('ul')[0];
	ul = document.createElement('ul');
	for (var i = 0; i < results.length; i++) {
		row = results[i];
		omndl = row.gesamt.omndl;
		ofspz = row.gesamt.ofspz.Gesamt;
		oschr = row.gesamt.oschr;
		r = document.createElement('li');
		r.setAttribute('data-rowid', row.id);
		if (row.name.sort && row.name.sort !== "-" && row.name.sort !== "null"){
			c = document.createElement('div');
			c.className = "s_flag";
			c.innerHTML = row.name.sort;
			r.appendChild(c);
		}
		c = document.createElement('div');
		c.className = "name";
		c.innerHTML = row.name.nname+', '+row.name.vname;
		r.appendChild(c);
		c = document.createElement('div');
		c.className = "mdl";
		c.innerHTML = (omndl) ? omndl.toPrecision(2) : "-";
		r.appendChild(c);
		c = document.createElement('div');
		c.className = "fspz";
		c.innerHTML = (ofspz) ? "("+ofspz.toPrecision(2)+")" : "(-)";
		r.appendChild(c);
		c = document.createElement('div');
		c.className = "schr";
		c.innerHTML = (oschr) ? oschr.toPrecision(2) : "-";
		r.appendChild(c);
		if (!row.gesamt.eingetragen){
			c = document.createElement('div');
			c.className = "gesamt";
			c.innerHTML = (row.gesamt.rechnerisch) ? "&#216; "+row.gesamt.rechnerisch.toPrecision(3) : "&#216; - . --";
			r.appendChild(c);
		}else{
			c = document.createElement('div');
			c.className = "gesamt eingetragen";
			c.innerHTML = row.gesamt.eingetragen;
			r.appendChild(c);
		}
			
		c = document.createElement('div');
		c.className = "tools right";
		c.innerHTML = "&gt;";
		r.appendChild(c);
		ul.appendChild(r);
	}
	old.parentNode.replaceChild(ul,old);
	var tr = ul.getElementsByTagName('li');
	var item1Content = document.getElementById('item1').getElementsByClassName('content')[0];
	len = tr.length;
	if (len) {
		// Grafik entfernen
		item1Content.classList.remove('emptyList');
		// EventListener
		for (i=0; i<len; i++){
			tr[i].addEventListener('click', function(){
				sessionStorage.setItem('student', this.getAttribute('data-rowid'));
				itemAbort(['item1'],'details_students.htm');
			});
		}
	}else{
		item1Content.classList.add('emptyList');
	}
}


// Auflisten aller Leistungen als Tabelle
function listLeistung(results){
	if (typeof results === 'undefined') {results = [];}
	var c, r, ul, idx, art, Leistung, hasEntries;
	var old = document.getElementById("listLeistung").getElementsByTagName('ul');
	
	var arten = ['mndl', 'fspz', 'schr'];
	for (art = 0; art < arten.length; art++){
		hasEntries = false;

		// Abarbeiten der Listen nach Leistungsart (Leistungs-Loop)
		ul = document.createElement('ul');
		for (idx = 0; idx < results.length; idx++) {

			if (results[idx].subtyp == arten[art]) {
				// Leistung hat einen Eintrag > auflisten
				hasEntries = true;
				Leistung = results[idx];

				r = document.createElement('li');
				r.setAttribute('data-l_subtyp', Leistung.subtyp);
				r.setAttribute('data-l_id', Leistung.id);
				c = document.createElement('div');
				c.className = "name";
				c.innerHTML = Leistung.Bezeichnung;
				r.appendChild(c);
				c = document.createElement('div');
				c.innerHTML = Leistung.Datum;
				r.appendChild(c);
				c = document.createElement('div');
				c.innerHTML = "&#160;";
				c.classList.add(Leistung.Eintragung.toLowerCase());
				r.appendChild(c);
				c = document.createElement('div');
				c.innerHTML = Leistung.Gewichtung + "x";
				c.className = "gewichtung";
				r.appendChild(c);
				c = document.createElement('div');
				c.className = "tools right";
				c.innerHTML = "&gt;";
				r.appendChild(c);
				ul.appendChild(r);
			}

		} // ende des Leistungs-Loops

		if (!hasEntries){
			// Leistung hatte keine Einträge
			r = document.createElement('li');
			c = document.createElement('div');
			c.className = "keine";
			c.innerHTML = "- keine -";
			r.appendChild(c);
			ul.appendChild(r);
		}
		
		old[art].parentNode.replaceChild(ul,old[art]);

	} // ende des Arten-Loops

	// PopUp Datum
	document.getElementById('notenDatum').value = datum();
	// Eventlistener	
	var tr = document.getElementById('listLeistung').getElementsByTagName('li');
	for (var i=0; i<tr.length; i++){
		tr[i].addEventListener('click', function(){
			var id_Leistung = this.getAttribute('data-l_id');
			if (id_Leistung) {
				// Leistung hinterlegen
				sessionStorage.setItem('leistung_id', this.getAttribute('data-l_id'));
				sessionStorage.setItem('leistung_art', this.getAttribute('data-l_subtyp'));
				itemAbort(['item2'],'details_leistungen.htm');
			}else{
				// Leeres Feld ausgewählt - "Hinzufügen"-Dialog
				var ulList = this.parentNode.parentNode.getElementsByTagName('ul');
				var ul = this.parentNode;
				var choose;
				for (var idx = ulList.length - 1; idx >= 0; idx--) {
					if (ulList.item(idx) == ul){
						choose = Array("mndl", "fspz", "schr")[idx];
					}
				}
				// -- PopUp
				document.getElementById("notenArt").value = choose;
				if (SETTINGS.fspzDiff) {fspz_Bezeichnung();}
				var add = document.getElementById('btn_Add');
				popUp(add.getAttribute('data-name'));
			}
		});
	}
}


// ===================================================== //
// ============ Addings ================================ //
// ===================================================== //

// neuer Schüler (einzeln)
function addStudent(el){
	var vName = this.vName.value;
	var nName = this.nName.value;
	
	db_addDocument(function(e){
		popUpClose(el);
		this.vName.value = '';
		this.nName.value = '';
		db_readMultiData(listStudents, "student");
	}, formStudent(vName, nName));

}


// neuer Schüler (Textimport vieler)
function massenAdd(el){
	var textblock = document.getElementById('item1Add').getElementsByTagName('textarea')[0];
	var trennZeile = (document.getElementById('trennZ').value == "1") ? "\n" : "\n\n";
	var trennNamen = document.getElementById('trennN');
	if (!trennNamen.value) {
		alert("Du hast vergessen ein Trennzeichen (ggf. mit Leerzeichen) anzugeben !");
		return false;
	}

	var zeilen = []; var namen = []; var vnn;
	zeilen = textblock.value.split(trennZeile);
	GLOBALS.dbToGo = 0;
	for (var zeile in zeilen){
		console.log(zeilen[zeile]);
		if (zeilen[zeile]) {
			vnn = zeilen[zeile].split(trennNamen.value);
			// Schüler-Objekt in Liste
			GLOBALS.dbToGo += 1;
			namen.push(formStudent(vnn[1].trim(),vnn[0].trim()));
		}
	}

	db_addDocument(function(){
		db_readMultiData(listStudents, "student");
		textblock.value = "";
		trennNamen.value = "";
		popUpClose(el);
	}, namen);

	return true;
}


// neue Leistung
function addLeistung(thisElement){
	// Get Vars aus Input
	var nBezeichnung = document.getElementById('notenBezeichnung');
	var nDatum = document.getElementById('notenDatum').value;
	var nEintragung = document.getElementById('notenEintragung');
	var nArt = document.getElementById('notenArt').value;
	var nGewicht = parseFloat(document.getElementById('rangeWert').value);
	
	// Leistung als Object erstellen
	var Leistung = formLeistung(nArt, nBezeichnung.value, nDatum, nEintragung.value, nGewicht);

	// In DB einfügen
	db_addDocument(function() {
		// Reset popUp
		if (!SETTINGS.fspzDiff || nArt != "fspz") {
			nBezeichnung.value = '';
		}
		setTimeout(function() {
			popUpClose(thisElement, true);
		}, 150);
	}, Leistung);
}


// Umschalten auf andere Importmethode
function switchImport(){
	var i, uls= document.getElementById('item1Add').getElementsByTagName('ul');
	for (i=0;i<uls.length;i++){
		uls[i].classList.toggle('hide');
	}
	document.getElementById('trennZ').classList.toggle('hide');
	document.getElementById('trennN').classList.toggle('hide');
	document.getElementById('saveI').classList.toggle('hide');
	document.getElementById('saveM').classList.toggle('hide');
	document.getElementById('switchM').classList.toggle('hide');
	document.getElementById('switchE').classList.toggle('hide');
}
