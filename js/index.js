$(document).ready(function() {

	// Style and Listeners
	addListener();
	closeListener();
	touchListener(['header', 'footer', 'fadeBlack', 'MenuMain']);

	// -- Buttons
	document.getElementById('syncOpen').addEventListener('click', function(){
		// >>>>>>>> DEV: Bisher direktes Öffnen ohne Sync und Dialog
		klassenAuswahl(document.getElementById('klasseSelect'));
		initSyncSQL();
		//db_listKlassen(listIdx_Select);
		// <<<<<<<< DEV <
	});
	document.getElementById('btn_Delete').addEventListener('click', function(){
		if (window.confirm('Bist du sicher, dass du die gesamte Klasse:\n"'+klasse+'"\nlöschen möchtest ?')){
			deleteKlasse(klasse);
		}
	});
	document.getElementById('export').addEventListener('click', function(){
		klassenAuswahl(document.getElementById('klasseSelect'));
		/* DEV: Kein Sync, kein Export !
		export_to_csv(klasse);
		document.getElementById("export_to_pdf").href = "http://www.teachertab.de/WebApp/export-PDF.htm?klasse="+klasse+"&serverIP="+serverIP+"&userID="+userID;
		document.getElementById("export_to_html").href = "http://www.teachertab.de/WebApp/export-HTML.htm?klasse="+klasse+"&serverIP="+serverIP+"&userID="+userID;
		*/
		popUp('item0Export');
	});
	document.getElementById('closeSync').addEventListener('click', function(){
		// ( Zurücksetzen der ProgressBar )
		var syncStatus = document.getElementById('syncStatus');
		syncStatus.classList.remove('ok');
		syncStatus.classList.remove('error');
		syncStatus.innerHTML = "";
		syncStatus.style.width = "0";
		document.getElementById('syncText').innerHTML = "Synchronisiere";
		var buttons = document.getElementById('item0Sync').getElementsByClassName('button');
		for (var i=0; i<buttons.length; i++){
			buttons[i].classList.add('hide');
		}
	});

	// -- Extras für Smartphone-Nutzer
	if (isPhone){
		buttons = {
			"btn_Add" : "&#65291;",
			"btn_Delete" : "&#10006;",
			"export" : "&#9650;",
		}
		change_buttons(buttons);
	}


	// Setting up...
	// -- format neue Klasse Eingabe
	Schuljahre();
	var nameKlasse = document.getElementById('nameKlasse');
	nameKlasse.addEventListener('keyup', function(){
		nameKlasse.value = nameKlasse.value.replace(/\s+/g, '');
	});
	// -- reset Vars
	sessionStorage.removeItem('leistung');
	sessionStorage.removeItem('klasse');
	// -- ersten View festlegen
	sessionStorage.setItem('lastview', 'item1');

	// Action bei knownDevice
	if (knownDevice) {
		// -- Init DB
		initDB();
		// -- Liste aller Klassen
		db_listKlassen(listIdx_Select);
		// -- Set Allgemeine Einstellungen PopUp
		document.getElementById('userID').value = userID;
		document.getElementById('serverIP').value = serverIP;
	}else{
		userID = 'Nobody';
		popUp('item0First');
	}
});


// =================================================== //
// ================== Setup ========================== //
// =================================================== //

function settingsAllgemein(thisElement){
	serverIP = document.getElementById('serverIP').value + "/cgi-bin/sync";
	userID = document.getElementById('userID').value || "AppArchiv";
	if (serverIP){
		localStorage.setItem('serverIP', serverIP)
	}else if (localStorage.getItem('serverIP')){
		localStorage.removeItem('serverIP');
	};
	localStorage.setItem('userID', userID);
	localStorage.setItem('TeacherTab', true);
	popUpClose(thisElement);
	setTimeout(function() {
		window.location.reload();
	},550);
}


// =================================================== //
// ================== Listings ======================= //
// =================================================== //

function listIdx_Select(result) {
	options = [];
	var sel = document.getElementById("klasseSelect");
	var clone = sel.cloneNode(true);
	clone.innerHTML = '';
	var optCount = 0;
	var temp_arr = [];
	var opt;

	opt = new Option("- bitte wählen -");
	clone.appendChild(opt);

	for (var i = 0; i < result.length; i++) {
		if (result[i] != "account") {
			opt = new Option(result[i]);
			opt.value = result[i];
			clone.appendChild(opt);
			optCount += 1;
			temp_arr.push(result[i]);
		}
	}

	sel.parentNode.replaceChild(clone,sel);

	/* -- Kommt auf Sync-Methode an...
	if (!light){
		document.getElementById('indexKlassen').getElementsByTagName('span')[0].innerHTML = 'Insgesamt '+optCount+' Klassen gespeichert';
		// if online - showArchiv und ergaenze fehlende Einträge
		if (navigator.onLine){
			showArchiv(temp_arr,clone);
		}
	}
	*/
}


