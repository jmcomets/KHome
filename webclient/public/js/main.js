"use strict";function MainCtrl($scope,ModuleService,HouseMapService){$scope.modules=[],$scope.reloadModules=function(){ModuleService.installed().then(function(modules){$scope.modules=modules})},HouseMapService.getRooms().then(function(rooms){$scope.rooms=rooms})}function ModuleInjectorCtrl($scope,ModuleService,$routeParams,$compile,$http){var moduleName=$routeParams.moduleName;ModuleService.module(moduleName).then(function(module){$scope.module=module}),$http.get("/api/modules/"+moduleName+"/public/partial.html").then(function(result){$("#inject").html($compile(result.data)($scope))})}function ModulesCtrl($scope,$location){$scope.reloadModules(),$scope.uninstall=function(module){console.log("uninstalling",module)},$scope.navigate=function(module){$location.path("/modules/"+module.id)}}function RatingCtrl($scope,ModuleService){$scope.isRating=!1,$scope.rate=function(){$scope.isRating=!0,ModuleService.rate($scope.module,$scope.module.rating).then(function(){console.log("rating success")},function(){console.log("rating error")},function(){$scope.isRating=!1})}}function RoomsCtrl($scope){$scope.box={},$scope.points=function(room){var pointsRepr="";return angular.forEach(room.polygon,function(point,i){pointsRepr+=point.x+","+point.y,i<room.polygon.length-1&&(pointsRepr+=" ")}),pointsRepr},$scope.$watch("rooms",function(){angular.forEach($scope.rooms,function(room){angular.forEach(room.polygon,function(point){void 0===$scope.box.minX||point.x<$scope.box.minX?$scope.box.minX=point.x:(void 0===$scope.box.maxX||point.x>$scope.box.maxX)&&($scope.box.maxX=point.x),void 0===$scope.box.minY||point.y<$scope.box.minY?$scope.box.minY=point.y:(void 0===$scope.box.maxY||point.y>$scope.box.maxY)&&($scope.box.maxY=point.y)})})})}function SettingsCtrl($scope,$location){$scope.reloadModules(),$scope.navigate=function(module){$location.path("/settings/"+module.id)}}function StoreCtrl($scope,$modal,ModuleService){$scope.availableModules=[],$scope.reloadAvailableModules=function(){ModuleService.available().then(function(modules){$scope.availableModules=modules})},$scope.reloadAvailableModules(),$scope.modulesInstalling=[],$scope.install=function(module){for(var i=0;i<$scope.modulesInstalling.length;i++)if($scope.modulesInstalling[i].id==module.id)return;$scope.modulesInstalling.push(module),ModuleService.installFromCatalog(module).then(function(){},function(){},function(){for(var i=0;i<$scope.modulesInstalling.length;i++)if($scope.modulesInstalling[i].id==module.id){$scope.modulesInstalling.splice(i,1);break}})},$scope.uploading=!1,$scope.upload=function(file){$scope.uploading=!0,$scope.upload=ModuleService.installFromFile(file).progress(function(evt){$scope.uploadProgress=parseInt(100*evt.loaded/evt.total)}).success(function(){$scope.uploading=!1,$scope.reloadAvailableModules()}).error(function(){$scope.uploading=!1})},$scope.modalInstances={},$scope.openModal=function(module){var modalScope=$scope.$new(!0);modalScope.dismiss=function(){$scope.modalInstances[module.id].dismiss()},modalScope.install=function(){$scope.install(module),modalScope.dismiss()},modalScope.module=module,$scope.modalInstances[module.id]=$modal.open({templateUrl:"modal.html",scope:modalScope})}}function SupervisionCtrl($scope,ModuleService){$scope.module="",$scope.data={},$scope.maxData=10,$scope.poll=null,$scope.$watch("module",function(){$scope.poll&&($scope.poll.cancel(),$scope.data={}),$scope.module&&($scope.poll=ModuleService.pollInstances($scope.module,function(promise){promise.success(function(data){angular.forEach(data,function(instance){var instanceName=instance.name;angular.forEach(instance.attrs,function(data,attr){var attrName=instanceName+"."+attr;$scope.data[attrName]||($scope.data[attrName]=[]);var attrData=$scope.data[attrName];attrData.push([instance.time,data]),$scope.maxData<attrData.length&&attrData.splice(0,attrData.length-$scope.maxData)})})}).error(function(){})}),$scope.$on("$routeChangeSuccess",function(){$scope.poll.cancel(),$scope.module="",$scope.data={},$scope.graphData=[]}))})}angular.module("GHome",["ngRoute","ui.bootstrap","angularFileUpload","frapontillo.bootstrap-switch"]).config(function($routeProvider){$routeProvider.when("/home",{templateUrl:"/partials/home.html"}).when("/store",{templateUrl:"/partials/store.html",controller:"StoreCtrl"}).when("/settings",{templateUrl:"/partials/settings.html",controller:"SettingsCtrl"}).when("/settings/:moduleName",{templateUrl:"/partials/module_settings.html"}).when("/modules",{templateUrl:"/partials/modules.html",controller:"ModulesCtrl"}).when("/modules/:moduleName",{templateUrl:"/partials/module_inject.html",controller:"ModuleInjectorCtrl"}).otherwise({redirectTo:"/home"})}),angular.module("GHome").directive("graph",function(){return{restrict:"EA",link:function($scope,elem,attrs){var chart=null,opts={xaxis:{tickLength:0},yaxis:{tickLength:0},grid:{borderWidth:0,aboveData:!0,markings:[{yaxis:{from:0,to:0},color:"#888"},{xaxis:{from:0,to:0},color:"#888"}]},series:{shadowSize:0,points:{show:!0},lines:{show:!0}}};$scope.$watch(attrs.graphModel,function(data){var plottedData=[];data instanceof Array?plottedData=data:angular.forEach(data,function(rawData,label){plottedData.push({label:label,data:rawData})}),chart?(chart.setData(plottedData),chart.setupGrid(),chart.draw()):(chart=$.plot(elem,plottedData,opts),elem.css("display","block"))},!0)}}}),angular.module("GHome").directive("svgVbox",function(){return{link:function($scope,elem,attrs){var paddingRatio=.05;attrs.$observe("svgVboxPadding",function(value){void 0!==value&&(paddingRatio=parseFloat($scope.$eval(value)))}),$scope.$watch(attrs.svgVbox,function(vbox){void 0===vbox.minX&&(vbox.minX=0),void 0===vbox.maxX&&(vbox.maxX=0),void 0===vbox.minY&&(vbox.minY=0),void 0===vbox.maxY&&(vbox.maxY=0);var w=vbox.maxX-vbox.minX,h=vbox.maxY-vbox.minY,padding=paddingRatio*Math.max(w,h),x=vbox.minX-padding,y=vbox.minY-padding;w+=2*padding,h+=2*padding,elem[0].setAttribute("viewBox",x+" "+y+" "+w+" "+h)})}}}),angular.module("GHome").filter("truncate",function(){return function(text,length,end){return void 0!==text?(isNaN(length)&&(length=10),void 0===end&&(end="..."),text.length<=length||text.length-end.length<=length?text:String(text).substring(0,length-end.length)+end):void 0}}),angular.module("GHome").factory("HouseMapService",function($q,$timeout,$http){var service={};return service.getRooms=function(){var deferred=$q.defer();return $http.get("/api/rooms").success(function(rooms){deferred.resolve(rooms)}),deferred.promise},service}),angular.module("GHome").factory("ModuleService",function($q,$http,$timeout,$upload){var service={defaultPollingDelay:1e3},modulesUrl="/api/modules",storeUrl="/api/available_modules",httpPostJSON=function(url,data){var formattedData="";for(var key in data)formattedData+=key+"="+data[key]+"&";return formattedData=formattedData.substring(0,formattedData.length-1),$http({url:url,method:"POST",data:formattedData,headers:{"Content-Type":"application/x-www-form-urlencoded"}})};service.module=function(name){var deferred=$q.defer();return $http.get(modulesUrl+"/"+name).success(function(data){console.log(data),deferred.resolve(data)}),deferred.promise};var getModules=function(url,cachedModules,forceReload){var deferred=$q.defer();return forceReload?deferred.resolve(cachedModules):$http.get(url).success(function(data){cachedModules=data,deferred.resolve(data)}),deferred.promise};return service.availableModules=[],service.available=function(forceReload){return getModules(storeUrl,this.availableModules,forceReload)},service.rate=function(module,oldValue){var value=parseInt(oldValue);(!value||1>value||value>5)&&console.error("Invalid value",oldValue);var deferred=$q.defer();return httpPostJSON(storeUrl+"/rate",{name:module.id,value:value}).success(function(){deferred.resolve()}).error(function(){deferred.reject()}),deferred.promise},service.installedModules=[],service.installed=function(forceReload){return getModules(modulesUrl,this.installedModules,forceReload)},service.pollInstances=function(name,callback,delay){void 0===delay&&(delay=service.defaultPollingDelay);var timeout=$timeout(function pollFn(){callback($http.get(modulesUrl+"/"+name+"/instances/status")),timeout=$timeout(pollFn,delay)},delay);return{cancel:function(){$timeout.cancel(timeout)}}},service.installFromFile=function(file){return $upload.upload({url:modulesUrl+"/install",method:"POST",file:file})},service.installFromCatalog=function(module){var deferred=$q.defer();return httpPostJSON(modulesUrl+"/install",{name:module.id}).success(function(){deferred.resolve()}).error(function(){deferred.reject()}),deferred.promise},service});