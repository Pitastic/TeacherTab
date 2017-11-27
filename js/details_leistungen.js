$(document).ready(function() {
	// Event-Listener
	closeListener();
	touchListener(['header', 'footer', 'fadeBlack', 'KeyBar'])

	var pop = document.getElementById('item2Set');

	// -- Leistung editieren (Metadaten)
	pop.getElementsByClassName('button OK')[0].addEventListener('click', function(){
		var id_Leistung = sessionStorage.getItem('leistung_id');
		var art = sessionStorage.getItem('leistung_art');
		var eintragung = sessionStorage.getItem('Eintragung');
		var neueLeistung = formLeistung(
			art, leistungEdit.notenBezeichnung.value,
			leistungEdit.notenDatum.value,
			eintragung,
			leistungEdit.rangeWert.value
			);
		neueLeistung.id = parseInt(sessionStorage.getItem('leistung_id'));

		// Datensatz ersetzen
		db_replaceData(function(){
			pop.classList.remove('showPop');
			setTimeout(function() {
				window.location.reload();
			}, 500);
		}, neueLeistung);
	});

	// -- Leistung löschen
	pop.getElementsByClassName('button ABORT')[0].addEventListener('click', function(){
		var id_Leistung = sessionStorage.getItem('leistung_id');
		var art_Leistung = sessionStorage.getItem('leistung_art');
		if (window.confirm('Bist du sicher, dass du diese Leistung und alle eingetragenen Daten dazu unwiderruflich löschen möchtest ?')){
			deleteLeistung(function(){
				setTimeout(function() {
					window.location = "uebersicht.htm";
				}, 600);
			}, art_Leistung, id_Leistung);
		}
	});

	// List first View
	var art = sessionStorage.getItem('leistung_art');
	var id_Leistung = parseInt(sessionStorage.getItem('leistung_id'));

	// Funktionen, die auf global SETTINGS warten müssen
	db_readMultiData(function(r){
		// Settings laden
		SETTINGS = r[0];
		//leistungsDetails(art, id_Leistung); // alter Aufruf
		db_readSingleData(leistungsDetails, "leistung", id_Leistung);
	}, "settings");
});


// Listings
// =============================================================================
// >>>>>>>> Routing - Art der Eintragung filtern
//function leistungsDetails(art, id_Leistung){
function leistungsDetails(Leistung){
	// - - - Kopfdaten - - -
	//var katObj = results.kompetenzen;
	//var katObj = SETTINGS.kompetenzen;
	//var Leistung = results.leistungen[art][id_Leistung]; // jetzt direkt übergeben
	sessionStorage.setItem('leistung_gewicht', Leistung.Gewichtung || 1);
	sessionStorage.setItem('Eintragung', Leistung.Eintragung);
	
	// - Edit Pop
	var editLeistung = document.getElementById("leistungEdit");
	editLeistung.notenBezeichnung.value = Leistung.Bezeichnung;
	editLeistung.notenDatum.value = Leistung.Datum;
	editLeistung.notenArt.value = Leistung.subtyp;
	editLeistung.rangeSlide.value = parseFloat(Leistung.Gewichtung) < 1 ? 0 : parseFloat(Leistung.Gewichtung);
	editLeistung.rangeWert.value = parseFloat(Leistung.Gewichtung) || 1;
	fspz_Bezeichnung();
	// - Laden der eigentlichen Leistung
	switch (Leistung.Eintragung) {
		case "Rohpunkte":
			// -- Verteilungen
			var wertArray;
			for (var v in Leistung.Verteilungen) {
				wertArray = [];
				wertArray.push(Leistung.Verteilungen[v].Kat1);
				wertArray.push(Leistung.Verteilungen[v].Kat2);
				wertArray.push(Leistung.Verteilungen[v].Kat3);
				wertArray.push(Leistung.Verteilungen[v].Kat4);
				verteilungToSession(v, wertArray, false)
			}
			db_readMultiData(function(results){
				leistungsDetails_rohpunkte(Leistung,results);
			}, "student");
			break;
		case "Noten":
			db_readMultiData(function(results){
				leistungsDetails_noten(Leistung, results);
			}, "student");
			break;
		case "Punkte":
			db_readMultiData(function(results){
				leistungsDetails_punkte(Leistung, results);
			}, "student");
			break;
	}
	return true
}