function klassenAuswahl(selectbox){
	var klasseSelect = selectbox.value;
	if (klasseSelect !== "null" && klasseSelect !== "") {
		sessionStorage.setItem('klasse', klasseSelect);
		klasse = klasseSelect;
	}else{
		alert('Es wurde keine Klasse ausgewählt !');
	}
}

// =================================================== //
// ================== Addings ======================== //
// =================================================== //

function addKlasse(thisElement) {
	var nameKlasse = document.getElementById('nameKlasse');
	var jahrKlasse = document.getElementById('jahrKlasse');
	var fachKlasse = document.getElementById('fachKlasse');
	if (nameKlasse.value && nameKlasse.value != "") {
		var newKlasse =
			jahrKlasse.value + ' - ' + // Schuljahr
			fachKlasse.value + ' ' + // Fach
			nameKlasse.value;  // Name
		sessionStorage.setItem('klasse', newKlasse);
		db_neueKlasse(newKlasse);
		document.getElementById('item0').classList.remove('show');
		popUpClose(thisElement);
		setTimeout(function() {
			window.location = "settings.htm";
		}, 560);
	}else{
		alert('Klassenname ungültig.');
	}
}

function copyKlasse(thisElement, toCopy) {
	var nameKlasse = document.getElementById('nameCopyKlasse');
	var jahrKlasse = document.getElementById('jahrCopyKlasse');
	var fachKlasse = document.getElementById('fachCopyKlasse');
	if (nameKlasse) {
		var newKlasse = '[' +
			jahrKlasse.value + ' - ' + // Schuljahr
			fachKlasse.value + ' ' + // Fach
			nameKlasse.value + // Name
			']';
		sessionStorage.setItem('klasse', newKlasse);

		if (newKlasse != toCopy){
			//createTables() aus all.js teilweise kopiert !
			db.transaction(
				function(transaction){
				transaction.executeSql(
					'CREATE TABLE IF NOT EXISTS '+newKlasse+'(id INTEGER PRIMARY KEY AUTOINCREMENT, vName TEXT, nName TEXT, sex TEXT, mndl TEXT, fspz TEXT, schr TEXT, omndl TEXT, ofspz TEXT, oschr TEXT, gesamt TEXT, Kompetenzen TEXT, changed INTEGER);', [], function(t, results){
					console.log('Table erstellt.');
				});
				}
			);
			// Leere Objekte für die ID 0
			var mndl, schr, fspz;
			mndl = schr = fspz = encodeURIComponent(JSON.stringify({'alle':[],}));
			db.transaction(
				function(transaction){
				transaction.executeSql(
					'INSERT INTO '+newKlasse+' (id,mndl,fspz,schr,changed,vName,nName,sex,gesamt) SELECT ?,?,?,?,?,vName,nName,sex,gesamt FROM '+toCopy+' WHERE id = 0', [0, mndl, fspz, schr, 0], function(t, results){
					console.log('id 0 kopiert');
				});
				}
			);
			// Leere Objekte für die Schüler
			var now = Math.round(new Date().getTime() / 1000);
			var mndl, schr, fspz, omndl, ofspz, oschr, gesamt;
			gesamt = encodeURIComponent(JSON.stringify({'rechnerisch':0, 'eingetragen': "-"}));
			mndl = schr = fspz = encodeURIComponent(JSON.stringify({'alle':[],}));
			omndl = oschr = 0;
			ofspz = encodeURIComponent(JSON.stringify({'Gesamt':0, 'Vokabeln':0, 'Grammatik':0}));
			db.transaction(
				function(transaction){
				transaction.executeSql(
					'INSERT INTO '+newKlasse+' (vName,nName,sex,mndl, fspz, schr, omndl, ofspz, oschr, gesamt, changed) SELECT vName,nName,sex,?,?,?,?,?,?,?,? FROM '+toCopy+' WHERE id != 0', [mndl, schr, fspz, omndl, ofspz, oschr, gesamt, now], function(t, results){
					console.log('andere ids kopiert');
				}, errorHandler);
				}
			);
		}else{
			alert('Klassenname existert bereits.');
		}

		document.getElementById('item0').classList.remove('show');
		popUpClose(thisElement);
		setTimeout(function() {
			window.location = "settings.htm";
		}, 1000);
	}else{
		alert('Klassenname ungültig.');
	}
}

function copyKlasse_pop (thisElement) {
	setTimeout(function(){
		popUp('item0Copy');
	},1000);
	popUpClose(thisElement);
}