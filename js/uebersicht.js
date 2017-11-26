$(document).ready(function() {
	// Funktionen, die auf global SETTINGS warten müssen
	db_readMultiData(function(r){
		SETTINGS = r[0];
		// List first View
		db_readMultiData(listStudents, "student");
		db_readMultiData(listLeistung, "leistung", function(){listLeistung([])});
	}, "settings");

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
// ============ Listings =============================== //
// ===================================================== //

// Tabellenübersicht aus Array aller Schüler erstellen
function listStudents(results) {
	var c, r, ul, old, row, omndl, ofspz, oschr, gesamt, len;
	old = document.getElementById("listStudents").getElementsByTagName('ul')[0];
	ul = document.createElement('ul');
	for (var i = 0; i < results.length; i++) {
		row = results[i];
		omndl = row.gesamt.omndl;
		ofspz = row.gesamt.ofspz.Gesamt;
		oschr = row.gesamt.oschr;
		r = document.createElement('li');
		r.setAttribute('data-rowid', row.id);
			if (row.name.sex && row.name.sex !== "-" && row.name.sex !== "null"){
				c = document.createElement('div');
					c.className = "s_flag";
					c.innerHTML = row.name.sex;
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
	var c, r, ul, idx, art, id_Leistung, Leistung, hasEntries;
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
					//r.setAttribute('data-l_column', art[idx]); // mit neuem Schema nicht mehr benötigt ?!
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
				sessionStorage.setItem('leistung_id', this.getAttribute('data-l_id'));
				//sessionStorage.setItem('leistung_art', this.getAttribute('data-l_column')); // mit neuem Schema nicht mehr benötigt ?!
				sessionStorage.setItem('leistung_art', this.getAttribute('data-l_subtyp'));
				itemAbort(['item2'],'details_leistungen.htm');
			}else{
				alert("Klick auf den Button 'Hinzufügen' um eine Leistung hinzuzufügen");
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
	var trennNamen = document.getElementById('trennN').value;
	if (!trennNamen) {
		alert("Du hast vergessen ein Trennzeichen (ggf. mit Leerzeichen) anzugeben !");
		return false;
	}
	var i, zeilen = []; var namen = []; var vnn;
	zeilen = textblock.value.split(trennZeile);
	for (zeile in zeilen){
		vnn = zeilen[zeile].split(trennNamen);
		// Schüler-Objekt in Liste
		namen.push(formStudent(vnn[0].trim(),vnn[1].trim()));
	}

	db_addDocument(function(){
		setTimeout(function() {
			popUpClose(el);
			db_readMultiData(listStudents, "student");
		}, 500);
		textblock.value = "";
	}, namen);

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
	var Leistung = formLeistung(nArt, nBezeichnung.value, nDatum, nEintragung.value, nGewicht);

	// In DB einfügen
	db_addDocument(function() {
		// Reset popUp
		if (!SETTINGS.fspzDiff || nArt != "fspz") {
			nBezeichnung.value = '';
		}
		setTimeout(function() {
			popUpClose(thisElement, true)
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