// =============================================================================
// >>>>>>>> nach ganzen Noten
function leistungsDetails_noten(Leistung, Students){
	var target_el = document.getElementById("item2details");
		// Leistungsart sichern
		target_el.setAttribute('data-l_art', Leistung.subtyp);
		target_el.setAttribute('data-l_id', Leistung.id);
	var old = document.getElementById("arbeit_info");
	var new_el = old.cloneNode(true);
		new_el.innerHTML = "";
	var keyboard = document.getElementById('NotenListe_Arbeit');
	new_el.appendChild(keyboard.parentNode.removeChild(keyboard));
	keyboard.classList.add('show');
	var selKeys = keyboard.getElementsByTagName('select')[0];
	new_el.appendChild(document.createElement('hr'));
	// Statistiken
	var statBtn = document.createElement('a');
		statBtn.innerHTML = "Statistik";
		statBtn.className = "button HELP";
		statBtn.onclick = function(){calc_Stats(false)};
	var divSchnitt = document.createElement('div');
		divSchnitt.className = "bottom";
	var diag_Mit = document.createElement('div');
		diag_Mit.id = "diag_Mitschreiber";
	divSchnitt.appendChild(diag_Mit);
	divSchnitt.appendChild(statBtn);
	new_el.appendChild(divSchnitt);
	// - - - Kopfdaten - - -
	// -- Allgemeine Infos
	document.getElementById('header').getElementsByTagName('h1')[0].innerHTML = Leistung.Bezeichnung+' vom '+Leistung.Datum;
	old.parentNode.replaceChild(new_el, old);
	var infoEl = new_el;
	// Save-Button
	document.getElementById('Save').onclick = function(){
		item2Save(false, Leistung.Bezeichnung);
	};

	// - - - Schülerdaten - - -
	var i, row, li, div, span, gruppe, eigeneLeistung;
	var old = document.getElementById("arbeit_leistung");
	var new_el = old.cloneNode(true);
		new_el.innerHTML = "";
	var ul = document.createElement('ul');
	for (var r in Students){
		row = Students[r];
		eigeneLeistung = row[Leistung.subtyp][Leistung.id];
		// Leistung bei Schüler vorhanden ?
		if (!eigeneLeistung || eigeneLeistung.Mitschreiber == "false" || !eigeneLeistung.Mitschreiber == "undefined" || !eigeneLeistung.Mitschreiber){
			eigeneLeistung = {'Mitschreiber':'false', 'Note':'-', 'Kat1':'-', 'Kat2':'-', 'Kat3':'-', 'Kat4':'-',};
		}
		li = document.createElement('li');
			li.setAttribute('data-rowid', "line"+row.id);
			li.setAttribute('data-mitschreiber', eigeneLeistung.Mitschreiber);
		// Name
		gruppe = row.name.sex && row.name.sex !== "-" && row.name.sex !== "null" ? " ("+row.name.sex+")" : "";
		div = document.createElement('div');
			div.className = "Name";
		span = document.createElement('span');
			span.innerHTML = row.name.vname;
			div.appendChild(span);
		span = document.createElement('span');
			span.innerHTML = row.name.nname+gruppe;
			div.appendChild(span);
		li.appendChild(div);
		// Note ---- nicht dynamisch
		div = document.createElement('div');
			div.className = "Note standalone";
		span = document.createElement('span');
			span.innerHTML = eigeneLeistung.Note || "-";
			div.appendChild(span);
		// Anfügen
		li.appendChild(div);
		ul.appendChild(li);

		// Eventlistener für dieses li
		var old_select;
		li.addEventListener('click', function() {
			// Zeile hervorheben und für Keyboard markieren
			old_select = ul.getElementsByClassName('selected')[0];
			if (old_select){old_select.classList.remove('selected');}
			this.classList.add('selected');
			selKeys.value = this.getElementsByClassName('Note')[0].getElementsByTagName('span')[0].innerHTML;
		});
	}

	new_el.appendChild(ul);
	old.parentNode.replaceChild(new_el, old);

	// Anzeigen wenn ready
	var DOMcheck = setInterval( function () {
		if (document.readyState !== 'complete' ) return;
		clearInterval( DOMcheck );
		// DOM Ready !
		infoEl.classList.add('show');
		target_el.classList.add('show');
		setTimeout(function(){
			calc_Stats(true);
		},1000);
	}, 100 );

}


