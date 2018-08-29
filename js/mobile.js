// Design-Anpassung für mobile Geräte

if (screen.width > 767) {
	switch(window.orientation){
		case 180:
		case 0:
			// Portrait = 0 or 180:
			document.getElementById('dynamicViewport').setAttribute('content', "width=device-width");
			break;
		default:
			// Landscape = 90 or -90:
			document.getElementById('dynamicViewport').setAttribute('content', "width="+document.documentElement.clientWidth);
			break;
	}
}