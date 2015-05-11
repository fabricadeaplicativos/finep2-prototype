angular.module('Editor.editors.controller', ['Editor.editors.services'])

.controller('EditorsCtrl', function ($scope, $window, $mdDialog, $http, IO, $q, DatabaseService, DataService) {

	// **********************************************
	// S C O P E   P R O P E R T I E S  ( S T A R T )
	// **********************************************

	// Indicates which tab will be shown (0 from left to right)
	$scope.editorTabIndex = 0;

	$scope.showSalvar = false;
	// $scope.showCriar = true;
	
	$scope.columnToAdd = {type: ''};
	
	// Map strings and types
	$scope.types = [
		{ label: 'tipo'		    , value: ''				},
		{ label: 'texto'		, value: 'string' 		},
		{ label: 'imagem'		, value: 'image' 		},
		{ label: 'número'		, value: 'number' 		},
		{ label: 'boolean'		, value: 'boolean' 		},
		{ label: 'data'		    , value: 'date'			},
		{ label: 'localização'	, value: 'localization'	}
	];

	// Holds all the values that are input by the user (collection ID,
	// the document that is to be inserted and edited etc).
	$scope.userValues = {
		collectionId: "",
		documentToBeInserted: {},
		documentToBeEdited: {},
	};

	/*
	 * Holds all the relevant information about the collection that
	 * is being displayed (its ID, properties, data, etc).
	 * Here's an example of what $scope.collection would look like:
	 *
	 	{
			collectionId: "gallery_65178299172",
			properties: [
				{
					"default_name": "title",
					"type": "string",
					"label": "Title"
				},
				{
					"default_name": "description",
					"type": "string",
					"label": "Description"
				},
				{...}
			],
			data: [
				[
					{"propert_name": "title", "property_value": "This is the title of item 1"},
					{"propert_name": "description", "property_value": "This is the description of item 1"},
					{...}
				],
				[
					{"propert_name": "title", "property_value": "This is the title of item 2"},
					{"propert_name": "description", "property_value": "This is the description of item 2"},
					{...}
				],
			]
	 	}
	 */
	$scope.collection = {
		collectionId: "",
		properties: [],
		data: []
	};

	/*
	 * Holds a reference to the row that should be edited (by placing inputs instead of spans).
	 * This "reference" is just the index at which the row is located in $scope.collection.data
	 */
	$scope.documentIndexToBeEdited = -1;

	// *******************************
	// S T A R T - U P   A C T I O N S
	// *******************************

	/* 
	 * On start-up, we'll need to fetch the data from our database
	 * in order to populate $scope.collection. 
	 * NOTE: the API endpoint we'll be calling will only bring
	 * the name of the last added component's collection (so our $scope.collection
	 * does not get messy).
	 */
	var lastCollectionPromise = DatabaseService.getLastCollection();

	lastCollectionPromise.then(function(collection) {
		$scope.collection.collectionId = collection.collectionId;
		$scope.collection.properties = DatabaseService.sortProperties(collection.properties);

		/*
		 * Then, we'll need to fetch the documents for the last collection created.
		 */
		var getDocumentsPromise = DatabaseService.getDocuments($scope.collection.collectionId);

		getDocumentsPromise
			.then(function(result) {
				/*
				 * result looks like:
				 *
				 	[
						{"<property-name1>": "<property-value1>", "<property-name2>": "<property-value2>"},
						{"<property-name1>": "<property-value1>", "<property-name2>": "<property-value2>"},
						{"<property-name1>": "<property-value1>", "<property-name2>": "<property-value2>"},
				 	]
				 *
				 * Each one of the documents in the array has an id property. We need to remove it
				 * from each document because $scope.collection.data does not expect IDs.
				 */
				result.forEach(function(doc) {
					// delete doc["id"];

					// Add doc to $scope.collection.data
					$scope.collection.data = DataService.pushDocument(doc, $scope.collection.properties);
				});

			}, function(err) {
				console.error('Error while trying to get documents');
				console.error(JSON.stringify(err));
			});
	}, function(err) {
		console.error('Error while trying to get collections');
		console.error(JSON.stringify(err));
	});

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

	$scope.saveNewDocument = function() {
		$scope.saveDocument($scope.userValues.documentToBeInserted);

		// Clears the new-document input fields
		$scope.userValues.documentToBeInserted = {};
	}

	$scope.saveEditedDocument = function() {
		$scope.saveDocument($scope.userValues.documentToBeEdited);

		// Clears the edit-document input fields
		$scope.userValues.documentToBeEdited = {};

		// As soon as the document is saved, we'll remove the input
		// fields so the user cannot edit the document.
		$scope.preventDocumentFromBeingEdited();
	}

	/**
	 * Sets the index of the document to be edited to -1.
	 * By doing that, we're removing the input fields preventing
	 * a row from being edited.
	 */
	$scope.preventDocumentFromBeingEdited = function() {
		$scope.documentIndexToBeEdited = -1;
	}

	/**
	 * Saves the given document to the database.
	 * The reason why this function returns a promise is that there might be
	 * methods that want to know whether or not the document could be save, so
	 * they can act accordingly.
	 */
	$scope.saveDocument = function(doc) {
		var deferred = $q.defer();

		var promise = DatabaseService.insertNewDocument($scope.collection.collectionId, doc);

		promise.then(function(result) {
			// Reloads the canvas iframe
			window.frames[0].location.reload();

			// If result does not have all the properties the document is intended
			// to have, we'll add a "***" string to these missing properties.
			for (var i = 0; i < $scope.collection.properties.length; i++) {
				if (!result.hasOwnProperty($scope.collection.properties[i].default_name)) {
					result[$scope.collection.properties[i].default_name] = "***";
				}
			}

			/*
			 * DataService.pushDocument sorts the given doc in alphabetical
			 * order and returns it.
			 * We'll save it into $scope.collection.data so our HTML can have
			 * access to it.
			 */
			$scope.collection.data = DataService.pushDocument(result, $scope.collection.properties);

			deferred.resolve();
		}, function(err) {
			console.error('Error while trying to save the inserted document');
			console.error(JSON.stringify(err));

			deferred.reject();
		});

		return deferred.promise;
	}

	// Calls a function that hits an endpoint to change
	// the collection's ID
	$scope.saveNewCollectionId = function() {
		var promise = DatabaseService.changeCollectionId($scope.collection.collectionId, $scope.userValues.collectionId);

		promise.then(function(result) {
			// Save the new collection name in $scope.collection.collectionId
			$scope.collection.collectionId = result.id;
			$scope.collectionIdInput = false;
		}, function(err) {
			console.error('SAVE NEW COLLECTION ID ERROR');
			console.error(JSON.stringify(err));
		})
	}

	$scope.createNewColumn = function(){
		$scope.showSalvar = true;
		// $scope.showCriar = false;
	}

	$scope.saveNewColumn = function(){
		
		// Is not editing a database
		if($scope.collection == undefined || $scope.collection.properties == undefined)
			return;
			
		var addColumn = {
			type: $scope.columnToAdd.type,
			default_name: $scope.columnToAdd.label,
			label: $scope.columnToAdd.type
		};
			
		// Empty value
		if(addColumn.type == undefined || addColumn.type == '' || addColumn.default_name == undefined || addColumn.default_name == '')
			return;
		
		$scope.showSalvar = false;
		$scope.columnToAdd = {type: ''};

		var promise = DatabaseService.addNewColumn($scope.collection.collectionId, addColumn);

		promise.then(function(result) {
			if (typeof result.status !== 'undefined') {
				/*
				 * We'll only add the new column to $scope.collection in case
				 * we manage to insert it into its collection's config.json.
				 */
				$scope.collection.properties.push(addColumn);
			} else {
				console.error('The new column could not be added');
			}
		}, function(err) {
			console.error('There was an error while trying to add a new column');
			console.error(err);
		});
	}

	$scope.editContent = function(docIndex) {
		$scope.documentIndexToBeEdited = docIndex;

		/*
		 * Now that we know which document in $scope.collection.data should be edited,
		 * we have to fill $scope.userValues.documentToBeEdited with the underlying
		 * document's content. Why? Because the input tag that is going to be shown up
		 * has an ng-model attribute whose value is userValues.documentToBeEdited[property.property_name].
		 * So, since when the user is not editing anything documentToBeEdited is an empty object,
		 * if it's not filled with the underlying document's content, the input fields will be empty, with no data.
		 * And what we really want is that the document's content show up in the input fields.
		 */
		var doc = $scope.collection.data[docIndex];

		doc.forEach(function(property) {
			$scope.userValues.documentToBeEdited[property.property_name] = property.property_value;
		});
	}

	$scope.shouldBeShown = function(docIndex) {
		return docIndex === $scope.documentIndexToBeEdited;
	}

	$scope.removeProperty = function(propertyToBeRemoved) {
		console.log(JSON.stringify($scope.collection.properties));

		var removePropertyPromise = DatabaseService.removePropertyFromCollection($scope.collection.collectionId, propertyToBeRemoved.default_name);

		removePropertyPromise
			.then(function() {
				/*
				 * When removing a property, we need to do two things:
				 *
				 * 1 - remove the property from each array inside $scope.collection.data
				 * 2 - remove the object of that property in $scope.collection.properties.
				 */
				var data = $scope.collection.data;

				// 1
				for (var i = 0; i < data.length; i++) {
					for (var j = 0; j < data[i].length; j++) {
						if (data[i][j].property_name === propertyToBeRemoved.default_name) {
							// Now that we located the property to be removed, we'll just remove
							// it from data
							data[i].splice(j, 1);
						}
					}
				}

				var properties = $scope.collection.properties;

				// 2
				for (var i = 0; i < properties.length; i++) {
					var propertyObject = properties[i];

					if (propertyObject.default_name === propertyToBeRemoved.default_name) {
						properties.splice(i, 1);
					}
				}

				// Data has got the updated list of properties. We still need to assign it
				// back to $scope.collection.data
				$scope.collection.data = data;

				// Same goes to $scope.collection.properties
				$scope.collection.properties = properties;

				console.log(JSON.stringify($scope.collection.properties));
			}, function(err) {
				console.error('REMOVE COLUMN ERROR');
				console.error(JSON.stringify(err));
			});
	}

	// *****************************
	// E V E N T   L I S T E N E R S
	// ***************************** 

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
				$scope.collection.properties = DatabaseService.sortProperties($scope.componentData.blockData.properties);

				/*
				 * Now that we have created a collection in the database, we can insert the
				 * component's template onto the canvas so it can start fetching the documents
				 * NOTE: if there's no document in the database for that collection, the canvas
				 * will be blank. As soon as the user adds documents, it should refresh itself.
				 */
				var collectionEndpoint = 'http://localhost:3104/' + $scope.collection.collectionId;

				var templatePromise = $http.get($scope.componentData.blockData.templateUrl);

				templatePromise.then(function(result) {
					var templateHtml = result.data;

					/*
					 * buildComponentTemplate is a function that transforms
					 * the given template html in _.template() into a pure
					 * html. That is, if there's a line in the templateHtml like:
					 *
					 	<div fab-source="<%= source %>">
					 *
					 * collectionEndpoint is "http://localhost:3104/gallery_7ayiuhskjd", and
					 * we call buildComponentTemplate({
									source: collectionEndpoint
					 		   })
					 * The resulting HTML will be as follows:
					 *
					 	 <div fab-source="http://localhost:3104/gallery_7ayiuhskjd">
					 */
					var buildComponentTemplate = _.template(templateHtml);

					var pureHtml = buildComponentTemplate({
						source: collectionEndpoint
					});

					/*
					 * Now that we have the final HTML, we'll emit an event
					 * so our socket server can notice we have new HTML to put
					 * into our canvas.
					 */
					IO.emit('addElement', {
						xPath: $scope.componentData.surfaceData.xPath,
						fname: $scope.componentData.surfaceData.fname,
						element: pureHtml
					});
				}, function(err) {
					alert('Error while trying to get the component\'s HTML template');
				});

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