// =============================================================================
// >>>>>>>> nach einfachen Punkten
function leistungsDetails_punkte(Leistung, Students){
	var target_el = document.getElementById("item2details");
		// Leistungsart sichern
		target_el.setAttribute('data-l_art', Leistung.subtyp);
		target_el.setAttribute('data-l_id', Leistung.id);
	var maxPts = Leistung.Verteilungen.Standard.Gesamt;
	var old = document.getElementById("arbeit_info");
	var new_el = old.cloneNode(true);
		new_el.innerHTML = "";
	var keyboard = document.getElementById('NotenListe_Arbeit');
	new_el.appendChild(keyboard.parentNode.removeChild(keyboard));
	keyboard.classList.add('show');
	var keyboardMax = document.createElement('div');
		var numfield_ul = document.createElement('ul');
		var numfield_li = document.createElement('li');
			numfield_li.className = "inputs saved";
		var numfield = document.createElement('input');
			numfield.setAttribute('type','number');
			numfield.id = 'keyMax';
			numfield.value = maxPts;
			numfield.addEventListener('change', function(){
				this.parentNode.className = "inputs changed";
			});
			sessionStorage.setItem('Standard_Gesamt', maxPts);
			numfield_li.appendChild(numfield);
			numfield_ul.appendChild(numfield_li);
		keyboardMax.appendChild(numfield_ul);
		var btn_numfield = document.createElement('a');
			btn_numfield.className = "button OK";
			btn_numfield.innerHTML = "100 %";
			btn_numfield.onclick = function(){
				updateVerteilung([numfield], "Standard", function(r){
					editNotenListe(numfield.value, true);
					numfield_li.className = "inputs saved"
				})
			};
		keyboardMax.appendChild(btn_numfield);
	keyboard.appendChild(keyboardMax);
	var selKeys = keyboard.getElementsByTagName('select')[0];
		selKeys.innerHTML = "-";
		new_el.appendChild(document.createElement('hr'));
	// Statistiken
	var statBtn = document.createElement('a');
		statBtn.innerHTML = "Statistik";
		statBtn.className = "button HELP";
		statBtn.onclick = function(){calc_Stats(false)};
	var divSchnitt = document.createElement('div');
		divSchnitt.className = "bottom";
	var diag_Mit = document.createElement('div');
		diag_Mit.id = "diag_Mitschreiber";
	divSchnitt.appendChild(diag_Mit);
	divSchnitt.appendChild(statBtn);
	new_el.appendChild(divSchnitt);
	// - - - Kopfdaten - - -
	// -- Allgemeine Infos
	document.getElementById('header').getElementsByTagName('h1')[0].innerHTML = Leistung.Bezeichnung+' vom '+Leistung.Datum;
	old.parentNode.replaceChild(new_el, old);
	var infoEl = new_el;
	// Save-Button
	document.getElementById('Save').onclick = function(){
		item2Save(false, Leistung.Bezeichnung);
	};

	// - - - Schülerdaten - - -
	var i, row, li, div, span, gruppe, eigeneLeistung;
	var id_Leistung = sessionStorage.getItem('leistung_id');
	var old = document.getElementById("arbeit_leistung");
	var new_el = old.cloneNode(true);
		new_el.innerHTML = "";
	var ul = document.createElement('ul');
	for (var r in Students){
		row = Students[r];
		eigeneLeistung = row[Leistung.subtyp][Leistung.id];
		// Leistung bei Schüler vorhanden ?
		if (!eigeneLeistung || eigeneLeistung.Mitschreiber == "false" || !eigeneLeistung.Mitschreiber == "undefined" || !eigeneLeistung.Mitschreiber){
			eigeneLeistung = {'Mitschreiber':'false', 'Note':'-', 'Kat1':'-', 'Kat2':'-', 'Kat3':'-', 'Kat4':'-', 'Gesamt': '-'};
		}
		li = document.createElement('li');
			li.setAttribute('data-rowid', "line"+row.id);
			li.setAttribute('data-mitschreiber', eigeneLeistung.Mitschreiber);
			// Name
			gruppe = row.name.sex && row.name.sex !== "-" && row.name.sex !== "null" ? " ("+row.name.sex+")" : "";
			div = document.createElement('div');
				div.className = "Name";
			span = document.createElement('span');
				span.innerHTML = row.name.vname;
				div.appendChild(span);
			span = document.createElement('span');
				span.innerHTML = row.name.nname+gruppe;
				div.appendChild(span);
			li.appendChild(div);
			// Gesamtpunkte
			div = document.createElement('div');
				div.className = "Gesamtpunkte";
			span = document.createElement('span');
				span.innerHTML = eigeneLeistung.Gesamt;
				div.appendChild(span);
			span = document.createElement('span');
				span.innerHTML = "Punkte";
				div.appendChild(span);
			li.appendChild(div);
		   // Note ---- nicht dynamisch
			div = document.createElement('div');
				div.className = "Note standalone";
			span = document.createElement('span');
				span.innerHTML = eigeneLeistung.Note;
				div.appendChild(span);
			li.appendChild(div);
		ul.appendChild(li);
		// Eventlistener für dieses li
		var old_select;
		li.addEventListener('click', function() {
			// Zeile hervorheben und für Keyboard markieren
			old_select = ul.getElementsByClassName('selected')[0];
			if (old_select){old_select.classList.remove('selected');}
			this.classList.add('selected');
			selKeys.value = this.getElementsByClassName('Gesamtpunkte')[0].getElementsByTagName('span')[0].innerHTML;
		});
	}
	new_el.appendChild(ul);
	old.parentNode.replaceChild(new_el, old);

	// Anzeigen wenn ready
	var DOMcheck = setInterval( function () {
		if (document.readyState !== 'complete' ) return;
		clearInterval( DOMcheck );
		// DOM Ready !
		infoEl.classList.add('show');
		target_el.classList.add('show');
		setTimeout(function(){
			calc_Stats(true);
			editNotenListe(maxPts);
		},1000);
	}, 100 );

}

