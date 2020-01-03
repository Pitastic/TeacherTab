"use strict";
// esLint Globals:
/* global $ SETTINGS GLOBALS SHIMindexedDB
datum uniqueClassID compareKlassen change_buttons closeListener formLeistung slide1 handleDeleteLeistung fspz_Bezeichnung compareStudents popUp popUpClose updateNoten sum timestamp handleSchnitt RohpunkteAlsNote createAccount isObject updateStatus mergeDeep formSettings addListener klassenSyncHandler klassenDeleteHandler Schuljahre initDB popUpSwitch
db_neueKlasse db_readMultiData db_readKlasse db_dropKlasse db_simpleUpdate db_dynamicUpdate db_deleteDoc db_replaceData db_readSingleData db_updateData db_readGeneric
checkAuth testCreds sync_deleteKlasse sync_pushBack sync_getKlasse sync_getAccount*/

window.addEventListener('load', function () {

	// Style and Listeners
	//addListener();
	closeListener();

	// -- Buttons
	document.getElementById('btn_Add').addEventListener('click', function () {
		var btn_OK = document.querySelector("#item0Add .button.OK");
		var heading = document.querySelector("#item0Add h3");
		btn_OK.onclick = function(){addKlasse(this)};
		heading.innerHTML = "Neue Klasse erstellen";
		popUp("item0Add");
	});

	document.getElementById('syncOpen').addEventListener('click', function () {
		klassenAuswahl(document.getElementById('klasseSelect'));
		// Öffnen mit Sync der geählten Klasse
		if (GLOBALS.klasse && GLOBALS.klasse != "-") {
			klassenSyncHandler("uebersicht.htm");
		} else {
			alert("Es wurde keine Klasse ausgewählt !");
		}
	});

	document.getElementById('btn_Delete').addEventListener('click', function () {
		klassenAuswahl(document.getElementById('klasseSelect'));
		if (window.confirm('Bist du sicher, dass du die gesamte Klasse:\n\n' + GLOBALS.klassenbezeichnung + ' (id: ' + GLOBALS.klasse.substring(0, 6) + ')\n\nlöschen möchtest ?')) {
			klassenDeleteHandler(GLOBALS.klasse);
		}
	});

	document.getElementById('export').addEventListener('click', function () {
		klassenAuswahl(document.getElementById('klasseSelect'));
		if (GLOBALS.klasse && GLOBALS.klasse != "-") {
			popUp("item0Export");
		} else {
			alert("Es wurde keine Klasse ausgewählt !");
		}
	});

	document.getElementById('import').addEventListener('click', function () {
		if (GLOBALS.AUTH) {
			popUp("item0Import");
		} else {
			alert("Dein Account ist nicht für den Import auf den Server berechtigt.");
		}
	});

	document.getElementById('closeSync').addEventListener('click', function () {
		// ( Zurücksetzen der ProgressBar )
		var syncStatus = document.getElementById('syncStatus');
		syncStatus.classList.remove('ok');
		syncStatus.classList.remove('error');
		syncStatus.style.width = "0";
		document.getElementById('syncText').innerHTML = "Synchronisiere";
		document.getElementById('syncInnerText').innerHTML = "";
		var buttons = document.getElementById('item0Sync').getElementsByClassName('button');
		for (var i = 0; i < buttons.length; i++) {
			buttons[i].classList.add('hide');
		}
	});


	// Setting up...
	document.getElementById("indexKlassen").getElementsByTagName("span")[1].innerHTML = "Version: " + GLOBALS.appversion;
	// -- format neue Klasse Eingabe
	Schuljahre();

	// -- reset Vars und erste View festlegen
	sessionStorage.removeItem('leistung');
	sessionStorage.removeItem('klasse');
	sessionStorage.setItem('lastview', 'item0');

	// Action bei knownDevice
	if (GLOBALS.knownDevice) {

		// -- Init DB
		initDB(function () {

			// -- Liste aller Klassen
			// --> Get Local-Account - Get Sync-Account - Merge - Push back - List
			db_readGeneric(function (localAccount) {
				sync_getAccount(listIdx_Select, localAccount);
			}, 1, "account");

		});

		// -- Set Allgemeine Einstellungen PopUp
		document.getElementById('userID').value = GLOBALS.userID;

	} else {
		GLOBALS.userID = 'Nobody';
		GLOBALS.passW = '-';
		if (!GLOBALS['deferredPrompt']){ popUp('item0First'); }
	}

	// Install-Prompt
	window.addEventListener('beforeinstallprompt', function (e) {
		// Prevent Chrome 67 and earlier from automatically showing the prompt
		console.log("SW: Verzögere das Install-Prompt");
		e.preventDefault();
		GLOBALS['deferredPrompt'] = e;
		var old_pop = document.querySelector('#item0First div form');
		popUpSwitch(old_pop, 'item0Install');
	});

});

