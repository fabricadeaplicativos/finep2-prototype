var app = angular.module('Editor', ['ngMaterial']);

app.controller('AppCtrl', function($scope, $mdSidenav){
	$scope.toggleSidenav = function(menuId) {
		$mdSidenav(menuId).toggle();
	};
 
});