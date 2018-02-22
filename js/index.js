$(document).ready(function() {

	// Style and Listeners
	addListener();
	closeListener();
	touchListener(['header', 'footer', 'fadeBlack', 'MenuMain']);

	// -- Buttons
	document.getElementById('syncOpen').addEventListener('click', function(){
		// Öffnen mit Sync der geählten Klasse
		klassenAuswahl(document.getElementById('klasseSelect'));
		if (klasse && klasse != "-") {
			db_readKlasse(function(klassenObject){
				sync_getKlasse(function(mergedKlasse) {
					console.log("Finished :", mergedKlasse);
				}, klassenObject);
			});
		}else{
			alert("Es wurde keine Klasse ausgewählt !");
		}
		/*
		// ohne Sync:
		initSyncSQL();
		*/
	});

	document.getElementById('btn_Delete').addEventListener('click', function(){
		if (window.confirm('Bist du sicher, dass du die gesamte Klasse:\n"'+klassenbezeichnung+'" ('+klasse+')\nlöschen möchtest ?')){
			var _element = document.getElementById('syncStatus');
			var _elementTxt = document.getElementById('syncText');
			_elementTxt.innerHTML = "Lösche Klasse";
			popUp("item0Sync");
			setTimeout(function() {
				_elementTxt.innerHTML = "Lösche Klasse von diesem Gerät !";
				_element.style.width = "100%";
				db_dropKlasse(klasse, function(){
					setTimeout(function(){
							sync_deleteKlasse(klasse);
							_element.classList.add('ok');
							_element.innerHTML = "Fertig !";
							document.getElementById('item0Sync').getElementsByClassName('button')[1].classList.remove('hide');
						},1000);
					}, 600);
				}
			);
		}
	});

	document.getElementById('export').addEventListener('click', function(){
		klassenAuswahl(document.getElementById('klasseSelect'));
		/* DEV: Kein Sync, kein Export !
		export_to_csv(klasse);
		document.getElementById("export_to_pdf").href = "http://www.teachertab.de/WebApp/export-PDF.htm?klasse="+klasse+"&SyncServer="+SyncServer+"&userID="+userID;
		*/
		document.getElementById("export_to_html").addEventListener('click', function(e){
			testSync();
		})
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
		initDB(function(){

			// -- Liste aller Klassen
			// --> Get Local-Account - Get Sync-Account - Merge - Push back - List
			db_readGeneric(function(localAccount){
				sync_getAccount(listIdx_Select, localAccount);
			}, 1, "account");
			
		});


		// -- Set Allgemeine Einstellungen PopUp
		document.getElementById('userID').value = userID;
	}else{
		userID = 'Nobody';
		passW = '-';
		popUp('item0First');
	}
});


// =================================================== //
// ================== Setup ========================== //
// =================================================== //

function settingsAllgemein(){
	localStorage.setItem('TeacherTab', true);
	userID = document.getElementById('userID').value || "AppArchiv";
	localStorage.setItem('userID', userID);
	passW = document.getElementById('passW').value || false;
	// Check Credentials wenn Password gegeben
	if (passW) {
		testCreds(setAuth, passW);
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
		var msg = "unbekannter Fehler beim Anmelden";
		if (status == "401") {
			msg += ": Die Zugangsdaten sind entweder falsch oder nicht (mehr) für diese Funktion berechtigt !";
		}else if (status == "400" || status == "0") {
			msg = ": Der Server ist nicht erreichbar. Bist du online ?";
		}
		var errorMsg = document.querySelector("#item0First .msg.error");
		errorMsg.innerHTML = msg;
		errorMsg.classList.remove("hide");

	}else{
		// OK: Speichern und neu laden
		localStorage.setItem('passW', passW);
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
			var bezeichnung = (account.local.indexOf(hash) === -1) ? "# "+result[hash].bezeichnung : result[hash].bezeichnung;
			opt = new Option(bezeichnung);
			opt.value = hash;
			clone.appendChild(opt);
			optCount += 1;
		}
	}

	sel.parentNode.replaceChild(clone,sel);
}


function klassenAuswahl(selectbox){
	var klasseSelect = selectbox;
	if (klasseSelect.value !== "null" && klasseSelect.value !== "") {
		sessionStorage.setItem('klasse', klasseSelect.value);
		klasse = klasseSelect.value;
		klassenbezeichnung = klasseSelect.selectedOptions[0].innerHTML;
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

function testSync() {
	sync_getKlassen(function(r){
		console.log("Sync durchgeführt...");
		console.log(r);
	})
}