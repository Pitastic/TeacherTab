/*
- Hinweise einblenden:
	- PopUps zu erlauben
	- Querformat
	- auf Papier oder PDF drucken
*/

$(document).ready(function() {

	GLOBALS.mndl = [];
	GLOBALS.fspz = [];
	GLOBALS.schr = [];

	// Funktionen, die auf global SETTINGS warten müssen
	db_readMultiData(function(r){
		// Settings laden
		SETTINGS = r[0];

		db_readMultiData(function(rows){
			writeAllgemeines(rows);

			db_readMultiData(function(rows){
				writeGesamtuebersicht(rows);
				writeLeistungen(rows);
			}, "student");

		}, "leistung");

	}, "settings");

	closeListener();

});


function appendRow(className, Content, TableRow) {
	var tr = (TableRow) ? TableRow : document.createElement('tr');
	var td = document.createElement('td');
		td.className = className;
		td.innerHTML = Content;
	tr.appendChild(td);
	return tr;
}


function writeAllgemeines(results){
	if (!results || typeof results == "undefined") {results = [];}
	
	// Überschriften
	var insert_klassen = document.getElementsByClassName("insert_klasse");
	for (var i = insert_klassen.length - 1; i >= 0; i--) {
		insert_klassen[i].innerHTML = SETTINGS.name;
	}

	// Settings
	document.getElementById('insert_set_mndl').innerHTML = SETTINGS.gewichtung.mündlich+" %";
	document.getElementById('insert_set_fspz').innerHTML = SETTINGS.gewichtung['davon fachspezifisch']+" %";
	document.getElementById('insert_set_schr').innerHTML = SETTINGS.gewichtung.schriftlich+" %";
	for (var i = 6 - 1; i >= 1; i--) {
		document.getElementById('insert_set_note'+i).innerHTML = SETTINGS.notenverteilung[i]+" %";
	}

	// Leistungsinformationen
	// (Alle Leistungsarten in einem Loop)
	var arten = ['mndl', 'fspz', 'schr'];
	for (art = 0; art < arten.length; art++){

		var thead = document.createElement('thead');
		var tr = appendRow(arten[art]+"_namen", "Schülernamen");
		
		for (idx = 0; idx < results.length; idx++) {

			if (results[idx].subtyp == arten[art]) {
				// Leistung hat einen Eintrag > auflisten
				Leistung = results[idx];
				GLOBALS[arten[art]].push(Leistung);
				tr = appendRow(arten[art], "Nr. "+GLOBALS[arten[art]].length, tr);
			}

		}
		thead.appendChild(tr);		
		document.getElementsByClassName("tab_"+arten[art])[0].appendChild(thead);

		
		// Allgemeine Infos (unten)
		var id_array = GLOBALS[arten[art]];
		var tbody2 = document.createElement('tbody');

		if (id_array.length) {
			var tr2 = appendRow("nummer", "Nr. 1");
			for (var i = 0; i < id_array.length; i++) {
				var Leistung = id_array[i];
				tr2 = appendRow("", Leistung.Datum, tr2);
				tr2 = appendRow("", Leistung.Bezeichnung, tr2);
				tr2 = appendRow("", Leistung.Gewichtung, tr2);
				tr2 = appendRow("", Leistung.Eintragung, tr2);

				if (Leistung.Eintragung == "Rohpunkte") {
					var vert_string = "";
					for (vert in Leistung.Verteilungen) {
						vert_string += vert+": " +
							Leistung.Verteilungen[vert].Kat1 + " / " +
							Leistung.Verteilungen[vert].Kat2 + " / " +
							Leistung.Verteilungen[vert].Kat3 + " / " +
							Leistung.Verteilungen[vert].Kat4 + " / " +
							Leistung.Verteilungen[vert].Gesamt + " Punkte";
						vert_string += "<br>";
					}
				}else if (Leistung.Eintragung == "Punkte") {
					var vert_string = Leistung.Verteilungen.Standard.Gesamt + " Punkte";

				}else{
					var vert_string = "-";

				}

				tr2 = appendRow("", vert_string, tr2);
			}


		}else{
			var tr2 = appendRow("nummer", "-");
			tr2 = appendRow("", "-", tr2);
			tr2 = appendRow("", "-", tr2);
			tr2 = appendRow("", "-", tr2);
			tr2 = appendRow("", "-", tr2);
			tr2 = appendRow("", "-", tr2);
		}

		document.getElementById("tab_allgemein_"+arten[art]).appendChild(tr2);
	}
}

