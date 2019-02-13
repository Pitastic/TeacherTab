"use strict";
// esLint Globals:
/* global $ SETTINGS GLOBALS SHIMindexedDB
closeListener formLeistung slide1 handleDeleteLeistung fspz_Bezeichnung compareStudents popUp popUpClose updateNoten sum timestamp handleSchnitt RohpunkteAlsNote createAccount isObject updateStatus mergeDeep formSettings
db_readMultiData db_readKlasse db_dropKlasse db_simpleUpdate db_dynamicUpdate db_deleteDoc db_replaceData db_readSingleData db_updateData
sync_deleteKlasse sync_pushBack sync_getKlasse*/

window.addEventListener('load', function () {

	// Funktionen, die auf global SETTINGS warten müssen
	db_readMultiData(function (r) {
		// Load Settingspage
		SETTINGS = r[0];
		settingDetails(SETTINGS);
	}, "settings", console.log);

	// Style and Listeners
	closeListener();
});

function settingDetails(results) {
	var i;
	var SETTINGS = results;
	//-- Notenverteilung
	var vertNoten = SETTINGS.notenverteilung;
	var inputs1 = document.getElementById('form_Notenverteilung').getElementsByTagName('input');
	for (i = 0; i < inputs1.length; i++) {
		if (i + 1 == 6) {
			inputs1[i].value = 0;
		} else {
			inputs1[i].value = vertNoten[(i + 1)];
		}
	}
	//-- Kompetenz Namen
	//var kompNamen = SETTINGS.kompetenzen;
	var inputs2 = document.getElementById('form_KompNamen').getElementsByTagName('input');
	for (i = 0; i < inputs2.length; i++) {
		inputs2[i].value = SETTINGS.kompetenzen['Kat' + (i + 1)] || "";
	}
	//-- Gewichtung
	var Gewichtung = SETTINGS.gewichtung;
	i = 0;
	var labels = document.getElementById('form_Gewichtung').getElementsByTagName('label');
	var inputs3 = document.getElementById('form_Gewichtung').getElementsByTagName('input');
	for (var e in Gewichtung) {
		labels[i].childNodes[0].textContent = e + " ";
		inputs3[i].value = Gewichtung[e] * 100;
		i++;
	}
	//-- Fachspezifische Einstellungen
	document.form_fspz.differenziert.checked = SETTINGS.fspzDiff;
	//-- Schülerliste
	document.form_sex.stud_Sort.checked = SETTINGS.studSort;
	var a_button = document.getElementById('alle_gruppieren').getElementsByTagName('a')[0];
	a_button.addEventListener('click', function () {
		db_readMultiData(function (result) {
			//document.getElementById('Abbrechen').innerHTML = "Abbrechen";
			document.getElementById('Save').onclick = function () {
				// Gruppierung speichern
				saveGruppen();
			};
			document.getElementById('item1setting').classList.remove('show');
			popUp('item1setting_info');
			gruppierenListe(result);
		}, "student");

	});
	//-- Vorjahresnoten
	// DEV: Disabled
	//document.form_vorjahr.setVorjahr.checked = SETTINGS.showVorjahr;
	// Anzeigen
	slide1('item1setting');
}


function SettingsSave(bol_save) {
	//var content = document.getElementById('listSetting');
	var inputs, i;
	var settings = SETTINGS;
	if (bol_save) {
		// -- Gewichtung
		inputs = document.getElementById('form_Gewichtung').getElementsByTagName('input');
		settings.gewichtung = {
			"mündlich": inputs[0].value / 100,
			"davon fachspezifisch": inputs[1].value / 100,
			"schriftlich": inputs[2].value / 100,
		};
		// -- Notenverteilung
		inputs = document.getElementById('form_Notenverteilung').getElementsByTagName('input');
		settings.notenverteilung = {};
		for (i = 0; i < inputs.length; i++) {
			settings.notenverteilung[(i + 1)] = parseInt(inputs[i].value);
		}
		// -- Kompetenz-Namen
		inputs = document.getElementById('form_KompNamen').getElementsByTagName('input');
		settings.kompetenzen = {};
		settings.kompetenzen["Gesamt"] = "Gesamt";
		for (i = 0; i < inputs.length; i++) {
			settings.kompetenzen["Kat" + (i + 1)] = inputs[i].value || "Kategorie " + (i + 1);
		}
		// -- Sonstige Settings
		// -- -- Fachspezifisches
		settings.fspzDiff = document.form_fspz.differenziert.checked;
		// -- -- Sortierung nach Gruppen
		settings.studSort = document.form_sex.stud_Sort.checked;
		// -- -- Vorjahresnoten
		// DEV: Disabled
		settings.showVorjahr = false; //document.form_vorjahr.setVorjahr.checked;

		// DB save und refresh
		db_replaceData(function () {
			SETTINGS = settings;
			handleSchnitt(function () {
				slide1('item1setting', "uebersicht.htm");
			});
		}, settings, GLOBALS.klasse);
	}
}


function gruppierenListe(results) {
	var r, c, liste, ul;
	results.sort(compareStudents);
	liste = document.getElementById('gruppierenListe');
	ul = document.createElement('ul');
	for (var i in results) {
		var row = results[i];
		r = document.createElement('li');
		if (row.sort && row.sort !== "-" && row.sort !== "null") {
			c = document.createElement('div');
			c.className = "s_flag";
			c.innerHTML = row.sort;
			r.appendChild(c);
		}
		r.setAttribute('data-rowid', row.id);
		c = document.createElement('div');
		c.className = "name";
		c.innerHTML = row.name.nname + ', ' + row.name.vname;
		r.appendChild(c);
		ul.appendChild(r);
		// Eventlistener für dieses li
		r.addEventListener('click', function () {
			// Zeile hervorheben
			if (this.classList.contains("selected")) {
				this.classList.remove('selected');
			} else {
				this.classList.add('selected');
			}
		});
	}
	liste.appendChild(ul);
	slide1('item1setting_gruppen');
	return true;
}

/*
function vorjahresPop(el) {
	if (el.checked) {
		var filter = GLOBALS.klasse.substring(1, GLOBALS.klasse.length-1);
		readDB_tables(listIdx_Select,[true, filter]);
		popUp("item1setting_vorjahr");
	}
	return;
}

function saveVorjahr(el, abort) {
	var kSelect = document.form_vorjahrSelect.klasseSelect;
	// check if "bitte wählen"
	invalid = kSelect.value[0] == "-" ? true : false;
	if (abort || invalid) {
		document.form_vorjahr.setVorjahr.checked = false;
	}else{
		var k = "["+kSelect.value+"]";
		// Daten der Partnerklasse hinterlegen
		checkColumn('vorjahr', 'TEXT');
		import_Column('gesamt', k, 'vorjahr');
	}
	popUpClose(el, false);
	return;
}
*/

function saveGruppen() {
	// Gruppierung speichern
	// (DEV: Gruppe in Element speichern um mehr Gruppen auf einmal speichern zu können)
	var gruppe = document.getElementById("gruppierer").value;
	var liste = document.getElementsByClassName("selected");
	var student, i;
	var newObjects = {};
	for (i = 0; i < liste.length; i++) {
		student = liste[i].getAttribute("data-rowid");
		newObjects[student] = {
			'name': {
				'sort': gruppe,
				'changed': timestamp(),
			}
		};
	}

	db_updateData(function () { // db_
		slide1('item1setting_gruppen', "uebersicht.htm");
	}, newObjects);

	return true;
}
