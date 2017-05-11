$(document).ready(function() {
	// Event-Listener
	closeListener();
	touchListener(['header', 'footer', 'fadeBlack', 'KeyBar'])

	var pop = document.getElementById('item2Set');
	pop.getElementsByClassName('button OK')[0].addEventListener('click', function(){

		/* --- angefangen
		var art = sessionStorage.getItem('leistung_art');
		var id = sessionStorage.getItem('leistung_id');
		// --
		db.transaction(
			function(transaction){
			transaction.executeSql(
			'SELECT mndl, fspz, schr FROM '+klasse+' WHERE id="0";', [], function(t, results){
				var id_Leistung = sessionStorage.getItem('leistung_id');
				var column = sessionStorage.getItem('leistung_art');
				var Leistung = JSON.parse(decodeURIComponent(results.rows.item(0)[column]));
				Leistung[id_Leistung].Datum = leistungEdit.notenDatum.value;
				Leistung[id_Leistung].Bezeichnung = leistungEdit.notenBezeichnung.value;
				Leistung[id_Leistung].Gewichtung = leistungEdit.rangeWert.value;
				updateDB(column, JSON.stringify(Leistung), 0);
			});
			});
		*/
		pop.classList.remove('showPop');
		setTimeout(function() {
			window.location.reload();
		}, 500);
	});
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
	var id_Leistung = sessionStorage.getItem('leistung_id');

	// Funktionen, die auf global SETTINGS warten müssen
	readSettings(function(){
		leistungsDetails(art, id_Leistung);
	});
});

// Listings
// =============================================================================
// >>>>>>>> Routing - Art der Eintragung filtern
function leistungsDetails(art, id_Leistung){
	// - - - Kopfdaten - - -
	readData(function(results){
		var katObj = results.kompetenzen;
		var Leistung = results.leistungen[art][id_Leistung];
		sessionStorage.setItem('leistung_gewicht', Leistung.Gewichtung || 1);
		sessionStorage.setItem('Eintragung', Leistung.Eintragung);
		// - Edit Pop
		var editLeistung = document.getElementById("leistungEdit");
		editLeistung.notenBezeichnung.value = Leistung.Bezeichnung;
		editLeistung.notenDatum.value = Leistung.Datum;
		editLeistung.notenArt.value = art;
		editLeistung.rangeSlide.value = parseFloat(Leistung.Gewichtung) < 1 ? 0 : parseFloat(Leistung.Gewichtung);
		editLeistung.rangeWert.value = parseFloat(Leistung.Gewichtung) || 1;
		fspz_Bezeichnung();
		// - Laden der eigentlichen Leistung
		switch (Leistung.Eintragung) {
			case "Rohpunkte":
				leistungsDetails_rohpunkte(art, Leistung, katObj);
				break;
			case "Noten":
				leistungsDetails_noten(art, Leistung);
				break;
			case "Punkte":
				leistungsDetails_punkte(art, Leistung);
				break;
		}
	}, 0)
	return true
}

