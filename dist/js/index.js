"use strict";window.addEventListener("load",function(){closeListener();document.getElementById("btn_Add").addEventListener("click",function(){var btn_OK=document.querySelector("#item0Add .button.OK");var heading=document.querySelector("#item0Add h3");btn_OK.onclick=function(){addKlasse(this)};heading="Neue Klasse erstellen";popUp("item0Add")});document.getElementById("syncOpen").addEventListener("click",function(){klassenAuswahl(document.getElementById("klasseSelect"));if(GLOBALS.klasse&&GLOBALS.klasse!="-"){klassenSyncHandler("uebersicht.htm")}else{alert("Es wurde keine Klasse ausgew\xE4hlt !")}});document.getElementById("btn_Delete").addEventListener("click",function(){klassenAuswahl(document.getElementById("klasseSelect"));if(window.confirm("Bist du sicher, dass du die gesamte Klasse:\n\n"+GLOBALS.klassenbezeichnung+" (id: "+GLOBALS.klasse.substring(0,6)+")\n\nl\xF6schen m\xF6chtest ?")){klassenDeleteHandler(GLOBALS.klasse)}});document.getElementById("export").addEventListener("click",function(){klassenAuswahl(document.getElementById("klasseSelect"));if(GLOBALS.klasse&&GLOBALS.klasse!="-"){popUp("item0Export")}else{alert("Es wurde keine Klasse ausgew\xE4hlt !")}});document.getElementById("import").addEventListener("click",function(){if(GLOBALS.AUTH){popUp("item0Import")}else{alert("Dein Account ist nicht f\xFCr den Import auf den Server berechtigt.")}});document.getElementById("closeSync").addEventListener("click",function(){var syncStatus=document.getElementById("syncStatus");syncStatus.classList.remove("ok");syncStatus.classList.remove("error");syncStatus.style.width="0";document.getElementById("syncText").innerHTML="Synchronisiere";document.getElementById("syncInnerText").innerHTML="";var buttons=document.getElementById("item0Sync").getElementsByClassName("button");for(var i=0;i<buttons.length;i++){buttons[i].classList.add("hide")}});document.getElementById("indexKlassen").getElementsByTagName("span")[1].innerHTML="Version: "+GLOBALS.appversion;Schuljahre();sessionStorage.removeItem("leistung");sessionStorage.removeItem("klasse");sessionStorage.setItem("lastview","item1");if(GLOBALS.knownDevice){initDB(function(){db_readGeneric(function(localAccount){sync_getAccount(listIdx_Select,localAccount)},1,"account")});document.getElementById("userID").value=GLOBALS.userID}else{GLOBALS.userID="Nobody";GLOBALS.passW="-";if(!GLOBALS["deferredPrompt"]){popUp("item0First")}}window.addEventListener("beforeinstallprompt",function(e){console.log("SW: Verz\xF6gere das Install-Prompt");e.preventDefault();GLOBALS["deferredPrompt"]=e;var old_pop=document.querySelector("#item0First div form");popUpSwitch(old_pop,"item0Install")})});function addToHomeScreen(thisElement){GLOBALS["deferredPrompt"].prompt();popUpClose(thisElement,false,true);GLOBALS["deferredPrompt"].userChoice.then(function(choiceResult){if(choiceResult.outcome==="accepted"){console.log("SW: Prompt accepted")}else{console.log("SW: Prompt not accepted")}GLOBALS["deferredPrompt"]=null;window.location.reload()}).catch(function(err){console.log("SW:",err);setTimeout(function(){window.location.reload()},3000)})}function settingsAllgemein(){GLOBALS.userID=document.getElementById("userID").value||"Niemand";GLOBALS.passW=document.getElementById("passW").value||"false";var errorMsg=document.querySelector("#item0First .msg.error");errorMsg.classList.add("hide");errorMsg.innerHTML="";testCreds(setAuth);return}function setAuth(status){var errorMsg;if(status!="200"&&status!="ok"){document.getElementById("passW").value="";var msg="Fehler beim Anmelden ("+status+")";if(status=="401"||status=="403"){localStorage.removeItem("TeacherTab");localStorage.setItem("auth",false);localStorage.setItem("passW",GLOBALS.passW);msg+=":<br>Emailadresse oder Passwort sind falsch !"}else if(status=="400"||status=="0"){msg+=":<br>Der Server ist nicht erreichbar oder ignoriert deine Anfrage. Bist du online ?"}else if(status=="423"){msg+=":<br>Die Anmeldung wird aus Sicherheitsgr\xFCnden f\xFCr 2 Minuten gesperrt !"}else if(status=="500"){msg+=":<br>Uuups ! Auf dem Server ist etwas schiefgegangen. Probier es bitte nochmal..."}errorMsg=document.querySelector("#item0First .msg.error");errorMsg.innerHTML=msg;errorMsg.classList.remove("hide");checkAuth()}else{errorMsg=document.querySelector("#item0First .msg.error");errorMsg.innerHTML="";localStorage.setItem("userID",GLOBALS.userID);localStorage.setItem("passW",GLOBALS.passW);localStorage.setItem("auth",true);localStorage.setItem("TeacherTab",true);var thisElement=document.querySelector("#item0First .OK");popUpClose(thisElement);checkAuth();setTimeout(function(){window.location.reload()},550)}return}function listIdx_Select(account){var result=account.klassenliste;var sel=document.getElementById("klasseSelect");var clone=sel.cloneNode(true);clone.innerHTML="";var optCount=0;var opt;opt=new Option("- bitte w\xE4hlen -");opt.value="-";clone.appendChild(opt);if(result){var keylist=[];for(var key in result){keylist.push([key,result[key]])}keylist.sort(compareKlassen);for(var i=0;i<keylist.length;i++){var hash=keylist[i][0];if(GLOBALS.PRO||account.local.indexOf(hash)!==-1){var bezeichnung=result[hash].bezeichnung;opt=new Option(bezeichnung);opt.value=hash;clone.appendChild(opt);optCount+=1}}}sel.parentNode.replaceChild(clone,sel);document.getElementById("indexKlassen").getElementsByTagName("span")[0].innerHTML="Insgesamt "+optCount+" Klassen in deinem Account"}function klassenAuswahl(selectbox){var klasseSelect=selectbox;if(klasseSelect.value!=="null"&&klasseSelect.value!==""){GLOBALS.klasse=klasseSelect.value;GLOBALS.klassenbezeichnung=klasseSelect.selectedOptions[0].innerHTML;sessionStorage.setItem("klasse",GLOBALS.klasse);sessionStorage.setItem("klassenbezeichnung",GLOBALS.klassenbezeichnung)}else{alert("Es wurde keine Klasse ausgew\xE4hlt !")}}function addKlasse(thisElement,baseObj){var nameKlasse=document.getElementById("nameKlasse");var jahrKlasse=document.getElementById("jahrKlasse");var fachKlasse=document.getElementById("fachKlasse");if(nameKlasse.value&&nameKlasse.value!=""){var newKlasse=jahrKlasse.value+" - "+fachKlasse.value+" "+nameKlasse.value;var newId=uniqueClassID(newKlasse);sessionStorage.setItem("klasse",newId);if(baseObj){baseObj[0].klasse=newId;baseObj[0].name=newKlasse}db_neueKlasse(function(){updateStatus(100,"Erfolgreich erstellt !","Klasse wird angelegt...");popUpSwitch(thisElement,"item0Sync");setTimeout(function(){if(baseObj){window.location="uebersicht.htm"}else{window.location="settings.htm"}},1500)},newId,newKlasse,baseObj)}else{alert("Klassenname ung\xFCltig.")}}function copyKlasse(thisElement){db_readKlasse(function(toCopy){var baseObj=[];for(var id in toCopy[1]){var entry=toCopy[1][id];if(entry["typ"]=="student"){var student=formStudent("","","");student["name"]=entry["name"];baseObj.push(student);GLOBALS.dbToGo+=1}else if(entry["typ"]=="settings"){baseObj.push(entry)}}addKlasse(thisElement,baseObj)},GLOBALS["klasse"])}