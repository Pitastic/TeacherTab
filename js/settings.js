$(document).ready(function() {
	// Load Settings
	readDB_id(settingDetails, 0);
	touchListener(['header', 'footer', 'fadeBlack']);
    closeListener();
	klasse = sessionStorage.getItem('klasse');
});

function settingDetails(results){
    var i, row = results.rows.item(0);
    var settings = JSON.parse(decodeURIComponent(row.sex)) || {};

    //-- Notenverteilung
    var vertNoten = JSON.parse(decodeURIComponent(row.vName)) || {1:95,2:80,3:75,4:50,5:25,6:0};
    var inputs = document.getElementById('form_Notenverteilung').getElementsByTagName('input');
    for (i = 0; i < inputs.length; i++) {
        if (i+1 == 6) {
            inputs[i].value = 0;
        }else{
            inputs[i].value = vertNoten[(i+1)];
        }
    }
    //-- Kompetenz Namen
    var kompNamen = JSON.parse(decodeURIComponent(row.nName)) || {};
    var inputs = document.getElementById('form_KompNamen').getElementsByTagName('input');
    for (i = 0; i < inputs.length; i++) {
        inputs[i].value = kompNamen["Kat"+(i+1)] || "";
    }
    //-- Gewichtung
    var Gewichtung = JSON.parse(decodeURIComponent(row.gesamt)) || {"mündlich ":0.6, "davon fachspezifisch ":0.2, "schriftlich ":0.4,};
    i = 0;
    labels = document.getElementById('form_Gewichtung').getElementsByTagName('label');
    inputs = document.getElementById('form_Gewichtung').getElementsByTagName('input');
    for (e in Gewichtung){
        labels[i].childNodes[0].textContent = e+" ";
        inputs[i].value = Gewichtung[e]*100;
        i++;
    }
    //-- Fachspezifische Einstellungen
    document.form_fspz.differenziert.checked = settings.fspzDiff;
    //-- Schülerliste
    document.form_sex.stud_Sort.checked = settings.studSort;
    var a_button = document.getElementById('alle_gruppieren').getElementsByTagName('a')[0];
    a_button.addEventListener('click', function(){
    		document.getElementById('Abbrechen').innerHTML = "Abbrechen";
    		document.getElementById('Save').onclick = function(){
    			// Gruppierung speichern
    			if (saveGruppen()){
    				setTimeout(function(){
		    			window.location = "uebersicht.htm";
				    },750);
    			}
    			document.getElementById('item1setting_gruppen').classList.remove('show');
    			};
			document.getElementById('item1setting').classList.remove('show');
            popUp('item1setting_info');
    		readDB(gruppierenListe, false);
    	})
    //-- Vorjahresnoten
    document.form_vorjahr.setVorjahr.checked = settings.showVorjahr;
    // Füllen
    document.getElementById('item1setting').classList.add('show');
}

function gruppierenListe(results){
	var r, c, len = results.rows.length;
	var liste = document.getElementById('gruppierenListe');
	ul = document.createElement('ul');
	for (var i=0; i<len; i++){
		row = results.rows.item(i);
		r = document.createElement('li');
			if (row.sex && row.sex !== "-" && row.sex !== "null"){
				c = document.createElement('div');
					c.className = "s_flag";
					c.innerHTML = row.sex;
					r.appendChild(c);
			}
			r.setAttribute('data-rowid', row.id);
			c = document.createElement('div');
				c.className = "name";
				c.innerHTML = row.nName+', '+row.vName;
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
        var filter = klasse.substring(1,klasse.length-1);
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
	var gruppe = document.getElementById("gruppierer").value;
	var liste = document.getElementsByClassName("selected");
	var student, i;
	for (i=0;i<liste.length;i++){
		student = liste[i].getAttribute("data-rowid");
		updateDB("sex",gruppe,student);
	}
	return true
}

function SettingsSave(bol_save){
    var content = document.getElementById('listSetting');
    var inputs, i;
    var storeVert = {}; var storeKatN = {}; var storeSettings = {}; var Gewichtung;
    if (bol_save){
        // -- Gewichtung
        inputs = document.getElementById('form_Gewichtung').getElementsByTagName('input');
        Gewichtung = {
            "mündlich" : inputs[0].value/100,
            "davon fachspezifisch" : inputs[1].value/100,
            "schriftlich" : inputs[2].value/100,
        };
        // -- Notenverteilung
        inputs = document.getElementById('form_Notenverteilung').getElementsByTagName('input');
        for (i=0;i<inputs.length;i++){
            storeVert[(i+1)] = inputs[i].value;
        }
        // -- Kompetenz-Namen
        inputs = document.getElementById('form_KompNamen').getElementsByTagName('input');
        for (i=0;i<inputs.length;i++){
            storeKatN["Kat"+(i+1)] = inputs[i].value || "Kategorie "+(i+1);
        }
        storeKatN.Gesamt = "Gesamt";
        // -- Sonstige Settings   
        // -- -- Fachspezifisches
        storeSettings.fspzDiff = document.form_fspz.differenziert.checked;
        // -- -- Sortierung nach Gruppen
		storeSettings.studSort = document.form_sex.stud_Sort.checked;
        // -- -- Vorjahresnoten
        storeSettings.showVorjahr = document.form_vorjahr.setVorjahr.checked;
        
        // SessionStorage save
        sessionStorage.setItem('set_fspzDiff', storeSettings.fspzDiff);
		sessionStorage.setItem("set_studSort", storeSettings.studSort);
        sessionStorage.setItem("set_showVorjahr", storeSettings.showVorjahr);
        sessionStorage.setItem('gew_mndl', Gewichtung["mündlich"]);
        sessionStorage.setItem('gew_fspz', Gewichtung["davon fachspezifisch"]);
        sessionStorage.setItem('gew_schr', Gewichtung["schriftlich"]);
        // SQL save
        updateDB("gesamt", JSON.stringify(Gewichtung), 0);
        updateDB("vName", JSON.stringify(storeVert), 0);
        updateDB("nName", JSON.stringify(storeKatN), 0);
        updateDB("sex", JSON.stringify(storeSettings), 0);
    }
    readSettings();

    document.getElementById('item1setting').classList.remove('show');
    setTimeout(function(){
        window.location = 'uebersicht.htm';
    },750);
}