angular.module('Editor.editors.controller', [])

.controller('EditorsCtrl', function ($scope, $window, $mdDialog, $http, IO, $q) {

	// **********************************************
	// S C O P E   P R O P E R T I E S  ( S T A R T )
	// **********************************************

	// Indicates which tab will be shown (0 from left to right)
	$scope.editorTabIndex = 0;

	$scope.showSalvar = false;
	// $scope.showCriar = true;

	// Holds the ID of the new collection chosen
	// by the user
	$scope.userValues = {
		collectionId: ""
	};

	// ***********************************
	// N G - H I D E   P R O P E R T I E S
	// ***********************************

	/**
	 * Use the controller to manipulate DOM elements is far from ideal.
	 * but for this prototype let's just use it for simplicity.
	 */

	// collectionIdInput manipulates the portion of code that displays
	// the input field to change the table's name. 
	// When it's false, the input field is disabled. When
	// it's true, the input field is enabled.
	$scope.collectionIdInput = false;

	// Enables the input field so the user can change the
	// collection's ID
	$scope.editCollectionId = function() {
		$scope.collectionIdInput = true;
	}

	// Calls a function that hits an endpoint to change
	// the collection's ID
	$scope.saveNewCollectionId = function() {
		changeCollectionId($scope.collection.collectionId, $scope.userValues.collectionId);
	}

	$scope.createNewColumn = function(){
		$scope.showSalvar = true;
		// $scope.showCriar = false;
	}

	// ****************************************************************************************

	// message from the iframe
	$window.addEventListener('message', function (event) {

		// parse the data
		var data = JSON.parse(event.data);
		$scope.componentData = data;

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

	// *******************************
	// D I A L O G   F U N C T I O N S
	// ******************************* 

	$scope.showTableCreate = function(ev) {
		$mdDialog.show({
			controller: function($scope, $mdDialog) {
				$scope.hide = function() {
					$mdDialog.hide();
				}
			},
			templateUrl: 'assets/components/dialogs/dialog-table-create.html',
		}).then(function() {
			/*
			 * As soon as the create table modal hides (which means the user
			 * clicked the Ok button), we'll create a new collection in the database.
			 * In order to do that, we'll need $scope.componentData.
			 */
			var createCollectionPromise = createCollectionForComponent($scope.componentData)

			/*
			 * When the API responds, result.data will look something like:
			 *
				 {
					"apiVersion": "1.0",
					"data": {
						"collectionId": "gallery_6178931972863"
					}
				 }
			 *
			 * As soon as we have confirmation that our API was able
			 * to create the collection, we'll use it to fill the $scope
			 * with the information needed to fill out the table.
			 * Note, though, that the result from our API does not
			 * contain the properties of the collection (just the name
			 * of the collection). So we'll need $scope.componentData.dataBlock.properties.
			 */
			createCollectionPromise.then(function(result) {
				$scope.collection = {
					collectionId: result.data.data.collectionId,
					properties: $scope.componentData.blockData.properties
				};
			}, function(err) {

			});

	      // $scope.alert = 'You said the information was "' + answer + '".';
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

	// **********************************
	// D A T A B A S E  F U N C T I O N S
	// **********************************

	/**
	 * Takes the data from a component and creates a new collection
	 * in the user's database.
	 * The componentData looks like the following
	 *
		 {
			"message": "addBlock",
			"blockData": {
				"category": "component",
				"default_collection_name": "gallery",
				"demoUrl": "<path-to>/demo.html",
				"name": "Galeria Mista 1",
				"placeholderUrl": "<path-to>/placeholder.html",
				properties: [
					{
						"default_name": "image",
						"label": "Image",
						"type": "image"
					},
					{ ... }
				],
				tag: "",
				templateUrl: "<path-to>/template.html"
			},
			"surfaceData": {
				"fname": "www/index.html",
				"xPath": "/html/body/ion-pane/ion-content"
			}	
		 }
	 *
	 */
	function createCollectionForComponent(componentData) {
		var deferred = $q.defer();

		var collectionProperties = {};

		componentData.blockData.properties.forEach(function (property) {
			collectionProperties[property.default_name] = {
				name: property.default_name,
				type: property.type,
				typeLabel: property.type,
				required: false,
				id: property.default_name
			};
		});		

		/*
		 * At this point, collectionProperties will look like:
		 *
			 {
				"<property-name>": {
					"name": "<property-name>",
					"type": "<property-type>",
					"typeLabel": "<property-type>",
					"required": <boolean>,
					"id": "<property-name>"
				},
				...
			 }
		 * Next step will be to make a HTTP POST request to create
		 * the collection. And as soon as we get the result, we resolve
		 * the promise we're returning at the bottom with the result.
		 */
		var httpPromise = $http.post('http://localhost:3103/resources', {
			type: 'Collection',
			id: componentData.blockData.default_collection_name,
			properties: collectionProperties
		});

		httpPromise.then(function(result) {
			deferred.resolve(result);
		}, function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	}

	/**
	 * Changes the name (ID) of the given collection (from oldCollectionName to newCollectionName)
	 */
	function changeCollectionId(oldCollectionId, newCollectionId) {
		var putData = {
			"collections": {}
		};

		/*
		 * putData will look like the following:
		 *
		 	{
				"collections": {
					"<old-collection-id>": "<new-collection-id>"
				}		
		 	}
		 */
		putData["collections"][oldCollectionId] = newCollectionId;

		var httpPromise = $http.put('http://localhost:3103/resources', putData);

		httpPromise.then(function(result) {
			alert('Result');
			alert(JSON.stringify(result));
		}, function(err) {
			alert('Error');
			alert(JSON.stringify(err));
		});
	}

	// *******************************************
	// C O M P O N E N T   M A N I P U L A T I O N
	// *******************************************

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








// // GRID
// $scope.myData = [
// 	{name: "Moroni", age: 50},
// 	{name: "Tiancum", age: 43},
// 	{name: "Jacob", age: 27},
// 	{name: "Nephi", age: 29},
// 	{name: "Enos", age: 34}
// ];

// $scope.gridOptions = { data : 'myData' };// $scope.myData is also acceptable but will not update properly. OK to use the object if you don't care about updating the data in the grid.

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