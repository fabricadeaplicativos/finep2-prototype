angular.module('Editor.editors.controller', [])

.controller('EditorsCtrl', function ($scope, $window, $mdDialog) {

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
	$scope.showTableCreate = function(ev){
		$mdDialog.show({
	      controller: function DialogController($scope, $mdDialog) {
					  $scope.answer = function(answer) {
					    $mdDialog.hide(answer);
					  };
					},
	      templateUrl: 'assets/components/dialogs/dialog-table-create.html',
	      targetEvent: ev,
	    })
	    .then(function(answer) {
	    	// alert('You said the information was "' + answer + '".')
	      $scope.alert = 'You said the information was "' + answer + '".';
	    }, function() {
	      $scope.alert = 'You cancelled the dialog.';
	    });
	}

	$scope.showTableUse = function(ev){
		$mdDialog.show({
	      controller: function DialogController($scope, $mdDialog) {
					  $scope.answer = function(answer) {
					    $mdDialog.hide(answer);
					  };
					},
	      templateUrl: 'assets/components/dialogs/dialog-table-use.html',
	      targetEvent: ev,
	    })
	    .then(function(answer) {
	    	// alert('You said the information was "' + answer + '".')
	      $scope.alert = 'You said the information was "' + answer + '".';
	    }, function() {
	      $scope.alert = 'You cancelled the dialog.';
	    });
	}

	$scope.showTableColumn = function(ev){
		$mdDialog.show({
	      controller: DialogController,
	      templateUrl: 'assets/components/dialogs/dialog-table-column.html',
	      targetEvent: ev,
	    })
	    .then(function(answer) {
			alert('You chose: "' + answer);
	    });
	}
});

function DialogController($scope, $mdDialog) {	      				
	$scope.selectedItem = "oldColumnAssociation";

	$scope.closeModal = function() {
		$mdDialog.hide($scope.selectedItem);
	};
}
