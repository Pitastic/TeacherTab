$(document).ready(function() {

	// Style and Listeners
	addListener();
	closeListener();
	//touchListener(['header', 'footer', 'fadeBlack', 'MenuMain']);

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
		if (GLOBALS.klasse && GLOBALS.klasse != "-") {
			popUp("item0Export");
		}else{
			alert("Es wurde keine Klasse ausgewählt !");
		}
	});

	document.getElementById('import').addEventListener('click', function(){
		if (GLOBALS.AUTH) {
			popUp("item0Import");
		}else{
			alert("Dein Account ist nicht für den Import auf den Server berechtigt.");
		}
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
	GLOBALS.userID = document.getElementById('userID').value || "Niemand";
	localStorage.setItem('userID', GLOBALS.userID);
	GLOBALS.passW = document.getElementById('passW').value || "false";
	// Check Credentials wenn Password gegeben
	testCreds(setAuth);
	/*
	if (GLOBALS.passW) {
	}else{
		localStorage.setItem('auth', false);
		localStorage.setItem('passW', false);
		var thisElement = document.querySelector("#item0First .OK");
		popUpClose(thisElement);
		setTimeout(function() {
			window.location.reload();
		},550);
	}
	*/
	return;
}

function setAuth(status) {
	if (status != "200" && status != "ok") {
		// erneut nach PW fragen
		localStorage.removeItem('TeacherTab');
		localStorage.setItem('auth', false);
		localStorage.setItem('passW', GLOBALS.passW);
		document.getElementById('passW').value = "";

		// - DOM Manipulation: Meldung !
		// -- unterscheiden ob Daten oder Verbinungsproblem
		var msg = "Fehler beim Anmelden ("+status+")";
		if (status == "401" || status == "403") {
			msg += ":<br>Emailadresse oder Passwort sind falsch !";

		}else if (status == "400" || status == "0") {
			msg = ":<br>Der Server ist nicht erreichbar. Bist du online ?";
		}else if (status == "500") {
			msg += ":<br>Uuups ! Auf dem Server ist etwas schiefgegangen. Probier es bitte nochmal...";
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
		localStorage.setItem('TeacherTab', true);
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
	//DEVconsole.log(account);
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
	var auth_status = document.getElementById('AuthStatus')
	var text = auth_status.getElementsByClassName('statusText')[0];
	var info = auth_status.getElementsByClassName('statusInfo')[0];
	if (account.valid) {
		text.classList.add("pro");
		if (account.validDate != "2099-01-01") {
			text.innerHTML = 'PRO Account bis ' + datum(true, account.validDate);
			info.innerHTML =  '<a href="https://my.teachertab.de/home.php" title="Zu deinem Account" class="button">unbegrenzt Pro holen</a>';
		}else{
			text.innerHTML = 'PRO Account !';
			info.parentNode.removeChild(info);
		}
	}else{
		// Werbung: Square
		/*
		google_ad_client = "ca-pub-5341512616014650";
		google_ad_slot = "9424168592";
		google_ad_width = 200;
		google_ad_height = 200;
		*/
		text.innerHTML = 'Basic Account';
		text.classList.add("basic");
		info.innerHTML = '<a href="https://my.teachertab.de/home.php" title="Zu deinem Account" class="button">wechsel zu Pro !</a>'
	}
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
		var newId = uniqueClassID(newKlasse);
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



// DEPRECATED (noch SQL - als Anhalt für später behalten)
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
