"use strict";

(function() {
  angular.module('GHome', ['ngRoute', 'angularFileUpload'])
    .config(function($routeProvider, $locationProvider) {
      $routeProvider
        .when('/home', { templateUrl: 'partials/home.html' })
        .when('/weather', { templateUrl: 'partials/weather.html' })
        .when('/surveillance', { templateUrl: 'partials/surveillance.html' })
        .when('/temperature', { templateUrl: 'partials/temperature.html' })
        .when('/brightness', { templateUrl: 'partials/brightness.html' })
        .when('/power', { templateUrl: 'partials/power.html' })
        .when('/modules', { templateUrl: 'partials/modules.html' })
        .when('/ai-config', { templateUrl: 'partials/ai-config.html' })
        .otherwise({ redirectTo: '/home' })
      ;
    });
})();
;function MainCtrl($scope, ModuleService, HouseMapService) {
  // Module supervision (history)
  $scope.supervision = {};
  $scope.supervision.module = '';
  $scope.supervision.data = {};
  $scope.supervision.graphData = [];
  $scope.supervision.poll = null;

  $scope.$watch('supervision.module', function() {
    // Cancel the previous poll
    if ($scope.supervision.poll) {
      $scope.supervision.poll.cancel();
      $scope.supervision.data = {};
    }

    // Do nothing if the module isn't set
    if (!$scope.supervision.module) { return; }

    // Poll the current supervised module for its status, 
    $scope.supervision.poll = ModuleService.pollInstances($scope.supervision.module, function(promise) {
      promise.success(function(data) {
        angular.forEach(data, function(instance) {
          // Empty data case
          var instanceName = instance.name;
          if (!$scope.supervision.data[instanceName]) {
            $scope.supervision.data[instanceName] = [];
          }

          // Push new data
          var data = instance.data;
          $scope.supervision.data[instanceName].push([data.time, data.value]);
        });

        // Update graph-specific data
        $scope.supervision.graphData = [];
        angular.forEach($scope.supervision.data, function(data) {
          $scope.supervision.graphData.push(data);
        });
      }).error(function() {
        // TODO
      });
    });

    // Stop polling when location is changed
    $scope.$on('$routeChangeSuccess', function () {
      $scope.supervision.poll.cancel();
      $scope.supervision.module = '';
      $scope.supervision.data = {};
      $scope.supervision.graphData = [];
    });
  });

  // Get the rooms (asynchronous)
  HouseMapService.getRooms().then(function(rooms) {
    $scope.rooms = rooms;
  });

  // House map namespace
  $scope.map = {};
  // Comma-separated representation for points (x1,y1 x2,y2 x3,y3 etc...), used
  // for svg rendering.
  $scope.map.points = function(room) {
    var pointsRepr = '';
    angular.forEach(room.polygon, function(point, i) {
      // Update min/max coordinates
      if (point.x < $scope.minX) { $scope.minX = point.x; }
      else if (point.x > $scope.maxX) { $scope.maxX = point.x; }
      if (point.y < $scope.minY) { $scope.minY = point.y; }
      else if (point.y > $scope.maxY) { $scope.maxY = point.y; }

      // Update the points representation
      pointsRepr += point.x + ',' + point.y;
      if (i < room.polygon.length - 1) {
        pointsRepr += ' ';
      }
    });
    return pointsRepr;
  };
  // ...minimal bbox
  $scope.map.minX = 0;
  $scope.map.minY = 0;
  $scope.map.maxX = 0;
  $scope.map.maxY = 0;
}
;function ModulesCtrl($scope, ModuleService) {
  // All modules
  $scope.modules = [];

  // Explicitly reload modules
  $scope.reloadModules = function() {
    ModuleService.all().success(function(modules) {
      $scope.modules = modules;
    });
  };
  //...and call immediately
  $scope.reloadModules();

  // Uploading system
  $scope.uploading = false
  $scope.upload = function(file) {
    $scope.uploading = true;
    $scope.upload = ModuleService.install(file).progress(function(evt) {
      $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
    }).success(function() {
      $scope.uploading = false;
      $scope.reloadModules();
    }).error(function() {
      $scope.uploading = false;
      // TODO handle errors better
    });
  };
}
;angular.module('GHome').directive('graph', function() {
  return {
    restrict: 'EA',
    link: function($scope, elem, attrs) {
      var chart = null, opts = {};
      $scope.$watch(attrs.graphModel, function(v) {
        console.log(v);
        if (!chart) {
          chart = $.plot(elem, v, opts);
          elem.css('display', 'block');
        } else {
          chart.setData(v);
          chart.setupGrid();
          chart.draw();
        }
      }, true);
    }
  };
  });
;angular.module('GHome').factory('HouseMapService', function($q, $timeout, $http) {
  var service = {};

  // Replace with an AJAX call
  service.getRooms = function() {
    var deferred = $q.defer();
    $http.get('/api/rooms').success(function(rooms) {
      deferred.resolve(rooms);
    });
    return deferred.promise;
  };
  return service;
});
;angular.module('GHome').factory('ModuleService', function($q, $http, $timeout, $upload) {
  var service = {
    defaultPollingDelay: 1000
  };

  service.modules = [];

  // Get the list of available modules, optionally passing if this should force
  // a reload of this list
  service.all = function(forceReload) {
    var deferred = $q.defer();
    if (!forceReload) {
      $http.get('/api/modules').success(function(data) {
        service.modules = data;
        deferred.resolve(data);
      }); // TODO handle errors
    } else {
      deferred.resolve(this.modules);
    }
    return deferred.promise;
  };

  // Poll all module instances for their statuses, passing in the module's name
  // and a callback which should be applied on a $http promise object.
  // Optionally, pass in the delay to override the service's default polling
  // delay.
  // FIXME
  service.pollInstances = function(name, callback, delay) {
    if (delay === undefined) { delay = service.defaultPollingDelay; }

    var timeout = $timeout(function pollFn() {
      callback($http.get('/api/modules/' + name + '/instances/status'));
      timeout = $timeout(pollFn, delay);
    }, delay);

    return {
      cancel: function() {
        $timeout.cancel(timeout);
      }
    };
  };

  // Install a module, passing in the uploaded file object (see $upload for
  // details). Return a promise object for the given upload http call.
  service.install = function(file) {
    return $upload.upload({
      url: '/api/modules/install',
      method: 'POST', file: file,
    });
  }

  return service;
});
