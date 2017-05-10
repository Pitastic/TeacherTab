$(document).ready(function() {
	// Funktionen, die auf global SETTINGS warten müssen
	readSettings(function(){
		// calc DB-Werte
//		calc_Durchschnitt();
		// List first View
		readData(listStudents);
		readData(listLeistung);
	});

	// Event-Listener
	addListener();
	closeListener();
	touchSlider()
	touchListener()
	// Hide Scrollbars
	setTimeout(function(){
		slide2(sessionStorage.getItem('lastview'));
		// Touch-Friendly-Buttons
		var target_el = document.getElementById('seitenleiste');
		noTouchThisSlider(target_el);
	},100);
	// Extras für Smartphone-Nutzer
	buttons = {
		"btn_Add" : "&#65291;",
		"btn_Settings" : "&#9881;",
		"btn_Back" : "<",
	}
	if (isPhone){change_buttons(buttons)}
});

// ===================================================== //
// ============ DEV Notizen ============================ //
// ===================================================== //
/*
> calc_Durchschnitt()
> calc_KatDS()
*/


// ===================================================== //
// ============ Listings =============================== //
// ===================================================== //

// Tabellenübersicht der Schüler erstellen
function listStudents(results, option) {
	var c, r, ul, old, row, omndl, ofspz, oschr, gesamt, len;
	old = document.getElementById("listStudents").getElementsByTagName('ul')[0];
	ul = document.createElement('ul');
	for (i in results){
		if (i==0) {continue;}
		row = results[i];
		omndl = row.gesamt.omndl;
		ofspz = row.gesamt.ofspz.gesamt;
		oschr = row.oschr;
		r = document.createElement('li');
		r.setAttribute('data-rowid', row.id);
			if (row.sort && row.sort !== "-" && row.sort !== "null"){
				c = document.createElement('div');
					c.className = "s_flag";
					c.innerHTML = row.sort;
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
		//calc_KatDs(row.id);
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

function listLeistung(results){
	results = results[0];
	var c, r, ul, idx, id_Leistung, dict_Leistungen, i;
	var old = document.getElementById("listLeistung").getElementsByTagName('ul');
	
	// Array fürs itterieren durch die Header
	var art = ['mndl', 'fspz', 'schr'];
	for (i=0; i<art.length; i++){
		ul = document.createElement('ul');
		dict_Leistungen = results.leistungen[art[i]];
		// Leeres Leistungsobjekt ?
		if (Object.keys(dict_Leistungen).length === 0 && dict_Leistungen.constructor === Object){
			r = document.createElement('li');
				c = document.createElement('div');
					c.className = "keine";
					c.innerHTML = "- keine -";
			r.appendChild(c);
			ul.appendChild(r);
		}else{
			for (id_Leistung in dict_Leistungen){
				r = document.createElement('li');
				r.setAttribute('data-l_column', art[i]);
				r.setAttribute('data-l_id', id_Leistung);
					c = document.createElement('div');
						c.className = "name";
						c.innerHTML = dict_Leistungen[id_Leistung].Bezeichnung;
					r.appendChild(c);
					c = document.createElement('div');
						c.innerHTML = dict_Leistungen[id_Leistung].Datum;
					r.appendChild(c);
					c = document.createElement('div');
						c.innerHTML = "&#160;";
						c.classList.add(dict_Leistungen[id_Leistung].Eintragung.toLowerCase());
					r.appendChild(c);
					c = document.createElement('div');
						c.innerHTML = dict_Leistungen[id_Leistung].Gewichtung + "x";
						c.className = "gewichtung";
					r.appendChild(c);
					c = document.createElement('div');
						c.className = "tools right";
						c.innerHTML = "&gt;";
					r.appendChild(c);
				ul.appendChild(r);
			}
		}
	old[i].parentNode.replaceChild(ul,old[i]);
	}
	// PopUp Datum
	document.getElementById('notenDatum').value = datum();
	// Eventlistener	
	var tr = document.getElementById('listLeistung').getElementsByTagName('li');
	for (var i=0; i<tr.length; i++){
		tr[i].addEventListener('click', function(){
			var id_Leistung = this.getAttribute('data-l_id');
			if (id_Leistung) {
				sessionStorage.setItem('leistung_id', this.getAttribute('data-l_id'));
				sessionStorage.setItem('leistung_art', this.getAttribute('data-l_column'));
				itemAbort(['item2'],'details_leistungen.htm');
			}else{
				alert("Keine Leistung vorhanden.\nKlick auf den Button 'Hinzufügen' um eine hinzuzufügen");
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
	
	neuerStudent([vName, nName], function(e){
		popUpClose(el);
		this.vName.value = '';
		this.nName.value = '';
		readData(listStudents);
	});

}


// neuer Schüler (Textimport vieler)
function massenAdd(el){
	var textblock = document.getElementById('item1Add').getElementsByTagName('textarea')[0];
	var trennZeile = (document.getElementById('trennZ').value == "1") ? "\n" : "\n\n";
	var trennNamen = document.getElementById('trennN').value;
	if (!trennNamen) {
		alert("Du hast vergessen ein Trennzeichen (ggf. mit Leerzeichen) anzugeben !");
		return false;
	}
	var i, zeilen = []; var namen = []; var vnn;
	zeilen = textblock.value.split(trennZeile);
	for (zeile in zeilen){
		vnn = zeilen[zeile].split(trennNamen);
		namen.push([vnn[0].trim(),vnn[1].trim()]);
	}


console.log(namen)
	neuerStudent(namen, function(){
		setTimeout(function() {
			popUpClose(el);
			readData(listStudents);
		}, 500);
		textblock.value = "";
	});

	return true;
}


// neue Leistung
function addLeistung(thisElement){
	// Zeitstempel
	var d = new Date().getTime();
	// Get Vars aus Input
	var nBezeichnung = document.getElementById('notenBezeichnung');
	var nDatum = document.getElementById('notenDatum').value;
	var nEintragung = document.getElementById('notenEintragung');
	var nArt = document.getElementById('notenArt').value;
	var nGewicht = parseFloat(document.getElementById('rangeWert').value);
	
	// Leistung als Object erstellen
	var Leistung = {
		'id':d,
		'Bezeichnung' : nBezeichnung.value,
		'Datum' : nDatum,
		'Eintragung' : nEintragung.value,
		'DS' : undefined,
		'Gewichtung' : nGewicht,
		'Verteilungen' : ['Standard',],
		'Standard' : {
			'Kat1' : 0,
			'Kat2' : 0,
			'Kat3' : 0,
			'Kat4' : 0,
			'Gesamt' : 0,},
		'Schreiber' : {
			'Bester' : undefined,
			'Schlechtester' : undefined,
			'nMitschr' : undefined,},
	};
	// Leistung in id=0 dict einfügen
	neueLeistung(function() {
		// Reset popUp
		nBezeichnung.value = '';
		setTimeout(function() {
			popUpClose(thisElement, true)
		}, 150);
	}, nArt, Leistung);
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
