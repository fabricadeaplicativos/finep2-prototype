angular.module('Editor.editors.controller', ['Editor.editors.services', 'Dialog.dialogs.controllers'])

.controller('EditorsCtrl', function ($scope, $window, $mdDialog, $http, IO, $q, DatabaseService, DataService, ValidationService) {


	// QRCode
	// $scope.generateQRCode = function () {
	// 	var qrcode = new QRCode("qrcode", {
	// 	    text: $window.CANVAS_CONFIG.socketHost + ':3100/www#/app/banco-de-dados',
	// 	    width: 128,
	// 	    height: 128,
	// 	    colorDark : "#000000",
	// 	    colorLight : "#ffffff",
	// 	    correctLevel : QRCode.CorrectLevel.H
	// 	});
	// };
	// generate it on startup.
	// $scope.generateQRCode();
	// 
	

	// // BRACKETS EDITOR 
	// setTimeout(function () {
	// 	document.getElementById('text-editor').innerHTML = [
	// 		'<iframe src="http://localhost:3101/brackets/"',
	// 			'style="width: 700px; height: 600px;">',
	// 		'</iframe>'
	// 	].join(' ')
	// }, 10000);



	// ***************************************************
	// S C O P E   P R O P E R T I E S  ( S T A R T - U P)
	// ***************************************************

	// Indicates which tab will be shown (0 from left to right)
	$scope.editorTabIndex = 0;

	$scope.showSalvar = false;
	// $scope.showCriar = true;
	
	$scope.columnToAdd = {type: ''};
	
	// Map strings and types
	$scope.types = [
		{ label: 'tipo'		    , value: ''				},
		{ label: 'texto'		, value: 'string' 		},
		{ label: 'número'		, value: 'number' 		}
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
		var getDocumentsPromise = DatabaseService.getDocumentsOfCollection($scope.collection.collectionId);

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

				/*
				 * There might be some documents that do not have entries for some
				 * properties. If that's the case, angular will not allocate space in
				 * the table so the user can entry new values. Instead, we need to do
				 * some processing before by inserting empty entries for those properties.
				 */
				addEmptyEntryForNewProperties();

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
			IO.connection().emit('reload');

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
		// Let's first validate the new collection name chosen by the user
		$scope.userValues.collectionId = ValidationService.validateName($scope.userValues.collectionId);

		var promise = DatabaseService.changeCollectionId($scope.collection.collectionId, $scope.userValues.collectionId);

		promise.then(function(result) {
			/*
			 * If we just change the collection's name, we'll end up pointing
			 * to the wrong endpoint. Suppose when the user drags a component
			 * the "gallery_123456789" collection is created. In the fab-source
			 * attribute, the URL would be something like "http://localhost:3103/gallery_123456789".
			 * If we just change the collection's name, this URL will continue to be the same
			 * and the canvas will not display the items anymore (because gallery_123456789 will
			 * not existing once the name is changed.) So what we need to do is to emit an event
			 * to change the collection name in this url.
			 */
			IO.connection().emit('changeSourceName', {
				// Durante a primeira fase de testes, vamos deixar hard-coded o nome
				// do arquivo do canvas. Mas a partir do momento que o canvas começar
				// a renderizar mais arquivos HTML que não seja o www/index.html,
				// teremos que partir para uma abordagem dinâmica.
				fname: 'www/templates/banco-de-dados.html',
				oldSourceName: $scope.collection.collectionId,
				newSourceName: result.id
			});

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
	}

	$scope.saveNewColumn = function(){
		
		// Is not editing a database
		if($scope.collection == undefined || $scope.collection.properties == undefined)
			return;
			
		var addColumn = {
			type: $scope.columnToAdd.type,
			default_name: ValidationService.validateName($scope.columnToAdd.label),
			label: $scope.columnToAdd.label
		};
			
		// Empty value
		if(addColumn.type == undefined || addColumn.type == '' || addColumn.default_name == undefined || addColumn.default_name == '') {
			alert('Por favor, preencha o nome da coluna e o tipo.');
			return;
		}
		
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

				/*
				 * Since this is a new property, the documents won't have any data
				 * for that property. Hence, it won't be possible to add data to those
				 * documents, since the HTML lists the content by $scope.collection.data.
				 * To solve that issue, we'll add an empty record for this new column/property
				 * so the user can be able to insert new values.
				 */
				addEmptyEntryForNewProperties();	
			} else {
				console.error('The new column could not be added');
			}
		}, function(err) {
			console.error('There was an error while trying to add a new column');
			console.error(err);
		});
	}

	$scope.cancelColumnCreation = function() {
		$scope.showSalvar = false;
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

	/*
	 * Removes the document located at the given index of $scope.collection.data
	 */
	$scope.removeDocument = function(documentIndex) {
		var showConfirmDialogPromise = $scope.showDeleteDocumentConfirmDialog();

		showConfirmDialogPromise.then(function() {
			var removeDocPromise = DatabaseService.removeDocumentFromCollection(documentIndex, $scope.collection.collectionId, $scope.collection.data);

			removeDocPromise
				.then(function() {
					// First we reload the iframe
					$window.frames[0].location.reload();

					// Then, we remove the document from $scope.collection.data
					// so the database tab can have the changes as well.
					$scope.collection.data.splice(documentIndex, 1);
				}, function(err) {
					alert(JSON.stringify(err));
				});
		});
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

				IO.connection().emit('removeContentForColumnName', {
					columnName: propertyToBeRemoved.default_name,
					fname: 'www/templates/banco-de-dados.html'
				});
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
			$scope.showColumnAssociationDialog(data);
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
				var host = ($window.CANVAS_CONFIG) ? $window.CANVAS_CONFIG.socketHost : 'http://localhost';
				var collectionEndpoint = host + ':3104/' + $scope.collection.collectionId;

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
					IO.connection().emit('addElement', {
						xPath: $scope.componentData.surfaceData.xPath,
						fname: $scope.componentData.surfaceData.fname,
						element: pureHtml
					});

					/*
					 * We'll add two entries in this new table so the user can realize what's
					 * going on.
					 */
					var doc1 = {
						image: 'https://s3.amazonaws.com/finep/images/basic-img.png',
						title: 'Título',
						description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
					};

					var doc2 = {
						image: 'https://s3.amazonaws.com/finep/images/basic-img.png',
						title: 'Título',
						description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
					};

					$scope.saveDocument(doc1);
					$scope.saveDocument(doc2);
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

	$scope.showNewElementDialog = function(ev) {
		$mdDialog.show({
	      controller: 'NewElementController',
	      templateUrl: 'assets/components/dialogs/dialog-new-element.html',
	      targetEvent: ev,
	    })
	    .then(function(selectedItems) {
	    	$scope.columnToAdd = {
	    		label: selectedItems.label,
	    		type: selectedItems.type
	    	};

	    	// Add new column
	    	$scope.saveNewColumn();

	    	insertElementIntoCanvas(ValidationService.validateName(selectedItems.label), selectedItems.elementId);
	    }, function() {
	      $scope.alert = 'You cancelled the dialog.';
	    });
	}

	$scope.showColumnAssociationDialog = function(messageData){
		$mdDialog.show({
	      controller: 'ColumnAssociationController',
	      templateUrl: 'assets/components/dialogs/dialog-column-association.html'
	    })
	    .then(function(dialogResult) {

	    	if (typeof dialogResult !== 'undefined') {

	    		/*
		    	 * If the user chose to associate the added element to a new column,
		    	 * we'll need to do the following:
		    	 *
		    	 * 1 - Send an http post request to our dpd proxy server so we can
		    	 *	   update this collection's config.json file and append this new
		    	 *	   property.
		    	 * 2 - Add this new property in $scope.collection.properties
		    	 * 3 - Add an empty entry for the property in each of the documents in
		    	 *	   $scope.collection.data.
		    	 */
		    	if (dialogResult.option === "newColumnAssociation") {
		    		var property = {
		    			default_name: dialogResult.property,
		    			type: dialogResult.type,
		    			label: dialogResult.label
		    		};

		    		var addNewColumnPromise = DatabaseService.addNewColumn(dialogResult.collection, property);

					addNewColumnPromise.then(function(result) {
						if (typeof result.status !== 'undefined') {
							/*
							 * We'll only add the new column to $scope.collection in case
							 * we manage to insert it into its collection's config.json.
							 */
							$scope.collection.properties.push(property);

							
				    		// See explanation of this function right before its declaration
				    		// to understand what it does. 
				    		addEmptyEntryForNewProperties();	
						} else {
							console.error('The new column could not be create');
							console.error(result);
						}
					}, function(err) {
						console.error('There was an error while trying to create the new column');
						console.error(err);
					});
		    	}

		    	// insert static content
		    	if (dialogResult.option === 'manualEdition') {

		    		// Object {option: "manualEdition", staticContent: "33333"}
		    		// {"message":"addBlock","blockData":{"name":"h1","tag":"","templateUrl":"http://localhost:3000/api/elements/titles/h1/template.html","demoUrl":"http://localhost:3000/api/elements/titles/h1/demo.html","placeholderUrl":"http://localhost:3000/api/elements/titles/h1/placeholder.html","category":"element"},"surfaceData":{"xPath":"/ion-view/ion-content","fname":"www/templates/banco-de-dados.html"}}
		    		
		    		$http.get(messageData.blockData.templateUrl)
		    			.then(function (res) {

		    				var templateSrc = res.data;

		    				// compile template
		    				var templateFn = _.template(templateSrc);

		    				// generate the final html
		    				var finalHtml = templateFn({ value: dialogResult.staticContent });

		    				console.log(finalHtml);

		    				// add the html to the code
		    				IO.connection().emit('addElement', {
		    					xPath: messageData.surfaceData.xPath,
		    					fname: messageData.surfaceData.fname,
		    					element: finalHtml,
		    				});
		    			}, function (e) {
		    				alert('failed to add element');

		    				throw e;
		    			});

		    		// console.log(dialogResult);
		    		// console.log(JSON.stringify(messageData));
		    	}

		    	/*
		    	 * If the user chose an existing column, we'll need to firstly append
		    	 * the HTML to the canvas frame.
		    	 */
		    	if (typeof dialogResult.property !== 'undefined') {
		    		var existingColumnName = dialogResult.property;
		    		var blockData = $scope.componentData.blockData;

		    		if ((blockData.name === 'h1') ||
		    			(blockData.name === 'h2') ||
		    			(blockData.name === 'h3') ||
		    			(blockData.name === 'h4') ||
		    			(blockData.name === 'p')) {

		    			var finalHtml = '<' + blockData.name + '>{{item.' + existingColumnName + '}}</' + blockData.name + '>';

						IO.connection().emit('addElement', {
							xPath: $scope.componentData.surfaceData.xPath,
							fname: $scope.componentData.surfaceData.fname,
							element: finalHtml,
						})	    			
		    		} else if (blockData.name === 'image') {
		    			var finalHtml = '<img src="{{item.' + existingColumnName + '}}">';

						IO.connection().emit('addElement', {
							xPath: $scope.componentData.surfaceData.xPath,
							fname: $scope.componentData.surfaceData.fname,
							element: finalHtml,
						});
		    		}
		    	}
	    	}
	    });
	}

	$scope.showDeleteDocumentConfirmDialog = function() {
		var deferred = $q.defer();

		var confirm = $mdDialog.confirm()
				      .parent(angular.element(document.body))
				      .title('Gostaria de deletar este item da galeria?')
				      .content('Essa operação não poderá ser desfeita.')
				      .ariaLabel('Lucky day')
				      .ok('Sim')
				      .cancel('Não');

		$mdDialog.show(confirm)
			.then(function() {
				deferred.resolve();
			}, function() {
				deferred.reject();
			});

		return deferred.promise;
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

					IO.connection().emit('addElement', {
						xPath: surfaceData.xPath,
						fname: surfaceData.fname,
						element: finalHtml,
					})

				})
		});
	}

	/*
	 * When a new column/property is created, the documents
	 * in $scope.collection.data don't have an entry for this
	 * new property/column. So what this function does is to
	 * add an empty entry for this new property/column in each document.
	 */
	function addEmptyEntryForNewProperties() {
		$scope.collection.data.forEach(function(doc) {

			for (var i = 0; i < $scope.collection.properties.length; i++) {
				var default_name = $scope.collection.properties[i].default_name;

				var propertyFound = _.find(doc, function(p) {
					/*
					 * p looks like:
					 *
					 	{
							"property_name": "title",
							"property_value": "um titulo qualquer"
					 	}
					 *
					 * What we need to do is: given a property name (which is stored
					 * inside property_name), we need to find this property inside doc
					 */
					 return p.property_name === default_name;
				});

				if (typeof propertyFound === 'undefined') {
					/*
					 * Since the underlying doc does not have an entry
					 * for the current property, we'll add an empty entry so
					 * the table allocates a space to a possible new entry.
					 */
					var emptyEntry = {
						property_name: default_name,
						property_value: ""
					};

					doc.push(emptyEntry);
				}
			}
		});
	}

	function insertElementIntoCanvas(property_name, elementId) {
		/*
		 * For now, we'll leave it hard-coded, but in a near future the idea
		 * is to get the element's template somehow.
		 */
		var finalHtml = '';

		if ((elementId === 'h1') ||
			(elementId === 'h2') ||
			(elementId === 'h3') ||
			(elementId === 'h4') ||
			(elementId === 'p')) {

			finalHtml = '<' + elementId + '>{{item.' + property_name + '}}</' + elementId + '>';	    			
		} else if (elementId === 'image') {
			finalHtml = '<img src="{{item.' + property_name + '}}">';
		}

		IO.connection().emit('addElement', {
			xPath: '/ion-view/ion-content/div/a',
          	fname: 'www/templates/banco-de-dados.html',
			element: finalHtml,
		});
	}

});

// function DialogController($scope, $mdDialog) {	
// 	$scope.hideOldColumn = false;
// 	$scope.hideNewColumn = true;
// 	$scope.hideManualEdition = true;

// 	$scope.answer = {
// 		selectValue: "",
// 		selectedItem: "oldColumnAssociation",
// 		content: 'oi'
// 	};

// 	$scope.closeModal = function() {
// 		$mdDialog.hide($scope.answer);
// 	};

// 	$scope.radioButtonSelected = function() {
// 		if ($scope.answer.selectedItem === "oldColumnAssociation") {
// 			$scope.hideOldColumn = false;
// 			$scope.hideNewColumn = true;
// 			$scope.hideManualEdition = true;			
// 		} else if ($scope.answer.selectedItem === "newColumnAssociation") {
// 			$scope.hideOldColumn = true;
// 			$scope.hideNewColumn = false;
// 			$scope.hideManualEdition = true;
// 		} else {
// 			$scope.hideOldColumn = true;
// 			$scope.hideNewColumn = true;
// 			$scope.hideManualEdition = false;
// 		}
// 	}
// }








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
