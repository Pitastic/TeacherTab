"use strict";
// esLint Globals:
/* global $ SETTINGS GLOBALS slide*/
var slideBeginX;
var slideBeginY;

function touchScroller() {
	// ausgesuchte scrollable machen
	var scrollables = document.getElementsByClassName('scrollable');
	for (var i = 0; i < scrollables.length; i++) {
		scrollables[i].addEventListener('touchstart', function (event) {
			this.slideBeginY = event.pageY || event.touches[0].pageY;
			this.allowUp = (this.scrollTop > 0);
			this.allowDown = (this.scrollTop < this.scrollHeight - this.clientHeight);
		});
		scrollables[i].addEventListener('touchmove', function (event) {
			var newMoveY = event.pageY || event.touches[0].pageY;
			var up = (newMoveY > this.slideBeginY);
			var down = (newMoveY < this.slideBeginY);
			this.slideBeginY = newMoveY;
			if ((up && this.allowUp) || (down && this.allowDown)) {
				event.stopPropagation(); // scroll without bump
			} else {
				event.preventDefault(); // do not scroll at all
			}
		});
	}
}

function touchSlider() {
	// Schüler- und Leistungsübersicht
	var scrollables = document.querySelectorAll('#item1 .scrollable, #item2 .scrollable');
	for (var i = 0; i < scrollables.length; i++) {
		scrollables[i].addEventListener("touchstart", touchStart, false);
		scrollables[i].addEventListener("touchend", touchEnd, false);
	}
}

function noTouchSlider() {
	var scrollables = document.getElementsByClassName('scrollable');
	for (var i = 0; i < scrollables.length; i++) {
		scrollables[i].removeEventListener("touchstart", touchStart, false);
		scrollables[i].removeEventListener("touchend", touchEnd, false);
	}
}

function noTouchThisSlider() {
	var target_el = document.getElementById('seitenleiste');
	target_el.removeEventListener("touchstart", touchStart, false);
	target_el.removeEventListener("touchend", touchEnd, false);
}

function touchStart(e) {
	slideBeginX = e.changedTouches[0].pageX;
	slideBeginY = e.changedTouches[0].pageY;
	return false;
}

function touchEnd(e) {
	var slideEndX = e.changedTouches[0].pageX;
	var slideEndY = e.changedTouches[0].pageY;
	var moveX = Math.abs(slideEndX - slideBeginX);
	var moveY = Math.abs(slideEndY - slideBeginY);
	// min Distance
	if ((moveX > 50) && (moveX > 2 * moveY)) {
		slide();
	}
	return false;
}