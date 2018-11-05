"use strict";
// esLint Globals:
/* global $ SETTINGS GLOBALS SHIMindexedDB
closeListener formLeistung slide1 handleDeleteLeistung fspz_Bezeichnung compareStudents popUp popUpClose updateNoten sum timestamp handleSchnitt RohpunkteAlsNote createAccount isObject updateStatus mergeDeep formSettings
db_readMultiData db_readKlasse db_dropKlasse db_simpleUpdate db_dynamicUpdate db_deleteDoc db_replaceData db_readSingleData db_updateData
sync_deleteKlasse sync_pushBack sync_getKlasse*/
$(document).ready(function() {

	GLOBALS.mndl = [];
	GLOBALS.fspz = [];
	GLOBALS.schr = [];


	// Funktionen, die auf global SETTINGS warten müssen
	db_readMultiData(function(r){
		// Settings laden
		SETTINGS = r[0];

		// Ausgabe des Exports
		switch(sessionStorage.getItem("export_type")){
		case "csv":
		case "json":

			document.getElementById("bezeichnung").innerHTML = SETTINGS.name;
				
			db_readKlasse(function(r){

				var jsonData = btoa(JSON.stringify(r[1]));

				var a = document.createElement('a');
				a.href = 'data:application/json;charset=utf-8;base64,' + jsonData;
				a.download = GLOBALS.klasse+'.txt';

				// Append - Click - Remove
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);

			});
			break;

		case "copy":
			break;

		default:
			// Immer HTML wenn nicht anders gefordert
			db_readMultiData(function(rows){
				writeAllgemeines(rows);

				db_readMultiData(function(rows){
					writeGesamtuebersicht(rows);
					writeLeistungen(rows);
				}, "student");

			}, "leistung");

		}

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
	for (var i2 = 6 - 1; i2 >= 1; i2--) {
		document.getElementById('insert_set_note'+i2).innerHTML = SETTINGS.notenverteilung[i2]+" %";
	}

	// Leistungsinformationen
	// (Alle Leistungsarten in einem Loop)
	var arten = ['mndl', 'fspz', 'schr'];
	for (var art = 0; art < arten.length; art++){

		var thead = document.createElement('thead');
		var tr = appendRow(arten[art]+"_namen", "Schülernamen");
		
		for (var idx = 0; idx < results.length; idx++) {

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
		var legende_kompetenzen = 
			SETTINGS.kompetenzen.Kat1 + " / " +
			SETTINGS.kompetenzen.Kat2 + " / " +
			SETTINGS.kompetenzen.Kat3 + " / " +
			SETTINGS.kompetenzen.Kat4 + " / Gesamtpunkte";
		document.getElementById('legende_kompetenzen').innerHTML = legende_kompetenzen;

		var id_array = GLOBALS[arten[art]];
		var tr2;

		if (id_array.length) {
			tr2 = appendRow("nummer", "Nr. 1");
			for (var i3 = 0; i3 < id_array.length; i3++) {
				var Leistung = id_array[i3];
				tr2 = appendRow("", Leistung.Datum, tr2);
				tr2 = appendRow("", Leistung.Bezeichnung, tr2);
				tr2 = appendRow("", Leistung.Gewichtung, tr2);
				tr2 = appendRow("", Leistung.Eintragung, tr2);

				var vert_string = "";
				if (Leistung.Eintragung == "Rohpunkte") {
					for (var vert in Leistung.Verteilungen) {
						vert_string += vert+": " +
							Leistung.Verteilungen[vert].Kat1 + " / " +
							Leistung.Verteilungen[vert].Kat2 + " / " +
							Leistung.Verteilungen[vert].Kat3 + " / " +
							Leistung.Verteilungen[vert].Kat4 + " / " +
							Leistung.Verteilungen[vert].Gesamt + " Punkte";
						vert_string += "<br>";
					}
				}else if (Leistung.Eintragung == "Punkte") {
					vert_string = Leistung.Verteilungen.Standard.Gesamt + " Punkte";

				}else{
					vert_string = "-";

				}

				tr2 = appendRow("", vert_string, tr2);
			}


		}else{
			tr2 = appendRow("nummer", "-");
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

	for (var art = 0; art < arten.length; art++){
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
	var result = "";
	result = JSON.parse(decodeURIComponent(zeilen_objekt));
	if (spezKey){
		result = result[spezKey];
	}
	return Math.round(result*digit)/digit || "-";
}

// DEPRECATED: Nur als altem DB Format übernommen
function createCSV(results) {
	var columns=['mndl','fspz','schr'];
	var nameDict={};
	var buffer = "";
	var buffer_row="";
	var tempO, row, i;
	for (var i_outer = 0; i_outer < results.rows.length; i_outer++) {
		buffer_row = "";
		row = results.rows.item(i_outer);
		if (!row.id) {
			// - Gesamtuebersicht Header
			if (row.mndl){
				var mndl = JSON.parse(decodeURIComponent(row.mndl));
				var lengthMndl = 0;
				for (i=0; i<mndl.alle.length;i++){
					nameDict[mndl.alle[i]] = mndl[mndl.alle[i]].Bezeichnung;
					lengthMndl++;
				}
			}
			if (row.mndl){
				var fspz = JSON.parse(decodeURIComponent(row.fspz));
				var lengthFspz = 0;
				for (i=0; i<fspz.alle.length;i++){
					nameDict[fspz.alle[i]] = fspz[fspz.alle[i]].Bezeichnung;
					lengthFspz++;
				}
			}
			if (row.schr){
				var schr = JSON.parse(decodeURIComponent(row.schr));
				var lengthSchr = 0;
				for (i=0; i<schr.alle.length;i++){
					nameDict[schr.alle[i]] = schr[schr.alle[i]].Bezeichnung;
					lengthSchr++;
				}
			}
			buffer_row += "Gesamtübersicht\n\n;";
			buffer_row += Array(lengthMndl+1).join("m;");
			buffer_row += Array(lengthFspz+1).join("f;")+"(fspz DS);";
			buffer_row += "mndl (DS);";
			buffer_row += Array(lengthSchr+1).join("s;")+"schr (DS);rechnerisch;Gesamt";
		}else{
			// - Gesamtuebersicht Daten
			buffer_row += row.nName+", "+row.vName+";";
			tempO = JSON.parse(decodeURIComponent(row.mndl));
			for (var key in tempO) {
				if (tempO[key] && !tempO[key].length){
					buffer_row += (tempO[key].Mitschreiber && tempO[key].Mitschreiber !== "false" && tempO[key].Mitschreiber !== "undefined") ? tempO[key].Note.toString().replace(".",",")+";" : "-;";
				}
			}
			tempO = JSON.parse(decodeURIComponent(row.fspz));
			for (key in tempO) {
				if (tempO[key] && !tempO[key].length){
					buffer_row += (tempO[key].Mitschreiber && tempO[key].Mitschreiber !== "false" && tempO[key].Mitschreiber !== "undefined") ? tempO[key].Note.toString().replace(".",",")+";" : "-;";
				}
			}
			buffer_row += JSON.parse(decodeURIComponent(row.ofspz)).Gesamt.toString().replace(".",",")+";";
			buffer_row += row.omndl.toString().replace(".",",")+";";
			tempO = JSON.parse(decodeURIComponent(row.schr));
			for (key in tempO) {
				if (key !== "alle" && tempO[key]){
					buffer_row += (tempO[key].Mitschreiber && tempO[key].Mitschreiber !== "false" && tempO[key].Mitschreiber !== "undefined") ? tempO[key].Note.toString().replace(".",",")+";" : "-;";
				}
			}
			buffer_row += row.oschr.toString().replace(".",",")+";";
			buffer_row += JSON.parse(decodeURIComponent(row.gesamt)).rechnerisch.toPrecision(3)+";";
			buffer_row += JSON.parse(decodeURIComponent(row.gesamt)).eingetragen+";";
		}
		// cache Data bis hier hin
		buffer += buffer_row+"%0A";
	}
	var eintragung;
	var Leistung;
	buffer += "%0A";
	for (var i1=0; i1<columns.length;i1++){
		eintragung = null;
		row = results.rows.item(0);
		var oHeader = JSON.parse(decodeURIComponent(row[columns[i1]]));
		for (var i2=0;i2<oHeader.alle.length;i2++){
			buffer_row = "";
			var _id = oHeader.alle[i2];
			// Header-Daten
			eintragung = oHeader[_id].Eintragung;
			buffer_row += oHeader[_id].Bezeichnung+";("+[columns[i1]]+");;Art :;"+eintragung+";\n"+oHeader[_id].Datum+";%0A";
			if (eintragung == "Rohpunkte"){
				buffer_row += ";;Kat. 1;Kat. 2;Kat. 3;Kat. 4;Gesamt;Prozent;Note;%0A";
				for (var v in oHeader[_id].Verteilungen){
					buffer_row += "Verteilung: "+oHeader[_id].Verteilungen[v]+";;"+oHeader[_id][oHeader[_id].Verteilungen[v]].Kat1+";"+oHeader[_id][oHeader[_id].Verteilungen[v]].Kat2+";"+oHeader[_id][oHeader[_id].Verteilungen[v]].Kat3+";"+oHeader[_id][oHeader[_id].Verteilungen[v]].Kat4+";"+oHeader[_id][oHeader[_id].Verteilungen[v]].Gesamt+";-;-;%0A";
				}
			}else if (eintragung == "Punkte") {
				var maxPts = oHeader[_id].Standard.Gesamt;
				buffer_row += ";;Max.;"+maxPts+";;Punkte;Note;;;%0A";
			}else{
				buffer_row += ";;Note;;;;;;;%0A";
			}
			buffer_row += "%0A";
			// Schüler-Daten
			for (i_outer = 0; i_outer < results.rows.length; i_outer++) {
				row = results.rows.item(i_outer);
				if (row.id){
					tempO = JSON.parse(decodeURIComponent(row[columns[i]]))[_id] || {};
					if (eintragung=="Noten"){
						Leistung = tempO.Note || "-";
						buffer_row += row.nName+", "+row.vName+";;"+Leistung+";;;;;;;%0A";
					}else if (eintragung=="Punkte"){
						Leistung = (tempO.Mitschreiber == "true") ? ";;;"+tempO.Gesamt+";"+tempO.Note+";;;" : ";;;-;-;;;";
						buffer_row += row.nName+", "+row.vName+";;"+Leistung+";%0A";                                    	
					}else{
						Leistung = (tempO.Mitschreiber == "true") ? tempO.Kat1+";"+tempO.Kat2+";"+tempO.Kat3+";"+tempO.Kat4+";"+tempO.Gesamt+";"+tempO.Prozent.replace(".",",")+";"+tempO.Note+";"+tempO.Verteilung : "-;-;-;-;-;-;-;-";
						buffer_row += row.nName+", "+row.vName+";;"+Leistung+";%0A";
					}
				}
			}
			buffer += "%0A%0A%0A"+buffer_row;
		}
		
	}
	// download stuff
	// - Datei Download
	var link = document.getElementById('export_to_csv');
	var fileName = "export.csv";
	if (true) {
	//if(link.download !== undefined) { // feature detection
		// Browsers that support HTML5 download attribute
		// Replace NewLine Zeichen
		buffer = buffer.replace(/%0A/g,"\n");
		var blob = new Blob([buffer], {
			"type": "text/csv;charset=utf8;"			
		});
		link.setAttribute("href", window.URL.createObjectURL(blob));
		link.setAttribute("download", fileName);
	} else {
		// Weiterleitung mit GET-Übergabe
		link.setAttribute("href", link.getAttribute('href')+"?csv="+escape(buffer));
	}
}