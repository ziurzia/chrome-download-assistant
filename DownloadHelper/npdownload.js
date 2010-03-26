// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {
	sendResponse(true);
});
var defDown = "";
function init() {
	var sufix = /(\.ZIP|\.EXE|\.BIN|\.GZ|\.Z|\.TAR|\.ARJ|\.LZH|\.MP3|\.A[0-9]?|\.RAR|\.R[0-9][0-9]|\.asf|\.avi|\.iso|\.mpeg|\.mpg|\.mpga|\.ra|\.rm|\.rmvb|\.wma|\.wmp|\.wmv|\.msi)$/i;
	for(var i = 0;i < document.links.length ;i++) {
		if(sufix.test(document.links[i].href)) {
			if(document.links[i].onclick) {
				document.links[i].click = document.links[i].onclick;
				document.links[i].onclick = function() {
					this.click();
					return download(this);
				}
			}
			else {
				document.links[i].onclick = function() {
					return download(this);
				}
			}
		}
	}
	chrome.extension.sendRequest({command: "defDown"},
			function(response) {
		defDown = response;
	});
}
function download(link) {
	if(defDown) {
		var message_ = {
			command : '',
			content : [
				'',
				'',
				'']
		};
		message_.content[0] = link.href;
		message_.content[1] = trim(link.innerText||link.textContent)||" ";
		message_.content[2] = location.href;
		chrome.extension.sendRequest(message_);
		return false;
	}
	else {
		return true;
	}
}
var trim = function(str) {
	return str.replace(/(^\s*)|(\s*$)/g, "").replace(/"/g,"\\\"");
}
/**
 * Operates on an instance of MyClass and returns something.
 * @param {project.MyClass} obj Instance of MyClass which leads to a long
 *     comment that needs to be wrapped to two lines.
 * @return {array} Whether something occured.
 */
function getAllLink() {
	var ret_ = [];

	var link_ = document.links; 
	for (var i = 0 ; i < link_.length ; i++ ) { 
		ret_.push(link_[i]);
	}
	
	link_ = document.images; 
	for (var i = 0 ; i < link_.length ; i++ ) { 
		ret_.push(link_[i]);
	}
	
	return ret_;
}

function downloadAllByThunder() {
	var links_ = getAllLink();
	var message_ = {
		command : '',
		content : [
			'',
			'',
			'']
	};
	var port_ = chrome.extension.connect();
	
	message_.command = 'ThunderStart';
	port_.postMessage(message_);
	
	message_.command = 'ThunderAdd';
	for (var i = 0 ; i < links_.length ; i++) {
		message_.content[0] = (links_[i].src||links_[i].href);
		message_.content[1] = (links_[i].alt||trim(links_[i].innerText||links_[i].textContent)||" ");
		message_.content[2] = location.href;
		port_.postMessage(message_);
	}
	
	message_.command = 'ThunderEnd';
	port_.postMessage(message_);
	
	message_.command = 'ThunderCommit';
	port_.postMessage(message_);
}
function downloadAllByFlashget() {
	var links_ = getAllLink();
	var message_ = {
		command : '',
		content : [
			'',
			'',
			'']
	};
	var port_ = chrome.extension.connect();
	
	message_.command = 'FlashgetStart';
	port_.postMessage(message_);
	
	message_.command = 'FlashgetAdd';
	for (var i = 0 ; i < links_.length ; i++) {
		message_.content[0] = (links_[i].src||links_[i].href);
		message_.content[1] = (links_[i].alt||trim(links_[i].innerText||links_[i].textContent)||" ");
		message_.content[2] = location.href;
		port_.postMessage(message_);
	}
	
	
	message_.command = 'FlashgetEnd';
	port_.postMessage(message_);
	
	message_.command = 'FlashgetCommit';
	port_.postMessage(message_);
}
init();