// =================================================== //
// ================== Setup ========================== //
// =================================================== //

function addToHomeScreen(thisElement) {

	// Show the prompt, hide the pop
	GLOBALS['deferredPrompt'].prompt();
	popUpClose(thisElement, false, true);

	// Wait for the user to respond to the prompt
	GLOBALS['deferredPrompt'].userChoice
		.then(function (choiceResult) {
			if (choiceResult.outcome === 'accepted') {
				console.log('SW: Prompt accepted');
			} else {
				console.log('SW: Prompt not accepted');
			}
			GLOBALS['deferredPrompt'] = null;
			window.location.reload();
		})
		.catch(function (err) {
			console.log("SW:", err);
			setTimeout(function () {
				window.location.reload();
			}, 3000);
		});

}



function settingsAllgemein() {
	GLOBALS.userID = document.getElementById('userID').value || "Niemand";
	GLOBALS.passW = document.getElementById('passW').value || "false";

	// reset Error Msg
	var errorMsg = document.querySelector("#item0First .msg.error");
	errorMsg.classList.add("hide");
	errorMsg.innerHTML = "";
	
	// Check Credentials wenn Password gegeben
	testCreds(setAuth);

	return;
}

function setAuth(status) {
	var errorMsg;
	if (status != "200" && status != "ok") {
		document.getElementById('passW').value = "";

		// - DOM Manipulation: Meldung !
		// -- unterscheiden ob Daten oder Verbinungsproblem
		var msg = "Fehler beim Anmelden (" + status + ")";
		if (status == "401" || status == "403") {
			// erneut nach PW fragen
			localStorage.removeItem('TeacherTab');
			localStorage.setItem('auth', false);
			localStorage.setItem('passW', GLOBALS.passW);
			msg += ":<br>Emailadresse oder Passwort sind falsch !";

		} else if (status == "400" || status == "0") {
			msg += ":<br>Der Server ist nicht erreichbar oder ignoriert deine Anfrage. Bist du online ?";
		} else if (status == "423") {
			msg += ":<br>Die Anmeldung wird aus Sicherheitsgründen für 2 Minuten gesperrt !";
		} else if (status == "500") {
			msg += ":<br>Uuups ! Auf dem Server ist etwas schiefgegangen. Probier es bitte nochmal...";
		}
		errorMsg = document.querySelector("#item0First .msg.error");
		errorMsg.innerHTML = msg;
		errorMsg.classList.remove("hide");
		checkAuth();

	} else {
		// ggf. vorherige Meldungen löschen
		errorMsg = document.querySelector("#item0First .msg.error");
		errorMsg.innerHTML = "";
		// OK: Speichern und neu laden
		localStorage.setItem('userID', GLOBALS.userID);
		localStorage.setItem('passW', GLOBALS.passW);
		localStorage.setItem('auth', true);
		localStorage.setItem('TeacherTab', true);
		var thisElement = document.querySelector("#item0First .OK");
		popUpClose(thisElement);
		checkAuth();
		setTimeout(function () {
			window.location.reload();
		}, 550);
	}
	return;
}


// =================================================== //
// ================== Listings ======================= //
// =================================================== //