// =============================================================================
// >>>>>>>> nach ganzen Noten
function leistungsDetails_noten(art, Leistung){
	var target_el = document.getElementById("item2details");
		// Leistungsart sichern
		target_el.setAttribute('data-l_art', art);
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
	readData(function(results){
		var i, row, li, div, span, gruppe;
		var old = document.getElementById("arbeit_leistung");
		var new_el = old.cloneNode(true);
			new_el.innerHTML = "";
		var ul = document.createElement('ul');
		for (r in results){
			if (r == 0) {continue;}
			row = results[r];
			eigeneLeistung = row[art][Leistung.id];
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

		// Animationen
		setTimeout(function() {
			target_el.classList.add('show');
			infoEl.classList.add('show');
		}, 250);
		setTimeout(function() {
			calc_Stats(true);
		}, 1000);
	});
}


// =============================================================================
// >>>>>>>> nach einfachen Punkten
function leistungsDetails_punkte(column, Leistung){
	var target_el = document.getElementById("item2details");
		// Leistungscolumn sichern
		target_el.setAttribute('data-l_column', column);
		target_el.setAttribute('data-l_id', Leistung.id);
	var maxPts = Leistung.Standard.Gesamt;
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
			btn_numfield.onclick = function(){editNotenListe(numfield.value); numfield_li.className = "inputs saved"};
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
	db.transaction(function(transaction) {
		transaction.executeSql(
			"SELECT id, nName, vName, sex, "+column+" FROM "+klasse+" WHERE id !=0 ORDER BY nName", [], function(transaction,results){
				var i, row, li, div, span, gruppe;
				var id_Leistung = sessionStorage.getItem('leistung_id');
				var old = document.getElementById("arbeit_leistung");
				var new_el = old.cloneNode(true);
					new_el.innerHTML = "";
				var ul = document.createElement('ul');
				for (i=0; i<results.rows.length; i++){
					row = results.rows.item(i);
					var Leistung = JSON.parse(decodeURIComponent(row[column]))[id_Leistung];
					// Leistung bei Schüler vorhanden ?
					if (!Leistung || Leistung.Mitschreiber == "false" || !Leistung.Mitschreiber == "undefined" || !Leistung.Mitschreiber){
						Leistung = {'Mitschreiber':'false', 'Note':'-', 'Kat1':'-', 'Kat2':'-', 'Kat3':'-', 'Kat4':'-', 'Gesamt': '-'};
					}
					li = document.createElement('li');
						li.setAttribute('data-rowid', "line"+row.id);
						li.setAttribute('data-mitschreiber', Leistung.Mitschreiber);
					// Name
					gruppe = row.sex && row.sex !== "-" && row.sex !== "null" ? " ("+row.sex+")" : "";
					div = document.createElement('div');
						div.className = "Name";
					span = document.createElement('span');
						span.innerHTML = row.vName;
						div.appendChild(span);
					span = document.createElement('span');
						span.innerHTML = row.nName+gruppe;
						div.appendChild(span);
					li.appendChild(div);
					// Gesamtpunkte
					div = document.createElement('div');
						div.className = "Gesamtpunkte";
					span = document.createElement('span');
						span.innerHTML = Leistung.Gesamt;
						div.appendChild(span);
					span = document.createElement('span');
						span.innerHTML = "Punkte";
						div.appendChild(span);
					li.appendChild(div);
				   // Note ---- nicht dynamisch
					div = document.createElement('div');
						div.className = "Note standalone";
					span = document.createElement('span');
						span.innerHTML = Leistung.Note;
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

			setTimeout(function() {
				target_el.classList.add('show');
				infoEl.classList.add('show');
				editNotenListe(maxPts);
			}, 250);
			setTimeout(function() {
				calc_Stats(true);
			}, 1000);
		});
	});
}

// =============================================================================
// >>>>>>>> nach Rohpunkten
function leistungsDetails_rohpunkte(column, Leistung, katObj){
	var target_el = document.getElementById("item2details");
		// Leistungscolumn sichern
		target_el.setAttribute('data-l_column', column);
		target_el.setAttribute('data-l_id', Leistung.id);
	var old = document.getElementById("arbeit_info");
	var new_el = old.cloneNode(true);
		new_el.innerHTML = "";
	var Verteilungen = Leistung.Verteilungen; // save für Schülerdaten
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
			kat_div.innerHTML = katObj["Kat"+i]+" : ";
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
			gesamtDiv.innerHTML = "Gesamt";
	divVerteilung.appendChild(gesamtDiv);
	// Verteilung ändern
	var popVert = document.getElementById('item2Verteilung');
	var inputs = popVert.querySelectorAll("[data-kat='kat']");
	for (i=0; i<inputs.length;i++){
		var kat_Text = document.createElement('span')
		kat_Text.innerHTML = katObj["Kat"+(i+1)]+" : ";
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
	for (i=0;i<Leistung.Verteilungen.length;i++){
		opt = new Option(Leistung.Verteilungen[i]);
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
		updateVerteilung(inputs, Pkt_Verteilung);
		popUpClose(this,0);
		};
	popVertNeu.onclick = function(){
		var Pkt_Verteilung = document.getElementById('Pkt_new');
		updateVerteilung(inputs, Pkt_Verteilung.value);
		popUpClose(this,0);
		item2Save(true, Leistung.Bezeichnung, true);
	};
	updateVerteilungSession();
   
   // - - - Schülerdaten - - -
	db.transaction(function(transaction) {
		transaction.executeSql(
			"SELECT id, nName, vName, sex, "+column+" FROM "+klasse+" WHERE id !=0 ORDER BY nName", [], function(transaction,results){
				var i, i2, row, li, div, span;
				var l_id = sessionStorage.getItem('leistung_id');
				var old = document.getElementById("arbeit_leistung");
				var new_el = old.cloneNode(true);
					new_el.innerHTML = "";
				var ul = document.createElement('ul');
				for (i=0; i<results.rows.length; i++){
					row = results.rows.item(i);
					var Leistung = JSON.parse(decodeURIComponent(row[column]))[l_id];
					if (!Leistung || Leistung.Mitschreiber == "false" || Leistung.Mitschreiber == "undefined"){
						Leistung = {'Kat1':'-' , 'Kat2':'-' , 'Kat3':'-' , 'Kat4':'-' , 'Gesamt':'-', 'Verteilung':Verteilungen[0]};
					}
					li = document.createElement('li');
						li.setAttribute('data-rowid', "line"+row.id);
						li.setAttribute('data-verteilung', Leistung.Verteilung);
						li.setAttribute('data-mitschreiber', Leistung.Mitschreiber);
					// Name
					gruppe = row.sex && row.sex !== "-" && row.sex !== "null" ? " ("+row.sex+")" : "";
					li.setAttribute('data-studentname', row.vName+" "+row.nName);
					div = document.createElement('div');
						div.className = "Name";
					span = document.createElement('span');
						span.innerHTML = row.vName;
						div.appendChild(span);
					span = document.createElement('span');
						span.innerHTML = row.nName+gruppe;
						div.appendChild(span);
					li.appendChild(div);
					// Kategorien
					li.setAttribute('data-verteilung', Leistung.Verteilung);
					for (i2 in katObj){
						div = document.createElement('div');
						div.className = "Kategorien";
						span = document.createElement('span');
						span.innerHTML = Leistung[i2];
						span.setAttribute('data-name', i2);
						div.appendChild(span);
						span = document.createElement('span');
						span.innerHTML = katObj[i2];
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
				updateNoten(new_el, false);
				old.parentNode.replaceChild(new_el, old);
				// - - - - - - - - - - - - - - - -
				var popEdit = pop.getElementsByTagName('ul')[0].getElementsByTagName('input');
				for (i2 = 0; i2 < popEdit.length; i2++) {
					var kat_Text = document.createElement('span')
					kat_Text.innerHTML = katObj["Kat"+(i2+1)]+" : ";
					popEdit[i2].parentNode.insertBefore(kat_Text, popEdit[i2]);
				}
		});
	});
	target_el.classList.add('show');
	setTimeout(function(){
		infoEl.classList.add('show');
			calc_Stats(true);
		},250);
	setTimeout(function() {
		calc_Stats(true);
	}, 1000);
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
	sessionStorage.setItem('Standard_Gesamt', maxPts);
	updateVerteilung(maxPts, 'Standard');
	return true;
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
console.log(punkteObj);
	// Neu zeichnen nur der einen Zeile !
	var line = document.getElementById('item2details').querySelector("[data-rowid="+pop.getAttribute('data-rowid')+"]");
	for (i in punkteObj){
		line.querySelector('[data-name='+i+']').innerHTML = punkteObj[i];
	}
	line.setAttribute('data-verteilung', selectBox.value);
	line.setAttribute('data-mitschreiber', document.getElementById('mitschreiberTrue').checked);
	// - Note neu berechenen und eintragen
	popUpClose(thisElement, false);
	updateNoten(line, true);
	calc_Stats(true);
}

// >>>>>>>> Speichern und Verlassen
function item2Save(bol_kat, Bezeichnung, bol_refresh){
//--> Leistungen der Schüler speichern
	var i;
	var art = sessionStorage.getItem('leistung_art');
	var id_Leistung = sessionStorage.getItem('leistung_id');
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
		updateData(function(){

/* ALT !

Aufruf: updateSchnitt in database.js
> calcDS und Schnitt zusammenfassen
> Schnitt liefert bisher nur leere Strings...



		readDB_id(function(results, liID, newObject){
			var old_Leistung = JSON.parse(decodeURIComponent(results.rows.item(0)[column]));
			var old_Array = old_Leistung.alle;
			var _index = old_Array.indexOf(id_Leistung);
			if (newObject.Mitschreiber == "true" && _index<0){
				// Wenn noch nicht im Array dann Push, sonst None
				old_Array.push(id_Leistung);
			}else if(newObject.Mitschreiber !== "true" && _index>-1){
				// Wenn schon im Array dann Splice, sonst None
				old_Array.splice(_index,1);
			}
			// id im Dict mit neuem Objekt aktalisieren
			old_Leistung[id_Leistung] = newObject;
			updateDB(column, JSON.stringify(old_Leistung), liID);
*/



			// Update Notenschnitt (omndl, oschr) - Besonderheit ofspz <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  ----------------------- !!!!
/*
			if (column == "fspz") {
				var Schnitt = schnitt(old_Leistung, true);
				var omndl = schnitt(JSON.parse(decodeURIComponent(results.rows.item(0).mndl)));
				updateDB("o"+column, JSON.stringify(Schnitt), liID);
				var Schnitt2 = schnitt_m_f(omndl,Schnitt.Gesamt);
				updateDB("omndl", Schnitt2, liID);
			}else if (column == "mndl"){
				var Schnitt = schnitt(old_Leistung);
				var ofspz = JSON.parse(decodeURIComponent(results.rows.item(0).fspz));
				var Schnitt2 = schnitt_m_f(Schnitt,ofspz);
				updateDB("omndl", Schnitt2, liID);
			}else{
				updateDB("o"+column, schnitt(old_Leistung), liID);
			}
		},liID,"mndl, omndl, fspz, ofspz, schr, oschr", newObject);
	}
*/

		// Animationen
		document.getElementById('item2details').classList.remove('show');
		document.getElementById('arbeit_info').classList.add('hide');
		if (bol_refresh){
			setTimeout(function() {
				window.location.reload();
			}, 2000);
		}else{
			setTimeout(function() {
				if (sessionStorage.getItem('jump_id')) {
					sessionStorage.removeItem('jump_id');
					window.location = "details_students.htm";
				}else{
					window.location = "uebersicht.htm";
				}
			}, 2000);
		}
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