// =============================================================================
// >>>>>>>> nach Rohpunkten
function leistungsDetails_rohpunkte(Leistung, Students){
	var target_el = document.getElementById("item2details");
		// Leistungscolumn sichern
		target_el.setAttribute('data-l_art', Leistung.subtyp);
		target_el.setAttribute('data-l_id', Leistung.id);
	var old = document.getElementById("arbeit_info");
	var new_el = old.cloneNode(true);
		new_el.innerHTML = "";
	var Verteilungen = Leistung.Verteilungen.Standard.Gesamt;
	// - - - - Algemeine Daten - - - -
	// Überschrift
	document.getElementById('header').getElementsByTagName('h1')[0].innerHTML = Leistung.Bezeichnung+' vom '+Leistung.Datum;
	// Save-Button
	document.getElementById('Save').onclick = function(){
		item2Save(true, Leistung.Bezeichnung);
	};
	// Punkteverteilung (Schablone)
	var divVerteilung = document.createElement('div');
	var label = document.createElement('label');
	var selectVerteilung = document.createElement('select');
		divVerteilung.id = "item2_info_Verteilung";
		divVerteilung.innerHTML = "<p>Punkteverteilung</p>";
		label.appendChild(selectVerteilung);
		divVerteilung.appendChild(label);
	var i;
	for (i=1;i<5;i++){
		var kat_div = document.createElement('div');
			kat_div.innerHTML = SETTINGS.kompetenzen["Kat"+i]+" : ";
		var kat = document.createElement('span');
			kat.id = "item2_info_Kat"+i;
			kat_div.appendChild(kat);
		divVerteilung.appendChild(kat_div);
		var schiene = document.createElement('div');
			schiene.className = "schiene";
			var wert = document.createElement('span');
			schiene.appendChild(wert);
			var balken = document.createElement('div');
			balken.className = "balken";
			balken.id = 'item2_info_balken'+i;
			schiene.appendChild(balken);
		divVerteilung.appendChild(schiene);
	}
	var gesamtDiv = document.createElement('div');
			gesamtDiv.id = "item2_info_gesamt";
			gesamtDiv.innerHTML = "Gesamt : ";
	divVerteilung.appendChild(gesamtDiv);
	// Verteilung ändern
	var popVert = document.getElementById('item2Verteilung');
	var inputs = popVert.querySelectorAll("[data-kat='kat']");
	for (i=0; i<inputs.length;i++){
		var kat_Text = document.createElement('span')
		kat_Text.innerHTML = SETTINGS.kompetenzen["Kat"+(i+1)]+" : ";
		inputs[i].parentNode.insertBefore(kat_Text, inputs[i]);
	}
	var editButtonA = document.createElement('a');
	editButtonA.className = "button OK stay";
	editButtonA.href = "#";
	editButtonA.innerHTML = "ändern";
	editButtonA.addEventListener('click', function(){
		// Verteilungs-Edit PopUp
		for (i=0; i<inputs.length;i++){
			inputs[i].value = sessionStorage.getItem(cloneInfo.value+"_Kat"+(i+1));
			popUp("item2Verteilung");
		}
	});
	divVerteilung.appendChild(editButtonA);
	new_el.appendChild(divVerteilung);
	new_el.appendChild(document.createElement('hr'));
	// Statistiken
	var statBtn = document.createElement('a');
		statBtn.innerHTML = "Statistik";
		statBtn.className = "button HELP";
		statBtn.onclick = function(){calc_Stats(false)};
	var divSchnitt = document.createElement('div');
		divSchnitt.className = "bottom";
	var diag_Mit = document.createElement('div');
		diag_Mit.id = "diag_Mitschreiber";
	divSchnitt.appendChild(diag_Mit);
	divSchnitt.appendChild(statBtn);
	new_el.appendChild(divSchnitt);
	// > Block einfügen
	var infoEl = new_el;
	old.parentNode.replaceChild(new_el, old);
	// - - - - - - - - - - - - - - - -

	// Edit-PopUp
	var pop = document.getElementById('item2Edit');
	var oldPop_select = pop.getElementsByTagName('select')[0];
	var oldInfo_select = document.getElementById('item2_info_Verteilung').getElementsByTagName('select')[0];
	var clonePop = oldPop_select.cloneNode(true);
	clonePop.innerHTML = "";
	var opt;
	for (v in Leistung.Verteilungen){
		opt = new Option(v);
		clonePop.appendChild(opt);
	}
	var cloneInfo = clonePop.cloneNode(true);
	var cloneVert = clonePop.cloneNode(true);
	var popVertSel = popVert.getElementsByTagName('select')[0];
	popVertSel.parentNode.replaceChild(cloneVert, popVertSel);
	// Edit-PopUp -- Eventlistener
	cloneInfo.onchange = function(){
		updateVerteilungHTML(cloneInfo.value);
		cloneVert.value = cloneInfo.value;
	};
	cloneVert.onchange = function(){
		for (i=0; i<inputs.length;i++){
			inputs[i].value = sessionStorage.getItem(cloneVert.value+"_Kat"+(i+1));
		}
	};
	// > Block einfügen
	oldPop_select.parentNode.replaceChild(clonePop, oldPop_select);
	oldInfo_select.parentNode.replaceChild(cloneInfo, oldInfo_select);
	// - - - - - - - - - - - - - - - -
	
	// Verteilungen -- anzeigen und ändern
	var popVertOK = popVert.getElementsByClassName("button")[1];
	var popVertNeu = popVert.getElementsByClassName("button")[0];
	popVertOK.onclick = function(){
		var Pkt_Verteilung = cloneVert.value;
		updateVerteilung(inputs, Pkt_Verteilung, function(){
			var All = document.getElementById('arbeit_leistung');
			updateVerteilungHTML();
			updateNoten(All, false);
		});
		popUpClose(this,0);
	};
	popVertNeu.onclick = function(){
		var Pkt_Verteilung = document.getElementById('Pkt_new');
		updateVerteilung(inputs, Pkt_Verteilung.value, function(r){item2Save(true, Leistung.Bezeichnung, true);});
		popUpClose(this,0);
	};
   
	// - - - Schülerdaten - - -
		var i, i2, row, li, div, span, gruppe, eigeneLeistung, i2Kat;
		var l_id = sessionStorage.getItem('leistung_id');
		var old = document.getElementById("arbeit_leistung");
		var new_el = old.cloneNode(true);
			new_el.innerHTML = "";
		var ul = document.createElement('ul');
		for (var r in Students){
			row = Students[r];
			eigeneLeistung = row[Leistung.subtyp][Leistung.id];
			if (!eigeneLeistung || eigeneLeistung.Mitschreiber == "false" || eigeneLeistung.Mitschreiber == "undefined"){
				eigeneLeistung = {'Mitschreiber':'false', 'Note':'-', 'Kat1':'-' , 'Kat2':'-' , 'Kat3':'-' , 'Kat4':'-' , 'Gesamt':'-', 'Verteilung':"Standard"};
			}
			li = document.createElement('li');
				li.setAttribute('data-rowid', "line"+row.id);
				li.setAttribute('data-verteilung', eigeneLeistung.Verteilung);
				li.setAttribute('data-mitschreiber', eigeneLeistung.Mitschreiber);
			// Name
			gruppe = row.name.sex && row.name.sex !== "-" && row.name.sex !== "null" ? " ("+row.name.sex+")" : "";
			li.setAttribute('data-studentname', row.name.vname+" "+row.name.nname);
			div = document.createElement('div');
				div.className = "Name";
			span = document.createElement('span');
				span.innerHTML = row.name.vname;
				div.appendChild(span);
			span = document.createElement('span');
				span.innerHTML = row.name.nname+gruppe;
				div.appendChild(span);
			li.appendChild(div);
			// Kategorien
			li.setAttribute('data-verteilung', eigeneLeistung.Verteilung);
			for (i2 of ["Kat1", "Kat2", "Kat3", "Kat4", "Gesamt"]){
				div = document.createElement('div');
				div.className = "Kategorien";
				span = document.createElement('span');
				span.innerHTML = eigeneLeistung[i2];
				span.setAttribute('data-name', i2);
				div.appendChild(span);
				span = document.createElement('span');
				span.innerHTML = SETTINGS.kompetenzen[i2];
				div.appendChild(span);
				li.appendChild(div);
			}
		   // Note ---- Dynamisch errechnen anhand der Leistung, weil 100% variabel sind
			div = document.createElement('div');
				div.className = "Note";
			span = document.createElement('span');
				span.innerHTML = "-";// leistung.Note;
				div.appendChild(span);
			span = document.createElement('span');
				span.innerHTML = "%";
				div.appendChild(span);
			li.appendChild(div);
		ul.appendChild(li);
		// Eventlistener für dieses li
		li.addEventListener('click', function() {
			// Input Felder mit alten Werten füllen
			for (i2 = 0; i2 < popEdit.length; i2++) {
				popEdit[i2].value = parseFloat(this.querySelector("[data-name=Kat"+(i2+1)+"]").innerHTML, 0) || "";
			}
			// Pop anpassen
			pop.getElementsByTagName('h3')[0].innerHTML = this.getAttribute('data-studentname');
			var vert = this.getAttribute('data-verteilung');
			pop.getElementsByTagName('select')[0].value = vert;
			// li-ID hinterlegen, die gerade geklickt wurde
			pop.setAttribute('data-rowid', this.getAttribute('data-rowid'));
			document.getElementById('mitschreiberTrue').checked = true;
			popUp(pop.id);
		});
		}
		// > Block einfügen
		new_el.appendChild(ul);
		old.parentNode.replaceChild(new_el, old);
		// - - - - - - - - - - - - - - - -
		var popEdit = pop.getElementsByTagName('ul')[0].getElementsByTagName('input');
		for (i2 = 0; i2 < popEdit.length; i2++) {
			var kat_Text = document.createElement('span')
			kat_Text.innerHTML = SETTINGS.kompetenzen["Kat"+(i2+1)]+" : ";
			popEdit[i2].parentNode.insertBefore(kat_Text, popEdit[i2]);
		}

		// Anzeigen wenn ready
		var DOMcheck = setInterval( function () {
			if (document.readyState !== 'complete' ) return;
			clearInterval( DOMcheck );
			// DOM Ready !
			infoEl.classList.add('show');
			target_el.classList.add('show');
			setTimeout(function(){
				// Schülerleistung berechnen
				var alleSchuler = document.getElementById('arbeit_leistung');
				updateNoten(alleSchuler, false);
				updateVerteilungHTML();
				calc_Stats(true);
			},1000);
		}, 100 );

}


