$(document).ready(function() {

	// Style and Listeners
	addListener();
	closeListener();
	touchListener(['header', 'footer', 'fadeBlack', 'MenuMain']);

	// -- Buttons
	document.getElementById('syncOpen').addEventListener('click', function(){
		klassenAuswahl(document.getElementById('klasseSelect'));
		// Öffnen mit Sync der geählten Klasse
		if (GLOBALS.klasse && GLOBALS.klasse != "-") {
			klassenSyncHandler("uebersicht.htm");
		}else{
			alert("Es wurde keine Klasse ausgewählt !");
		}
	});

	document.getElementById('btn_Delete').addEventListener('click', function(){
		klassenAuswahl(document.getElementById('klasseSelect'));
		if (window.confirm('Bist du sicher, dass du die gesamte Klasse:\n\n'+GLOBALS.klassenbezeichnung+' (id: ' + GLOBALS.klasse.substring(0,6) + ')\n\nlöschen möchtest ?')){
			klassenDeleteHandler(GLOBALS.klasse);
		}
	});

	document.getElementById('export').addEventListener('click', function(){
		klassenAuswahl(document.getElementById('klasseSelect'));
		/* DEV: Kein Sync, kein Export !
		export_to_csv(klasse);
		document.getElementById("export_to_pdf").href = "http://www.teachertab.de/WebApp/export-PDF.htm?klasse="+GLOBALS.klasse+"&SyncServer="+GLOBALS.SyncServer+"&userID="+GLOBALS.userID;
		document.getElementById("export_to_html").addEventListener('click', function(e){
			testSync();
		})
		popUp('item0Export');
		*/
		alert("Die Exportfunktion ist noch nicht implementiert !");
	});

	document.getElementById('closeSync').addEventListener('click', function(){
		// ( Zurücksetzen der ProgressBar )
		var syncStatus = document.getElementById('syncStatus');
		syncStatus.classList.remove('ok');
		syncStatus.classList.remove('error');
		syncStatus.style.width = "0";
		document.getElementById('syncText').innerHTML = "Synchronisiere";
		document.getElementById('syncInnerText').innerHTML = "";
		var buttons = document.getElementById('item0Sync').getElementsByClassName('button');
		for (var i=0; i<buttons.length; i++){
			buttons[i].classList.add('hide');
		}
	});

	// -- Extras für Smartphone-Nutzer
	if (GLOBALS.isPhone){change_buttons();}


	// Setting up...
	document.getElementById("indexKlassen").getElementsByTagName("span")[1].innerHTML = "Version: "+GLOBALS.appversion;
	// -- format neue Klasse Eingabe
	Schuljahre();

	// -- reset Vars und erste View festlegen
	sessionStorage.removeItem('leistung');
	sessionStorage.removeItem('klasse');
	sessionStorage.setItem('lastview', 'item1');

	// Action bei knownDevice
	if (GLOBALS.knownDevice) {

		// -- Init DB
		initDB(function(){

			// -- Liste aller Klassen
			// --> Get Local-Account - Get Sync-Account - Merge - Push back - List
			db_readGeneric(function(localAccount){
				sync_getAccount(listIdx_Select, localAccount);
			}, 1, "account");
			
		});

		// -- Set Allgemeine Einstellungen PopUp
		document.getElementById('userID').value = GLOBALS.userID;

	}else{
		GLOBALS.userID = 'Nobody';
		GLOBALS.passW = '-';
		popUp('item0First');
	}
});


// =================================================== //
// ================== Setup ========================== //
// =================================================== //

function settingsAllgemein(){
	localStorage.setItem('TeacherTab', true);
	GLOBALS.userID = document.getElementById('userID').value || "AppArchiv";
	localStorage.setItem('userID', GLOBALS.userID);
	GLOBALS.passW = document.getElementById('passW').value || false;
	// Check Credentials wenn Password gegeben
	if (GLOBALS.passW) {
		testCreds(setAuth, GLOBALS.passW);
	}else{
		localStorage.setItem('auth', false);
		localStorage.setItem('passW', false);
		var thisElement = document.querySelector("#item0First .OK");
		popUpClose(thisElement);
		setTimeout(function() {
			window.location.reload();
		},550);
	}
	return;
}

