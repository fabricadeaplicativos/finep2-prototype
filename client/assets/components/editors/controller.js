angular.module('Editor.editors.controller', [])

.controller('EditorsCtrl', function ($scope, $window) {

	// message from the iframe
	$window.addEventListener('message', function (event) {

		// parse the data
		var data = JSON.parse(event.data);

		console.log(data);

		// set active editor
		$scope.editorTabIndex = 0;

		$scope.$apply();

	}, false);

	$scope.editorTabIndex = 1;


	// GRID
	$scope.myData = [
		{name: "Moroni", age: 50},
		{name: "Tiancum", age: 43},
		{name: "Jacob", age: 27},
		{name: "Nephi", age: 29},
		{name: "Enos", age: 34}
	];

	$scope.gridOptions = { data : 'myData' };// $scope.myData is also acceptable but will not update properly. OK to use the object if you don't care about updating the data in the grid.
});