// Sonstiges
// =============================================================================
function editNotenListe(maxPts){
//--> Ersetzt die Notenliste mit möglichen Punktzahlen in 0,5 Schritten
	var opt, Liste = document.getElementById('NotenListe_Arbeit').getElementsByTagName('select')[0];
	Liste.innerHTML = "";
	Liste.setAttribute('onchange', "");
	Liste.addEventListener('change', function(){NotenListe(true);});
	maxPts = parseFloat(maxPts);
	opt = new Option("-");
	Liste.appendChild(opt);
	for (var i=0;i<=maxPts;i+=0.5){
		opt = new Option(i);
		Liste.appendChild(opt);
	}
	return true;
}

function verteilungToSession(Pkt_Verteilung, wertArray, bol_single) {
	// Save
	if (bol_single){
		sessionStorage.setItem('Standard_Gesamt', wertArray);
	}else{
		for (var i = 0; i < wertArray.length; i++) {
			sessionStorage.setItem(Pkt_Verteilung+'_Kat'+(i+1), wertArray[i]);
		}
		sessionStorage.setItem(Pkt_Verteilung+'_Gesamt', sum(wertArray));
	}
}

function updateVerteilung(inputs, Pkt_Verteilung, callback){
//--> Verteilungen ändern, in DB, (laden der Verteilung als callback) ?
	var i, maxPts, wertArray = [];
	var l_id = parseInt(sessionStorage.getItem('leistung_id'));
	var newObject = {};
	if (inputs.length>1) {
		// Kategorien
		for (i=0; i<inputs.length;i++){
			wertArray[i] = parseFloat(inputs[i].value);
		}
		maxPts = sum(wertArray);
	}else{
		// MaxPts
		wertArray = [0, 0, 0, 0]
		maxPts = inputs[0].value;
	}
	// DB - Object
	newObject[l_id] = {'Verteilungen':{},};
	newObject[l_id]['Verteilungen'][Pkt_Verteilung] = {
		'Kat1': wertArray[0],
		'Kat2': wertArray[1],
		'Kat3': wertArray[2],
		'Kat4': wertArray[3],
		'Gesamt': maxPts,
	}
	newObject[l_id].changed = timestamp();
	
	// in DB speichern
	db_updateData(function(result){

		// Save in SessionStoreage
		if (inputs.length==1) {
			verteilungToSession(Pkt_Verteilung, maxPts, true);
		}else{
			verteilungToSession(Pkt_Verteilung, wertArray, false);
		}

		if (callback != null) {callback(result);}
	
	}, newObject);
}