function listIdx_Select(account) {
	//DEVconsole.log(account);
	var result = account.klassenliste;
	var sel = document.getElementById("klasseSelect");
	var clone = sel.cloneNode(true);
	clone.innerHTML = '';
	var optCount = 0;
	var opt;

	opt = new Option("- bitte wählen -");
	opt.value = "-";
	clone.appendChild(opt);

	if (result) {
		// sort Keys
		var keylist = [];
		for (var key in result) {
			keylist.push([key, result[key]]);
		}
		keylist.sort(compareKlassen);
		// Schleife durch Optionen
		for (var i = 0; i < keylist.length; i++) {
			// nur bei Pro alle sonst nur lokale Klassen anzeigen
			var hash = keylist[i][0];
			if (GLOBALS.PRO || account.local.indexOf(hash) !== -1) {
				var bezeichnung = result[hash].bezeichnung;
				//var bezeichnung = (account.local.indexOf(hash) === -1) ? "# "+result[hash].bezeichnung : result[hash].bezeichnung;
				opt = new Option(bezeichnung);
				opt.value = hash;
				clone.appendChild(opt);
				optCount += 1;
			}
		}
	}

	sel.parentNode.replaceChild(clone, sel);
	document.getElementById("indexKlassen").getElementsByTagName("span")[0].innerHTML = "Insgesamt " + optCount + " Klassen in deinem Account";
}


function klassenAuswahl(selectbox) {
	var klasseSelect = selectbox;
	if (klasseSelect.value !== "null" && klasseSelect.value !== "") {
		GLOBALS.klasse = klasseSelect.value;
		GLOBALS.klassenbezeichnung = klasseSelect.selectedOptions[0].innerHTML;
		sessionStorage.setItem('klasse', GLOBALS.klasse);
		sessionStorage.setItem('klassenbezeichnung', GLOBALS.klassenbezeichnung);
	} else {
		alert('Es wurde keine Klasse ausgewählt !');
	}
}

// =================================================== //
// ================== Addings ======================== //
// =================================================== //

function addKlasse(thisElement, baseObj) {
	// Get Klassendaten
	var nameKlasse = document.getElementById('nameKlasse');
	var jahrKlasse = document.getElementById('jahrKlasse');
	var fachKlasse = document.getElementById('fachKlasse');
	if (nameKlasse.value && nameKlasse.value != "") {
		var newKlasse =
			jahrKlasse.value + ' - ' + // Schuljahr
			fachKlasse.value + ' ' + // Fach
			nameKlasse.value;  // Name
		var newId = uniqueClassID(newKlasse);
		sessionStorage.setItem('klasse', newId);

		if (baseObj) {
			// IDs in Kopie anpassen
			baseObj[0].klasse = newId;
			baseObj[0].name = newKlasse;
		}

		db_neueKlasse(function () {
			updateStatus(100, "Erfolgreich erstellt !", "Klasse wird angelegt...");
			popUpSwitch(thisElement, "item0Sync");
			setTimeout(function(){
				if (baseObj) {
					window.location = "uebersicht.htm";
				}else{
					window.location = "settings.htm";
				}
			}, 1500)
		}, newId, newKlasse, baseObj);

	} else {
		alert('Klassenname ungültig.');
	}
}

function copyKlasse(thisElement) {
	// Get toCopy
	db_readKlasse(function(toCopy){
		var baseObj = []
		// Form baseObj
		for (var id in toCopy[1]){
			var entry = toCopy[1][id]
			if (entry['typ'] == "student") {
				// nur Grunddaten von Schülern
				var student = formStudent('', '', '');
				student['name'] = entry['name'];
				baseObj.push(student);
				// decrement BatchID
				GLOBALS.dbToGo += 1;
			}else if (entry['typ'] == "settings") {
				// Settings übernehmen
				baseObj.push(entry);
			}
		}
		// Create Obj
		addKlasse(thisElement, baseObj);
	}, GLOBALS['klasse'])
}


// DEPRECATED (noch SQL - als Anhalt für später behalten)
/*
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
*/
