angular.module('Editor.editors.controller', ['Editor.editors.services'])

.controller('EditorsCtrl', function ($scope, $window, $mdDialog, $http, IO, $q, DatabaseService, DataService) {

	// **********************************************
	// S C O P E   P R O P E R T I E S  ( S T A R T )
	// **********************************************

	// Indicates which tab will be shown (0 from left to right)
	$scope.editorTabIndex = 0;

	$scope.showSalvar = false;
	// $scope.showCriar = true;

	// Holds all the values that are input by the user (collection ID,
	// the document that is to be inserted etc).
	$scope.userValues = {
		collectionId: "",
		documentToBeInserted: {}
	};

	// Holds all the relevant information about the collection that
	// is being displayed (its ID, properties, data, etc).
	$scope.collection = {
		collectionId: "",
		properties: [],
		data: []
	};

	// **********************************************************
	// N G - H I D E   P R O P E R T I E S  A N D   M E T H O D S
	// **********************************************************

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

	$scope.saveData = function() {
		var promise = DatabaseService.insertNewDocument($scope.collection.collectionId, $scope.userValues.documentToBeInserted);

		promise.then(function(result) {
			// If result does not have all the properties the document is intended
			// to have, we'll add a "***" string to these missing properties.
			for (var i = 0; i < $scope.collection.properties.length; i++) {
				if (!result.hasOwnProperty($scope.collection.properties[i].default_name)) {
					result[$scope.collection.properties[i].default_name] = "***";
				}
			}

			// Let's delete the id because the user does not have to know
			// that it's there. Nor must he be able to change it.
			delete result["id"];

			/*
			 * DataService.pushDocument sorts the given doc in alphabetical
			 * order and returns it.
			 * We'll save it into $scope.collection.data so our HTML can have
			 * access to it.
			 */
			$scope.collection.data = DataService.pushDocument(result);
			
			// Let's clean up the input fields
			$scope.userValues.documentToBeInserted = {};
		}, function(err) {
			alert('SAVE DATA ERROR');
			alert(JSON.stringify(err));
		});
	}

	// Calls a function that hits an endpoint to change
	// the collection's ID
	$scope.saveNewCollectionId = function() {
		var promise = DatabaseService.changeCollectionId($scope.collection.collectionId, $scope.userValues.collectionId);

		promise.then(function(result) {
			// Save the new collection name in $scope.collection.collectionId
			$scope.collection.collectionId = result.id;
			$scope.collectionIdInput = false;

			alert('SAVE NEW COLLECTION ID RESULT');
			alert(JSON.stringify(result));
		}, function(err) {
			alert('SAVE NEW COLLECTION ID ERROR');
			alert(JSON.stringify(err));
		})
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
			var createCollectionPromise = DatabaseService.createCollectionForComponent($scope.componentData)

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
				$scope.collection.collectionId = result.data.collectionId;
				$scope.collection.properties = $scope.componentData.blockData.properties;
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

// **********************************
// // D A T A B A S E  F U N C T I O N S
// // **********************************

// /**
//  * Takes the data from a component and creates a new collection
//  * in the user's database.
//  * The componentData looks like the following
//  *
// 	 {
// 		"message": "addBlock",
// 		"blockData": {
// 			"category": "component",
// 			"default_collection_name": "gallery",
// 			"demoUrl": "<path-to>/demo.html",
// 			"name": "Galeria Mista 1",
// 			"placeholderUrl": "<path-to>/placeholder.html",
// 			properties: [
// 				{
// 					"default_name": "image",
// 					"label": "Image",
// 					"type": "image"
// 				},
// 				{ ... }
// 			],
// 			tag: "",
// 			templateUrl: "<path-to>/template.html"
// 		},
// 		"surfaceData": {
// 			"fname": "www/index.html",
// 			"xPath": "/html/body/ion-pane/ion-content"
// 		}	
// 	 }
//  *
//  */
// function createCollectionForComponent(componentData) {
// 	var deferred = $q.defer();

// 	var collectionProperties = {};

// 	componentData.blockData.properties.forEach(function (property) {
// 		collectionProperties[property.default_name] = {
// 			name: property.default_name,
// 			type: property.type,
// 			typeLabel: property.type,
// 			required: false,
// 			id: property.default_name
// 		};
// 	});		

// 	/*
// 	 * At this point, collectionProperties will look like:
// 	 *
// 		 {
// 			"<property-name>": {
// 				"name": "<property-name>",
// 				"type": "<property-type>",
// 				"typeLabel": "<property-type>",
// 				"required": <boolean>,
// 				"id": "<property-name>"
// 			},
// 			...
// 		 }
// 	 * Next step will be to make a HTTP POST request to create
// 	 * the collection. And as soon as we get the result, we resolve
// 	 * the promise we're returning at the bottom with the result.
// 	 */
// 	var httpPromise = $http.post('http://localhost:3103/resources', {
// 		type: 'Collection',
// 		id: componentData.blockData.default_collection_name,
// 		properties: collectionProperties
// 	});

// 	httpPromise.then(function(result) {
// 		deferred.resolve(result);
// 	}, function(err) {
// 		deferred.reject(err);
// 	});

// 	return deferred.promise;
// }

// /**
//  * Changes the name (ID) of the given collection (from oldCollectionName to newCollectionName)
//  */
// function changeCollectionId(oldCollectionId, newCollectionId) {
// 	var httpPromise = $http.get('http://localhost:3103/' + oldCollectionId + '/config');

// 	httpPromise.then(function(result) {
// 		var putData = result.data.data;
// 		putData.id = newCollectionId;

// 		var req = {
// 			method: 'PUT',
// 			url: 'http://localhost:3104/__resources/' + oldCollectionId,
// 			headers: {
// 				'Content-Type': 'application/json',
// 				'dpd-ssh-key': '98asuhjnd'
// 			},
// 			data: putData
// 		};

// 		$http(req)
// 			.then(function(result) {
// 				$scope.collection.collectionId = newCollectionId;
// 				$scope.collectionIdInput = false;
// 			}, function(err) {
// 				alert('Error DATA RETURN');
// 				alert(JSON.stringify(err));		
// 			});
// 	}, function(err) {
// 		alert('Error');
// 		alert(JSON.stringify(err));
// 	});
// }

// function insertNewDocument() {
// 	alert($scope.collection.collectionId);
// 	alert(JSON.stringify($scope.userValues.documentToBeInserted))
// 	alert('http://localhost:3103/' + $scope.collection.collectionId);

// 	$http.post('http://localhost:3104/' + $scope.collection.collectionId, $scope.userValues.documentToBeInserted)
// 		.then(function(result) {
// 			alert('Result');
// 			alert(JSON.stringify(result));
// 		}, function(err) {
// 			alert('Error');
// 			alert(JSON.stringify(err));
// 		});
// }