var plugin = document.getElementById('pluginId');
var useContextMenuAPI = true;
localStorage['defaultDownloader'] = localStorage['defaultDownloader'] || 'chrome_downloader';
localStorage['contextMenu'] = localStorage['contextMenu'] || 'true';

chrome.extension.onRequest.addListener(function(request, sender, response) {
  switch(request.msg) {
    case 'init_loaded':
      response({
        'defaultDownloader': localStorage['defaultDownloader'],
        'contextMenu': localStorage['contextMenu'],
        'useContextMenuAPI': useContextMenuAPI,
        'contextMenuList': downloaderManager.getEnableDownloader(plugin)});
      break;
    case 'thunder':
    case 'mini_thunder':
    case 'flashget':
    case 'mini_flashget':
    case 'qq_whirlwind':
    case 'emule':
    case 'orbit':
    case 'idm':
      downloaderManager.downloader(request.msg, request.link, plugin, request.pageUrl).download();
      break;
    case 'copyLink':
      downloaderManager.copyLinkToClipboard(plugin, request.link.url);
      break;
    case 'contextMenu':
      localStorage['contextMenu'] = 'false';
      response({contextMenu: false});
      break;
    case 'downloadAll':
      downloaderManager.downloader(request.downloader, request.links, plugin, request.pageUrl).downloadAll();
      break;
    case 'noLink':
    case 'existLink':
      setPopupStatus(request.msg);
      break;
  }
});

 chrome.tabs.onSelectionChanged.addListener(function(tabId) {
   var js = 'chrome.tabs.executeScript(' + tabId + ', {file: "npdownload.js"});';
    chrome.tabs.sendRequest(tabId, {
      'msg': 'init_check',
      'defaultDownloader': localStorage['defaultDownloader'],
      'contextMenu': localStorage['contextMenu'],
      'useContextMenuAPI': useContextMenuAPI,
      'contextMenuList': downloaderManager.getEnableDownloader(plugin)
    }, function(response) {
      // If content script is loaded
      if (response) {
        js = '';
      }
    });
    setTimeout(function() {
      eval(js);
      initBrowserAction();
      chrome.tabs.executeScript(tabId, {code: 'npDownload.checkPageLink()'});
    }, 500);
 });

function initBrowserAction() {
  chrome.browserAction.setTitle({title: chrome.i18n.getMessage('tip_special')});
  chrome.browserAction.setIcon(
      {path: chrome.extension.getURL('images/icon_19_disable.png')});
  chrome.browserAction.setPopup({popup: ''});

}

function setPopupStatus(status) {
  var browserActionTitle = 'tip_special';
  var setBrowserActionIcon = 'images/icon_19_disable.png';
  var setPopupUrl = '';
  var existDownloader = '';
  if (status == 'noLink') {
    browserActionTitle = 'tip_no_link';
  } else if (status == 'existLink') {
    var enableDownloaders = downloaderManager.getEnableDownloader(plugin);
    var supportDownloadAllCount = 0;
    browserActionTitle = 'tip_no_downloader';
    for(var i = 0; i < enableDownloaders.length; i ++) {
      var downloader = enableDownloaders[i];
      if (!downloader.isSystem) {
        if (downloader.supportDownloadAll) {
          setBrowserActionIcon = 'images/icon_19.png';
          browserActionTitle = downloader.showName2;
          existDownloader = downloader.name;
          supportDownloadAllCount++;
        } else if (supportDownloadAllCount == 0){
          browserActionTitle = downloader.showName2;
        }
      }
    }

    if (supportDownloadAllCount > 1) {
      browserActionTitle = 'download_all';
      setPopupUrl = 'popup.html';
    } else if (supportDownloadAllCount == 1) {
      chrome.browserAction.onClicked.addListener(function(tab) {
        chrome.tabs.executeScript(tab.id,
             {code: 'npDownload.sendDownloadAllCommandToBg("' + existDownloader + '")'});
      });
    }
    chrome.browserAction.setTitle(
        {title: chrome.i18n.getMessage(browserActionTitle)});
    chrome.browserAction.setIcon(
        {path: chrome.extension.getURL(setBrowserActionIcon)});
    chrome.browserAction.setPopup({popup: setPopupUrl});
  }
}

if (useContextMenuAPI) {
 createContextMenu(plugin);
}

function createContextMenu(plugin) {
  var enableDownloaders = downloaderManager.getEnableDownloader(plugin);
  for (var i = 0; i < enableDownloaders.length; i++) {
    var downloader = enableDownloaders[i];
    if (!downloader.isSystem) {
      var title = chrome.i18n.getMessage(downloader.showName);
      var name = downloader.name;
      contextMenuDownload(title, name, plugin);
      if (downloader.supportDownloadAll) {
        title = chrome.i18n.getMessage(downloader.showName2);
        contextMenuDownloadAll(title, name);
      }
    }
  }
}

function contextMenuDownload(title, downloader, plugin) {
  chrome.contextMenus.create({title: title, contexts: ['link'],
      onclick: function(info, tab){
    var link = {};
    link.url = info.linkUrl;
    link.text = info.selectionText || ' ';
    link.pageUrl = info.pageUrl ;
    downloaderManager.downloader(downloader, link, plugin, info.pageUrl).download();
  }}, function() {});
}

function contextMenuDownloadAll(title, downloader) {
  chrome.contextMenus.create({title: title, contexts: ['all'],
      onclick: function(info, tab) {
    if (info.frameUrl) {
      chrome.tabs.executeScript(null,
          {code: 'npDownload.checkFrameByUrlAndDown("' +
          info.frameUrl + '", "' + downloader + '")', allFrames: true})
    } else {
      chrome.tabs.executeScript(null,
          {code: 'npDownload.sendDownloadAllCommandToBg("' +
          downloader + '");'})
    }
  }});
}

initBrowserAction();