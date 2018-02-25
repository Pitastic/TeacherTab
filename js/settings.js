$(document).ready(function() {
	// Funktionen, die auf global SETTINGS warten müssen
	db_readMultiData(function(r){
		// Load Settingspage
		SETTINGS = r[0];
		settingDetails(SETTINGS);
	}, "settings", console.log);

	// Style and Listeners
	touchListener(['header', 'footer', 'fadeBlack']);
	closeListener();
});

function settingDetails(results){
	var i;
	var SETTINGS = results;
	//-- Notenverteilung
	var vertNoten = SETTINGS.notenverteilung;
	var inputs = document.getElementById('form_Notenverteilung').getElementsByTagName('input');
	for (i = 0; i < inputs.length; i++) {
		if (i+1 == 6) {
			inputs[i].value = 0;
		}else{
			inputs[i].value = vertNoten[(i+1)];
		}
	}
	//-- Kompetenz Namen
	var kompNamen = SETTINGS.kompetenzen;
	var inputs = document.getElementById('form_KompNamen').getElementsByTagName('input');
	for (i = 0; i < inputs.length; i++) {
		inputs[i].value = SETTINGS.kompetenzen['Kat'+(i+1)] || "";
	}
	//-- Gewichtung
	var Gewichtung = SETTINGS.gewichtung;
	i = 0;
	labels = document.getElementById('form_Gewichtung').getElementsByTagName('label');
	inputs = document.getElementById('form_Gewichtung').getElementsByTagName('input');
	for (e in Gewichtung){
		labels[i].childNodes[0].textContent = e+" ";
		inputs[i].value = Gewichtung[e]*100;
		i++;
	}
	//-- Fachspezifische Einstellungen
	document.form_fspz.differenziert.checked = SETTINGS.fspzDiff;
	//-- Schülerliste
	document.form_sex.stud_Sort.checked = SETTINGS.studSort;
	var a_button = document.getElementById('alle_gruppieren').getElementsByTagName('a')[0];
	a_button.addEventListener('click', function(){
			db_readMultiData(function(result){
				document.getElementById('Abbrechen').innerHTML = "Abbrechen";
				document.getElementById('Save').onclick = function(){
					// Gruppierung speichern
					saveGruppen();
				};
				document.getElementById('item1setting').classList.remove('show');
				popUp('item1setting_info');
				gruppierenListe(result);
			}, "student");

		})
	//-- Vorjahresnoten
	// DEV: Disabled
	//document.form_vorjahr.setVorjahr.checked = SETTINGS.showVorjahr;
	// Füllen
	document.getElementById('item1setting').classList.add('show');
}


function SettingsSave(bol_save){
	var content = document.getElementById('listSetting');
	var inputs, i;
	var settings = SETTINGS;
	if (bol_save){
		// -- Gewichtung
		inputs = document.getElementById('form_Gewichtung').getElementsByTagName('input');
		settings.gewichtung = {
			"mündlich" : inputs[0].value/100,
			"davon fachspezifisch" : inputs[1].value/100,
			"schriftlich" : inputs[2].value/100,
		};
		// -- Notenverteilung
		inputs = document.getElementById('form_Notenverteilung').getElementsByTagName('input');
		settings.notenverteilung = {};
		for (i=0;i<inputs.length;i++){
			settings.notenverteilung[(i+1)] = parseInt(inputs[i].value);
		}
		// -- Kompetenz-Namen
		inputs = document.getElementById('form_KompNamen').getElementsByTagName('input');
		settings.kompetenzen = {};
		settings.kompetenzen["Gesamt"] = "Gesamt";
		for (i=0;i<inputs.length;i++){
			settings.kompetenzen["Kat"+(i+1)] = inputs[i].value || "Kategorie "+(i+1);
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
		db_replaceData(function(){
			SETTINGS = settings;
			handleSchnitt(function(){
				setTimeout(function(){
					window.location = 'uebersicht.htm';
				}, 750)
				document.getElementById('item1setting').classList.remove('show');
			});
		}, settings, GLOBALS.klasse);
	}
}


function gruppierenListe(results){
	var r, c, liste, ul;
	liste = document.getElementById('gruppierenListe');
	ul = document.createElement('ul');
	for (i in results){
		if (i==0) {continue;}
		row = results[i];
		r = document.createElement('li');
			if (row.sort && row.sort !== "-" && row.sort !== "null"){
				c = document.createElement('div');
					c.className = "s_flag";
					c.innerHTML = row.sort;
					r.appendChild(c);
			}
			r.setAttribute('data-rowid', row.id);
			c = document.createElement('div');
				c.className = "name";
				c.innerHTML = row.name.nname+', '+row.name.vname;
		r.appendChild(c);
		ul.appendChild(r);
		// Eventlistener für dieses li
		r.addEventListener('click', function() {
			// Zeile hervorheben
			if (this.classList.contains("selected")){
				this.classList.remove('selected')
			}else{
				this.classList.add('selected');
			}
		});
		}
	liste.appendChild(ul);
	document.getElementById('item1setting_gruppen').classList.add('show');
	return true
}

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

function saveGruppen(){
	// Gruppierung speichern
	// (DEV: Gruppe in Element speichern um mehr Gruppen auf einmal speichern zu können)
	var gruppe = document.getElementById("gruppierer").value;
	var liste = document.getElementsByClassName("selected");
	var student, i;
	newObjects = {};
	for (i=0;i<liste.length;i++){
		student = liste[i].getAttribute("data-rowid");
		newObjects[student] = {'sort': gruppe};
	}
	updateData(function(){ // db_
		setTimeout(function(){
			window.location = "uebersicht.htm";
		},750);
		document.getElementById('item1setting_gruppen').classList.remove('show');
	}, newObjects);
	return true
}