function setAuth(status) {
	if (status != "200" && status != "ok") {
		// erneut nach PW fragen
		localStorage.setItem('auth', false);
		document.getElementById('passW').value = "";

		// - DOM Manipulation: Meldung !
		// -- unterscheiden ob Daten oder Verbinungsproblem
		var msg = "Fehler beim Anmelden";
		if (status == "401" || status == "403") {
			msg += ":<br>Die Zugangsdaten sind entweder falsch oder nicht (mehr) für diese Funktion berechtigt !";
		}else if (status == "400" || status == "0") {
			msg = ":<br>Der Server ist nicht erreichbar. Bist du online ?";
		}
		var errorMsg = document.querySelector("#item0First .msg.error");
		errorMsg.innerHTML = msg;
		errorMsg.classList.remove("hide");

	}else{
		// ggf. vorherige Meldungen löschen
		var errorMsg = document.querySelector("#item0First .msg.error");
		errorMsg.innerHTML = "";
		// OK: Speichern und neu laden
		localStorage.setItem('passW', GLOBALS.passW);
		localStorage.setItem('auth', true);
		var thisElement = document.querySelector("#item0First .OK");
		popUpClose(thisElement);
		setTimeout(function() {
			window.location.reload();
		},550);
	}
	checkAuth();
	return
}


// =================================================== //
// ================== Listings ======================= //
// =================================================== //

function listIdx_Select(account) {
	var options = [];
	var result = account.klassenliste;
	var sel = document.getElementById("klasseSelect");
	var clone = sel.cloneNode(true);
	clone.innerHTML = '';
	var optCount = 0;
	var temp_arr = [];
	var opt;

	opt = new Option("- bitte wählen -");
	opt.value = "-";
	clone.appendChild(opt);

	if (result) {
		// sort Keys
		var keylist = [];
		for (var hash in result) {
			keylist.push([hash, result[hash]]);
		}
		keylist.sort(compareKlassen);
		// Schleife durch Optionen
		for (var i = 0; i < keylist.length; i++) {
			var hash = keylist[i][0];
			var bezeichnung = result[hash].bezeichnung;
			//var bezeichnung = (account.local.indexOf(hash) === -1) ? "# "+result[hash].bezeichnung : result[hash].bezeichnung;
			opt = new Option(bezeichnung);
			opt.value = hash;
			clone.appendChild(opt);
			optCount += 1;
		}
	}

	sel.parentNode.replaceChild(clone,sel);
	document.getElementById("indexKlassen").getElementsByTagName("span")[0].innerHTML = "Insgesamt " + optCount + " Klassen in deinem Account";
}


function klassenAuswahl(selectbox){
	var klasseSelect = selectbox;
	if (klasseSelect.value !== "null" && klasseSelect.value !== "") {
		sessionStorage.setItem('klasse', klasseSelect.value);
		GLOBALS.klasse = klasseSelect.value;
		GLOBALS.klassenbezeichnung = klasseSelect.selectedOptions[0].innerHTML;
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
		var newId = hashData(newKlasse+timestamp());
		sessionStorage.setItem('klasse', newId);
		db_neueKlasse(function(){
			window.location = "settings.htm";
		}, newId, newKlasse);
		document.getElementById('item0').classList.remove('show');
		popUpClose(thisElement);
	}else{
		alert('Klassenname ungültig.');
	}
}

// DEPRECATED (noch SQL)
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

// DEPRECATED
function copyKlasse_pop (thisElement) {
	setTimeout(function(){
		popUp('item0Copy');
	},1000);
	popUpClose(thisElement);
}