function updateVerteilungHTML(){
//--> Update der Anzeige anhand von SessionStorage-Daten
	var i;
	var werteBox = document.getElementById('item2_info_Verteilung');
	var Pkt_Verteilung = werteBox.getElementsByTagName("select")[0].value;
	// Balken Grafik ---
	var balken = werteBox.getElementsByClassName('balken');
	var gesamtWert = sessionStorage.getItem(Pkt_Verteilung+'_Gesamt') || 0;
	for ( i=0 ; i<balken.length; i++){
		var katWert = sessionStorage.getItem(Pkt_Verteilung+'_Kat'+(i+1)) || "?";
		var schiene_span = balken[i].parentNode.getElementsByTagName('span')[0];
		var kat_span = document.getElementById('item2_info_Kat'+(i+1));
			kat_span.innerHTML = katWert;
		if (katWert != "?") {
			balken[i].style.width = ((katWert/gesamtWert)*100).toFixed(0) +"%";
			schiene_span.innerHTML = ((katWert/gesamtWert)*100).toFixed(1) +" %";
		}
	}
	var gesamt_div = document.getElementById('item2_info_gesamt');
		gesamt_div.innerHTML = "Gesamt : "+gesamtWert;
}

function NotenListe(bol_alternativ){
//--> Ändert die ausgewählte Zeile onChange mit dem Select Menü
	var selKeys = document.getElementById('NotenListe_Arbeit').getElementsByTagName('select')[0];
	var eintragung = selKeys.value;
	var li = document.getElementById('arbeit_leistung').getElementsByClassName('selected')[0];
	if(li){
		if (!bol_alternativ){
			var target = li.getElementsByClassName('Note standalone')[0].getElementsByTagName('span')[0];
		}else{
			var target = li.getElementsByClassName('Gesamtpunkte')[0].getElementsByTagName('span')[0];
			updateNoten(li, true);
		}
		if (eintragung == "-"){
			target.innerHTML = "-";
			li.setAttribute('data-mitschreiber', false);
		}else{
			target.innerHTML = eintragung;
			li.setAttribute('data-mitschreiber', true);
		}
	}
	calc_Stats(true);
}

function editLeistungsDetails(thisElement, uebersicht){
//--> Leistungen der Schüler ändern (bei Rohpunkten)
	// Objekt mit neuer Leistung erstellen
	var i, pkt, punkteObj = {};
	var gesamt = 0;
	var pop = thisElement.parentNode.parentNode;
	var inputs = pop.getElementsByTagName('ul')[0].getElementsByTagName('input');
	var selectBox = pop.getElementsByTagName('select')[0];
	for (i=0; i<inputs.length; i++){
		pkt = (parseFloat(inputs[i].value)) ? parseFloat(inputs[i].value) : 0 ;
		punkteObj[inputs[i].getAttribute('data-kat')] = pkt;
		gesamt += pkt;
	}
	punkteObj.Gesamt = gesamt;
	// Neu zeichnen nur der einen Zeile !
	var line = document.getElementById('item2details').querySelector("[data-rowid="+pop.getAttribute('data-rowid')+"]");
	for (i in punkteObj){
		line.querySelector('[data-name="'+i+'"]').innerHTML = punkteObj[i];
	}
	line.setAttribute('data-verteilung', selectBox.value);
	line.setAttribute('data-mitschreiber', document.getElementById('mitschreiberTrue').checked);
	// - Note neu berechenen und eintragen
	popUpClose(thisElement, false);
	updateNoten(line, true);
	calc_Stats(true);

	// --
	// Hier eventuell gleich in die DB speichern ?
	// --
}

