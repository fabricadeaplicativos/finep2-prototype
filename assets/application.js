var app = angular.module('Editor', [
	'ngMaterial',
	'Editor.editors.controller',
	'ui.grid'
]);

app.controller('AppCtrl', function($scope, $mdSidenav){

	$scope.toggleSidenav = function(menuId) {
		$mdSidenav(menuId).toggle();
	};
 
});