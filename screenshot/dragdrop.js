var page = {
	startX: 150,
	startY: 150,
	endX: 400,
	endY: 300,
	moveX: 0,
	moveY: 0,
	scrollbar:17,
	pageWidth:0,
	pageHeight:0,
	visibleWidth:0,
	visibleHeight:0,
	dragging: false,
	moving: false,
	resizing: false,
	mousedown: false,
	i:0,
	j:0,
	docHeight:0,
	docWeight:0,
	winHeight:0,
	winWidth:0,
	messageListener: function() {
		chrome.extension.onRequest.addListener(function(request, sender, response)
		{
			switch(request.msg)
			{
				case "capture_visible": page.captureWindow(); break;
				case "show_area": page.showArea(); break;
				case "post_image": page.saveImage(); break;
				case "scroll_init": page.scrollInit(); break;
				case "scroll_next": page.scrollNext(); break;
				case "jsload": page.sendMessage({msg:"isload"}); break;
			}
		});
	},

	sendMessage: function(message) {
		chrome.extension.connect().postMessage(message);
	},

	scrollInit: function() {
		page.docHeight = document.body.scrollHeight;
		page.docWidth = document.body.scrollWidth;
		page.winHeight = window.innerHeight;
		page.winWidth = window.innerWidth;
		page.visibleWidth = (window.innerHeight < document.body.scrollHeight)?(window.innerWidth-page.scrollbar):window.innerWidth;
		page.visibleHeight = (window.innerWidth < document.body.scrollWidth)?(window.innerHeight-page.scrollbar):window.innerHeight;
		page.startY = window.scrollY;
		page.startX = window.scrollX;
		window.scrollTo(0,0);
		page.i = 0;
		page.j = 0;
		page.sendMessage({msg:'scroll_init_done', height:page.docHeight, width:page.docWidth , visibleHeight:page.visibleHeight, 
			visibleWidth:page.visibleWidth, i:page.i, j:page.j});
	},

	scrollNext:function() {
		
		if(page.i*page.visibleHeight < page.docHeight) {
			if(page.j*page.visibleWidth < page.docWidth) {	
	   		window.scrollTo(page.j*page.visibleWidth, page.i * page.visibleHeight);			
			  setTimeout("page.sendMessage({msg:'scroll_next_done',i:" + page.i + ",j:" + page.j + "});", 10);
				page.j++;
			}
			else {
				page.i++;
				page.j = 0;
				page.scrollNext();
			}
		}
		else {
			window.scrollTo(page.startX,page.startY);
			page.sendMessage({msg:'scroll_finished'});
		}

	},

	showArea: function() {
		page.setupCss();
		page.createArea();
	},

	setupCss: function() {
		cssRef = document.createElement('LINK');
		cssRef.id = 'drag-style';
		cssRef.rel = 'stylesheet';
		cssRef.href = chrome.extension.getURL('style.css');
		cssRef.type = 'text/css';
		document.getElementsByTagName('head')[0].appendChild(cssRef);
	},

	captureWindow: function() {
		page.visibleWidth = (window.innerHeight < document.body.scrollHeight)?(window.innerWidth-page.scrollbar):window.innerWidth;
		page.visibleHeight = (window.innerWidth < document.body.scrollWidth)?(window.innerHeight-page.scrollbar):window.innerHeight;
		page.sendMessage({msg:'capture_window',width:page.visibleWidth, height:page.visibleHeight});
	},

	captureSelected: function() {
		page.removeArea();
		setTimeout( function() { page.sendMessage({msg:"capture_selected", x:page.startX, y:page.startY, width:page.endX-page.startX, height:page.endY-page.startY})}, 50);
	},
	
	saveImage: function() {
		page.sendMessage({msg:'save'});
	},
	
	createArea: function() {
		page.addDivElement(document.body, 'drag_area_protector');
		setTimeout(page.displayArea, 100);
	},

	displayArea: function() {
		var areaProtector = document.getElementById('drag_area_protector');
		
		page.addDivElement(areaProtector, 'drag_shadow_top');
		page.addDivElement(areaProtector, 'drag_shadow_bottom');
		page.addDivElement(areaProtector, 'drag_shadow_left');
		page.addDivElement(areaProtector, 'drag_shadow_right');

		var areaElement = page.addDivElement(areaProtector, 'drag_area');
		
		page.addDivElement(areaElement, 'drag_container');
		page.addDivElement(areaElement, 'drag_size');

		var cancel = page.addDivElement(areaElement, 'drag_cancel');
		cancel.addEventListener("mousedown", function (){page.removeArea();}, true);
		cancel.innerHTML = "Cancel";
		
		var crop = page.addDivElement(areaElement, 'drag_crop');
		crop.addEventListener("mousedown", page.captureSelected, true);
		crop.innerHTML = "OK";

		page.addDivElement(areaElement, 'drag_north_west');
		page.addDivElement(areaElement, 'drag_north_east');
		page.addDivElement(areaElement, 'drag_south_east');
		page.addDivElement(areaElement, 'drag_south_west');
		
		document.addEventListener("mousedown", page.mouseDown, false);
		document.addEventListener("dblclick", page.captureSelected, false);
		document.addEventListener("mousemove", page.mouseMove, false);
		document.addEventListener("mouseup", page.mouseUp, false);

		page.pageHeight = document.getElementById('drag_area_protector').clientHeight;
		page.pageWidth = document.getElementById('drag_area_protector').clientWidth;
		
		var areaElement = document.getElementById("drag_area");
		areaElement.style.left = page.startX + "px";
		areaElement.style.top = page.startY + "px";
		areaElement.style.width = (page.endX - page.startX) + "px";
		areaElement.style.height = (page.endY - page.startY) + "px";

		page.updateShadow(areaElement);
		page.updateSize();
	},

	mouseDown: function(event) {
		if(event.button != 2) {
			var element = event.target;

			if(element) {
				var elementName = element.tagName;
				
				if(elementName && elementName == "HTML") {
					page.removeArea();
				}
				else if(elementName && document) {
					page.mousedown = true;
				
					var areaElement = document.getElementById("drag_area");
					var xPosition = event.pageX - window.scrollX;
					var yPosition = event.pageY - window.scrollY;
					
					if(areaElement) {
						if(element == document.getElementById("drag_container")) {
							page.moving = true;
							page.moveX = xPosition - areaElement.offsetLeft;
							page.moveY = yPosition - areaElement.offsetTop;
						} 
						else if(element == document.getElementById("drag_north_east")) {
							page.resizing = true;
							page.startX = areaElement.offsetLeft;
							page.startY = areaElement.offsetTop + areaElement.clientHeight;
						} 
						else if(element == document.getElementById("drag_north_west")) {
							page.resizing = true;
							page.startX = areaElement.offsetLeft + areaElement.clientWidth;
							page.startY = areaElement.offsetTop + areaElement.clientHeight;
						} 
						else if(element == document.getElementById("drag_south_east")) {
							page.resizing = true;
							page.startX = areaElement.offsetLeft;
							page.startY = areaElement.offsetTop;
						} 
						else if(element == document.getElementById("drag_south_west")) {
							page.resizing = true;
							page.startX = areaElement.offsetLeft + areaElement.clientWidth;
							page.startY = areaElement.offsetTop;
						}
						else {
							page.dragging = true;
							page.endX = 0;
							page.endY = 0;
							page.startX = xPosition;
							page.startY = yPosition;
						}
					}
				}
			}
			event.stopPropagation();
			event.preventDefault();
		}
	},

	mouseMove: function(event) {
		var element = event.target;

		if(element && page.mousedown) {
			var areaElement = document.getElementById("drag_area");

			if(areaElement) {
				var xPosition = event.pageX - window.scrollX;
				var yPosition = event.pageY - window.scrollY;

				if(page.dragging || page.resizing) {
					var width = 0;
					var height = 0;
					
					page.endX = xPosition;
					page.endY = yPosition;

					if(page.startX > page.endX) {
						width = page.startX - page.endX;
						areaElement.style.left = xPosition + "px";
					} 
					else {
						width = page.endX - page.startX;
						areaElement.style.left = page.startX + "px";
					}

					if(page.startY > page.endY) {
						height = page.startY - page.endY;
						areaElement.style.top = page.endY + "px";
					} 
					else {
						height = page.endY - page.startY;
						areaElement.style.top = page.startY + "px";
					}
					areaElement.style.height = height + "px";
					areaElement.style.width  = width + "px";
				} 
				else if(page.moving) {
					var newXPosition = xPosition - page.moveX;
					var newYPosition = yPosition - page.moveY;

					if (newXPosition < 0) {
						newXPosition = 0;
					}
					else if(newXPosition + areaElement.clientWidth > page.pageWidth) {
						newXPosition = page.pageWidth - areaElement.clientWidth;
					}
					
					if (newYPosition < 0) {
						newYPosition = 0;
					}
					else if(newYPosition + areaElement.clientHeight > page.pageHeight) {
						newYPosition = page.pageHeight - areaElement.clientHeight;
					}
					
					areaElement.style.left = newXPosition + "px";
					areaElement.style.top  = newYPosition + "px";
					page.endX   = newXPosition + areaElement.clientWidth;
					page.startX = newXPosition;
					page.endY   = newYPosition + areaElement.clientHeight;
					page.startY = newYPosition;
				}
				page.updateShadow(areaElement);
				page.updateSize();
			}
		}
	},

	updateShadow: function(areaElement) {
		var width, height;
		
		var shadowTop = document.getElementById("drag_shadow_top");
		shadowTop.style.height = parseInt(areaElement.style.top) + "px";
		shadowTop.style.width = (parseInt(areaElement.style.left) +  parseInt(areaElement.style.width) + 1) +"px";
		
		var shadowLeft = document.getElementById("drag_shadow_left");
		shadowLeft.style.height = (page.pageHeight - parseInt(areaElement.style.top)) + "px";
		shadowLeft.style.width = parseInt(areaElement.style.left) + "px";
		
		height = (parseInt(areaElement.style.top)+parseInt(areaElement.style.height) + 1);
		width = (page.pageWidth) - 1 - (parseInt(areaElement.style.left) + parseInt(areaElement.style.width));
		
		if(height < 0) height = 0;
		if(width < 0) width = 0;
		
		var shadowRight = document.getElementById("drag_shadow_right");
		shadowRight.style.height = height + "px";
		shadowRight.style.width =  width + "px";
		
		height = (page.pageHeight - 1 - (parseInt(areaElement.style.top)+parseInt(areaElement.style.height)));
		width = (page.pageWidth) - parseInt(areaElement.style.left);
		
		if(height < 0) height = 0;
		if(width < 0) width = 0;
		
		var shadowBottom = document.getElementById("drag_shadow_bottom");
		shadowBottom.style.height = height + "px";
		shadowBottom.style.width = width + "px";
	},

	mouseUp: function(event)
	{
		page.mousedown = false;
	
		if(event.button != 2) {
			page.resizing = false;
			page.dragging = false;
			page.moving = false;
			page.moveX = 0;
			page.moveY = 0;
			
			if(page.endX < page.startX) {
				var nx = page.endX;
				page.endX = page.startX;
				page.startX = nx;
			}
			if(page.endY < page.startY) {
				var ny = page.endY;
				page.endY = page.startY;
				page.startY = ny;
			}
		}
	},

	removeArea: function() {
		page.removeElement("drag_area_protector");
		page.removeElement("drag_area");

		try { document.removeEventListener("mousedown", page.mouseDown, false); } catch(exception) { }
		try { document.removeEventListener("mousemove", page.mouseMove, false); } catch(exception) { }
		try { document.removeEventListener("mouseup", page.mouseUp, false); } catch(exception) { }
		try { document.removeEventListener("dblclick", page.captureSelected, false); } catch(exception) { }
	},

	updateSize: function() {
		var width, height;
		var areaSizeElement = document.getElementById("drag_size");
		
		width = (page.endX > page.startX)?(page.endX - page.startX):(page.startX - page.endX);
		height = (page.endY > page.startY)?(page.endY - page.startY):(page.startY - page.endY);
		areaSizeElement.innerHTML = width +" x "+ height;
	},

	addDivElement: function(parent, id) {
		var el = document.createElement('div');
		el.id = id; parent.appendChild(el);
		return el;
	},

	removeElement: function(id) {
		if(document.getElementById(id)) {
			document.getElementById(id).parentNode.removeChild(document.getElementById(id));
		}
	}
};
page.messageListener();