function writeGesamtuebersicht(rows) {
	if (!rows || typeof rows == "undefined") {rows = [];}
	var tr;
	var GSU = document.getElementsByClassName("tab_gesamt")[0];
	var thead = document.createElement('thead');
	var tbody = document.createElement('tbody');

	// Headings
	tr = appendRow("namen", "");
	tr = appendRow("mndl", "&#216; mndl.", tr);

	if (SETTINGS.fspzDiff) {
		tr = appendRow("fspz", "&#216; fspz.V", tr);
		tr = appendRow("fspz", "&#216; fspz.G", tr);
	}else{
		tr = appendRow("fspz", "&#216; fspz.", tr);
	}

	tr = appendRow("schr", "&#216; schr.", tr);
	tr = appendRow("rechnerisch"," &#216; gesamt", tr);
	tr = appendRow("eingetragen", "&#216; eingetragen", tr);

	thead.appendChild(tr);

	// Body
	for (var i = rows.length - 1; i >= 0; i--) {

		tr = appendRow("namen", rows[i].name.nname+", "+rows[i].name.vname);
		tr = appendRow("mndl", rows[i].gesamt.omndl, tr);

		if (SETTINGS.fspzDiff) {
			tr = appendRow("fspz", rows[i].gesamt.ofspz.Vokabeln, tr);
			tr = appendRow("fspz", rows[i].gesamt.ofspz.Grammatik, tr);
		}else{
			tr = appendRow("fspz", rows[i].gesamt.ofspz.Gesamt, tr);
		}

		tr = appendRow("schr", rows[i].gesamt.oschr, tr);
		tr = appendRow("rechnerisch", rows[i].gesamt.rechnerisch, tr);
		tr = appendRow("eingetragen", rows[i].gesamt.eingetragen, tr);

		tbody.appendChild(tr);
	}

	GSU.appendChild(thead);
	GSU.appendChild(tbody);
}

function writeLeistungen(rows) {
	if (!rows || typeof rows == "undefined") {rows = [];}
	var arten = ['mndl', 'fspz', 'schr'];
	var l_id;

	for (art = 0; art < arten.length; art++){
		var tbody = document.createElement('tbody');
		var l_typ = arten[art];

		for (var i = rows.length - 1; i >= 0; i--) {

			var tr = appendRow("namen", rows[i].name.nname+", "+rows[i].name.vname);
			var c;

			for (var i2 = GLOBALS[l_typ].length - 1; i2 >= 0; i2--) {
				l_id = GLOBALS[l_typ][i2].id;
				if (rows[i][l_typ][l_id] && rows[i][l_typ][l_id].Mitschreiber) {
					c = (rows[i][l_typ][l_id].Prozent) ? rows[i][l_typ][l_id].Note+" ("+rows[i][l_typ][l_id].Prozent+")" : rows[i][l_typ][l_id].Note;
				}else{
					c = "-";
				}
				tr = appendRow(l_typ, c, tr);

			}

			tbody.appendChild(tr);

		}

		document.getElementsByClassName("tab_"+l_typ)[0].appendChild(tbody);
	}
}

function zensur(zeilen_objekt, spezKey, digit){
	result = "";
	result = JSON.parse(decodeURIComponent(zeilen_objekt));
	if (spezKey){
		result = result[spezKey];
	}
	return Math.round(result*digit)/digit || "-"
}