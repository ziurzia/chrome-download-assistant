/* ***** BEGIN LICENSE BLOCK *****
* Copyright 2010 Chen Bo (chen_bo-bj@vanceinfo.com)
* Version: 0.5
* This code was based on the npdownloadhelper.cpp sample code in Gecko-sdk.
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
* ***** END LICENSE BLOCK ***** */
#include <afxdisp.h>
#include <string>
#include <IOSTREAM>
using namespace std;
//Flashget3
#import "FlashGetHook.dll"
using namespace FlashgetHookLib;
//Flashget old
#import "jccatch.dll"
using namespace FGCATCHURLLib;

#include "../npdownloadhelper.h"
#include "../utils.h"

enum FlashgetVer {
	Flashget3 = 3,
	Flashget1 = 1
};
