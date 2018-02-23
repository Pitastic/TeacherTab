var content = document.getElementsByClassName('styleWrap scrollable');
var slideBeginX;
var slideBeginY;

function touchListener(){
	if (!GLOBALS.isPhone){
	    var i;
	    var temp;
		temp=document.getElementsByClassName('content');
		for (i=0; i<temp.length; i++){
		    temp[i].addEventListener("touchmove", function(e){e.preventDefault();});
		}
		// make scrollable-
		for (i=0; i<content.length; i++){
			content[i].addEventListener('touchstart', function(event){
				this.allowUp = (this.scrollTop > 0);
				this.allowDown = (this.scrollTop < this.scrollHeight - this.clientHeight);
				this.slideBeginY = event.pageY;
			});
			content[i].addEventListener('touchmove', function(event){
				var up = (event.pageY > this.slideBeginY);
				var down = (event.pageY < this.slideBeginY);
				this.slideBeginY = event.pageY;
				if ((up && this.allowUp) || (down && this.allowDown)){
					event.stopPropagation();
				}else{
					event.preventDefault();
				}
			});
		}
	}
}

function touchSlider(){
    // Schüler- und Leistungsübersicht
	for (var i=0; i<content.length; i++){
		content[i].addEventListener("touchstart", touchStart, false);
		content[i].addEventListener("touchend", touchEnd, false);
	}
}

function noTouchSlider() {
	for (var i=0; i<content.length; i++){
		content[i].removeEventListener("touchstart", touchStart, false);
		content[i].removeEventListener("touchend", touchEnd, false);
	}
}
function noTouchThisSlider(target_el) {
	target_el.removeEventListener("touchstart", touchStart, false);
	target_el.removeEventListener("touchend", touchEnd, false);
}

function touchStart(e){
	slideBeginX = e.changedTouches[0].pageX;
	slideBeginY = e.changedTouches[0].pageY;
	return false;
}

function touchEnd(e){
	var slideEndX = e.changedTouches[0].pageX;
	var slideEndY = e.changedTouches[0].pageY;
	var moveX = Math.abs(slideEndX - slideBeginX);
	var moveY = Math.abs(slideEndY - slideBeginY);
	// min Distance
	if ((moveX > 50) && (moveX > 2*moveY)){
	    slide();
	}
	return false;
}