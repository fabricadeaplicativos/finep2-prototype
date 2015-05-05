angular.module('Editor.editors.controller', [])

.controller('EditorsCtrl', function ($scope, $window, $mdDialog, $http, IO) {

	/**
	 * Takes the data from a component and creates a new collection
	 * in the user's database.
	 */
	function createCollectionForComponent(componentData) {

	}

	// RESPONSIBLE FOR LOADING THE template for the component and
	// compiling it
	// and adding it to the source code 
	function addComponentToSource(collectionId) {

	}

	// Responsible for a component
	function addComponent(componentData, surfaceData) {

		var collectionProperties = {};

		componentData.properties.forEach(function (prop) {

			collectionProperties[prop.default_name] = {
				name: prop.default_name,
				type: prop.type,
				typeLabel: prop.type,
				required: false,
				id: prop.default_name
			};
		});

		$http.post('http://localhost:3103/resources', {
			type: 'Collection',
			id: componentData.default_collection_name,
			properties: collectionProperties
		}).then(function (res) {

			// get the collectionId
			var collectionId = res.data.data.collectionId;

			// build the API endpoint
			var collectionEndpoint = 'http://localhost:3104/' + collectionId;

			// load the component template
			$http.get(componentData.templateUrl)
				.then(function (res) {
					// get the template from the response
					var componentTemplateFn = _.template(res.data);

					// compile the element to be added
					var finalHtml = componentTemplateFn({
						source: collectionEndpoint
					});

					IO.emit('addElement', {
						xPath: surfaceData.xPath,
						fname: surfaceData.fname,
						element: finalHtml,
					})

				})
		});


		// use existing collection
		// load the component template

		// build the API endpoint
		// var collectionEndpoint = 'http://localhost:3104/' + collectionId;
		
		// $http.get(componentData.templateUrl)
		// 	.then(function (res) {
		// 		// get the template from the response
		// 		var componentTemplateFn = _.template(res.data);

		// 		// compile the element to be added
		// 		var finalHtml = componentTemplateFn({
		// 			source: collectionEndpoint
		// 		});

		// 		IO.emit('addElement', {
		// 			xPath: surfaceData.xPath,
		// 			fname: surfaceData.fname,
		// 			element: finalHtml,
		// 		})

		// 	})


	}


	// message from the iframe
	$window.addEventListener('message', function (event) {

		// parse the data
		var data = JSON.parse(event.data);

		console.log(data);

		// set active editor
		$scope.editorTabIndex = 0;

		$scope.$apply();

		if (data.blockData.category === 'component') {
			$scope.showTableCreate();
			// addComponent(data.blockData, data.surfaceData);
		} else {
			$scope.showTableColumn();
		}

	}, false);

	$scope.editorTabIndex = 0;


	$scope.showSalvar = false;
	// $scope.showCriar = true;


	$scope.createNewColumn = function(){
		$scope.showSalvar = true;
		// $scope.showCriar = false;

	}


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
					  $scope.closeModal = function(answer) {
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
					  $scope.closeModal = function(answer) {
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
			alert('You chose: "' + JSON.stringify(answer));
	    });
	}
});

function DialogController($scope, $mdDialog) {	
	$scope.hideOldColumn = false;
	$scope.hideNewColumn = true;
	$scope.hideManualEdition = true;

	$scope.answer = {
		selectValue: "",
		selectedItem: "oldColumnAssociation"
	};

	$scope.closeModal = function() {
		$mdDialog.hide($scope.answer);
	};

	$scope.radioButtonSelected = function() {
		if ($scope.answer.selectedItem === "oldColumnAssociation") {
			$scope.hideOldColumn = false;
			$scope.hideNewColumn = true;
			$scope.hideManualEdition = true;			
		} else if ($scope.answer.selectedItem === "newColumnAssociation") {
			$scope.hideOldColumn = true;
			$scope.hideNewColumn = false;
			$scope.hideManualEdition = true;
		} else {
			$scope.hideOldColumn = true;
			$scope.hideNewColumn = true;
			$scope.hideManualEdition = false;
		}
	}
}
