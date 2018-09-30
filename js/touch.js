"use strict";
// esLint Globals:
/* global $ SETTINGS GLOBALS slide*/
var slideBeginX;
var slideBeginY;

function touchScroller(){
	// Prevent Bumping/Scrolling
	var contents = document.getElementsByClassName('content');
	for (var i=0; i<contents.length; i++){
		contents[i].addEventListener("touchmove", function(e){e.preventDefault();});
	}

	// ausgesuchte scrollable machen
	var scrollables = document.getElementsByClassName('styleWrap scrollable');
	for (i=0; i<scrollables.length; i++){
		scrollables[i].addEventListener('touchstart', function(event){
			this.allowUp = (this.scrollTop > 0);
			this.allowDown = (this.scrollTop < this.scrollHeight - this.clientHeight);
			this.slideBeginY = event.pageY;
		});
		scrollables[i].addEventListener('touchmove', function(event){
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

function touchSlider(){
	// Schüler- und Leistungsübersicht
	var scrollables = document.getElementsByClassName('styleWrap scrollable');
	for (var i=0; i<scrollables.length; i++){
		scrollables[i].addEventListener("touchstart", touchStart, false);
		scrollables[i].addEventListener("touchend", touchEnd, false);
	}
}

function noTouchSlider() {
	var scrollables = document.getElementsByClassName('styleWrap scrollable');
	for (var i=0; i<scrollables.length; i++){
		scrollables[i].removeEventListener("touchstart", touchStart, false);
		scrollables[i].removeEventListener("touchend", touchEnd, false);
	}
}

function noTouchThisSlider() {
	var target_el = document.getElementById('seitenleiste');
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