// >>>>>>>> Speichern und Verlassen
function item2Save(bol_kat, Bezeichnung, bol_refresh){
//--> Leistungen der Schüler speichern
	var i;
	var art = sessionStorage.getItem('leistung_art');
	var id_Leistung = parseInt(sessionStorage.getItem('leistung_id'));
	var liAll = document.getElementById('arbeit_leistung').getElementsByTagName('li');
	var liID, row, liKat, i2, keyVal, note, newObs = {};
	for (i=0;i<liAll.length;i++){
		// Schüler ID
		row = liAll[i];
		liID = row.getAttribute('data-rowid');
		liID = liID.substring(4, liID.length);
		// neues Objekt aufbauen
		newObs[liID] = {};
		newObs[liID][art] = {};
		newObs[liID][art][id_Leistung] = {}; // lange Kette wegen JS ObjectHandling notwendig
		note = row.getElementsByClassName('Note')[0].getElementsByTagName('span');
		newObs[liID][art][id_Leistung].Mitschreiber = row.getAttribute('data-mitschreiber');
		newObs[liID][art][id_Leistung].Gewichtung = parseFloat(sessionStorage.getItem('leistung_gewicht'));
		newObs[liID][art][id_Leistung].changed = timestamp();
		if (newObs[liID][art][id_Leistung].Mitschreiber == "true"){
			newObs[liID][art][id_Leistung].Note = note[0].innerHTML;
			newObs[liID][art][id_Leistung].Bezeichnung = Bezeichnung;
			if (bol_kat){
				newObs[liID][art][id_Leistung].Prozent = note[1].innerHTML;
				newObs[liID][art][id_Leistung].Verteilung = row.getAttribute('data-verteilung');
				liKat = row.getElementsByClassName('Kategorien');
				for (i2=0;i2<liKat.length;i2++){
					keyVal = liKat[i2].getElementsByTagName('span')[0];
					newObs[liID][art][id_Leistung][keyVal.getAttribute('data-name')] = parseFloat(keyVal.innerHTML);
				}
			}else if (row.getElementsByClassName('Gesamtpunkte')[0]){ // if GESAMT Punktzahl is present
				note = row.getElementsByClassName('Note standalone')[0].getElementsByTagName('span');
				newObs[liID][art][id_Leistung].Note = note[0].innerHTML;
				keyVal = row.getElementsByClassName('Gesamtpunkte')[0].getElementsByTagName('span')[0];
				newObs[liID][art][id_Leistung].Gesamt = parseFloat(keyVal.innerHTML);
			}    
		}
	}

	// Objecte in Schüler Dicts einfügen
	db_updateData(function(){
		handleSchnitt(function(){

			// Animationen
			document.getElementById('item2details').classList.remove('show');
			document.getElementById('arbeit_info').classList.add('hide');
			if (bol_refresh){
				setTimeout(function() {
					window.location.reload();
				}, 500);
			}else{
				setTimeout(function() {
					if (sessionStorage.getItem('jump_id')) {
						sessionStorage.removeItem('jump_id');
						window.location = "details_students.htm";
					}else{
						window.location = "uebersicht.htm";
					}
				}, 500);
			}
		})

	}, newObs);
}

function item2Abort() {
	document.getElementById('item2details').classList.remove('show');
	document.getElementById('arbeit_info').classList.add('hide');
	setTimeout(function(){
		if (sessionStorage.getItem('jump_id')) {
			sessionStorage.removeItem('jump_id');
			window.location = "details_students.htm";
		}else{
			window.location = "uebersicht.htm";
		}    
	},600);
}

function calc_Stats(bol_Mitschreiber){
	if (bol_Mitschreiber) {
		// nur Mitschreiber
		var i_students = document.getElementById('arbeit_leistung').getElementsByTagName('li').length;
		var i_mitschreiber = document.querySelectorAll("[data-mitschreiber='true']").length;
		document.getElementById('diag_Mitschreiber').innerHTML = i_mitschreiber+" / "+i_students;
		$.plot("#diag_Mitschreiber", [
			// data
			{data: i_mitschreiber, color: 'darkslategrey'},
			{data: i_students-i_mitschreiber, color: 'grey'},
		],
		{
			// options
			series: {
				pie:{
					show:true,
					offset:{
						left:0,
						top: 0,
					},
					label:{show:false,},
				},
			},
			legend:{show:false,}
		});
		return true;
	}else{
		var i, temp;
		var isRohpkt = sessionStorage.getItem('Eintragung')=="Rohpunkte";
		if (isRohpkt || sessionStorage.getItem('Eintragung')=="Punkte"){
			var Verteilung = (isRohpkt) ? document.getElementById('item2_info_Verteilung').getElementsByTagName('select')[0].value : "Standard";
			// Umrechnung Punkte in Noten
			var pkt_Gesamt = sessionStorage.getItem(Verteilung+"_Gesamt");
			var old_ProzVert = document.getElementById('diag_ProzentVerteilung');
			var i_ProzVert = old_ProzVert.cloneNode(true);
				i_ProzVert.innerHTML = "";
			var table = document.createElement('table');
			var thead = document.createElement('thead');
			var tr1 = document.createElement('tr');
			var tr2 = document.createElement('tr');
			var tr3 = document.createElement('tr');
			var td;
			for (i in SETTINGS.notenverteilung){
				temp = Math.round(((SETTINGS.notenverteilung[i]/100)*pkt_Gesamt)*10)/10;
				td = document.createElement('td');
					td.innerHTML = i;
				tr1.appendChild(td);
				td = document.createElement('td');
					td.innerHTML = SETTINGS.notenverteilung[i]+"%";
				tr2.appendChild(td);
				td = document.createElement('td');
					td.innerHTML = temp;
				tr3.appendChild(td);
			}
			thead.appendChild(tr1);
			table.appendChild(thead);
			table.appendChild(tr2);
			table.appendChild(tr3);
			i_ProzVert.appendChild(table);
			old_ProzVert.parentNode.replaceChild(i_ProzVert, old_ProzVert);
		}
		// Vorberechnungen -
		var alleNoten = document.getElementsByClassName('Note ');
		var dict_Noten = {1:0,2:0,3:0,4:0,5:0,6:0};
		for (i=0;i<alleNoten.length;i++){
			thisNote = parseInt(alleNoten[i].getElementsByTagName('span')[0].innerHTML);
			if (thisNote){
				dict_Noten[thisNote] ++;
			}
		}
		// Durchschnitte
		// -- nach Noten
		arrNoten = [];
		var m;
		for (i in dict_Noten){
			m = 0;
			for (m=0;m<dict_Noten[i];m++){
				arrNoten.push(i);
			}
		}
		var ds_Noten = Math.round((sum(arrNoten)/arrNoten.length)*100)/100;
		document.getElementById('ds_nach_Noten').value = ds_Noten;
		var markings = [{ xaxis: { from: ds_Noten-1, to: ds_Noten-1, lineWidth: 2 }, color: "brown" },];
		// -- nach Prozent
		var arrProzent = [];
		if (isRohpkt){
			for (i=0;i<alleNoten.length;i++){
				thisNote = parseInt(alleNoten[i].getElementsByTagName('span')[1].innerHTML);
				if (thisNote){
					arrProzent.push(thisNote);
				}
			}
			// -- Prozent in Note umrechnen
			var ds_Proz = Math.round((sum(arrProzent)/arrProzent.length)*10)/10;
			document.getElementById('ds_nach_Prozent').value = RohpunkteAlsNote(ds_Proz, false)+" ("+ds_Proz+" %)";
			markings.push({ xaxis: { from: RohpunkteAlsNote(ds_Proz, false)-1, to: RohpunkteAlsNote(ds_Proz, false)-1, lineWidth: 2, }, color: "rosybrown" });
		}else{
			document.getElementById('ds_nach_Prozent').value = "-";
		}
		// Verteilung der Zensuren
		var plot_data = [];
		for (i=1;i<7;i++){
			plot_data.push([i,dict_Noten[i]]);
		}
		$.plot("#diag_AnzahlNoten", [
			{
			data: plot_data,
			bars: {
				show: true,
				barWidth: 0.8,
				align: "center",
				horizontal: false,
				lineWidth: 0,
			},
			valueLabels: {
				show: true,
				valign: 'middle',
				align: 'center',
				font: "12pt 'Arial'",
				fontcolor: "rgb(47,79,79)",
				plotAxis: "y",
				hideZero: true,
				labelFormatter: function(v){return v+"x";},
			},
			}],
			{
				colors: ["rgb(47,79,79)"],
				yaxis : {ticks: 0,}, xaxis: {mode: "categories", tickLength: 5,},
				grid : {
					borderWidth: {bottom: 1, top:0, left:0,right:0,},
					margin: {bottom: 10,},
					labelMargin: 5,
					markings:markings,
				},
			}
		);
		// Bester & Schlechtester
	}
	popUp('item2Stats');
}


function dropLeistung(){
	alert("Diese Funktion ist noch nicht auf die neue Datenbankengine umgestellt worden !");
	db.transaction(
			function(transaction){
			transaction.executeSql(
			'SELECT mndl, fspz, schr FROM '+klasse+' WHERE id="0";', [], function(t, results){
				var id_Leistung = sessionStorage.getItem('leistung_id');
				var column = sessionStorage.getItem('leistung_column');
				var Leistung = JSON.parse(decodeURIComponent(results.rows.item(0)[column]));
				// Leistung aus Dict entfernen
				delete Leistung[id_Leistung];
				// Leistung aus dem Array entfernen
				for (var i=0;i<Leistung.alle.length;i++){
					if (Leistung.alle[i] == id_Leistung){
						Leistung.alle.splice(i,1);
					}
				}
				updateDB(column, JSON.stringify(Leistung), 0);
			});
			transaction.executeSql(
			'SELECT id, mndl, fspz, schr FROM '+klasse+' WHERE id!="0";', [], function(t, results){
				var i, _id;
				var Leistung;
				var id_Leistung = sessionStorage.getItem('leistung_id');
				var column = sessionStorage.getItem('leistung_column');
				for (var i2=0;i2<results.rows.length;i2++){
					_id = results.rows.item(i2).id;
					Leistung = JSON.parse(decodeURIComponent(results.rows.item(i2)[column])) ||{'alle':[],};
					// Leistung aus Dict entfernen
					delete Leistung[id_Leistung];
					// Leistung aus dem Array entfernen
					for (i=0;i<Leistung.alle.length;i++){
						if (Leistung.alle[i] == id_Leistung){
							Leistung.alle.splice(i,1);
						}
					}
					updateDB(column, JSON.stringify(Leistung), _id);
					// Durchschnitt updaten
					if (column == "fspz") {
						var Schnitt = JSON.stringify(schnitt(Leistung, true));
						updateDB("o"+column, Schnitt, _id);
					}else{
						updateDB("o"+column, schnitt(Leistung), _id);
					}
				}
			});
			});
	setTimeout(function() {
		window.location = "uebersicht.htm";
	}, 600);
}