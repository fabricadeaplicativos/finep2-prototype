angular.module('Editor.editors.services', [])

.factory('DatabaseService', [
	'$http',
	'$q',
	function($http, $q) {
		var databaseService = {};

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
		databaseService.createCollectionForComponent = function(componentData) {
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
				deferred.resolve(result.data);
			}, function(err) {
				deferred.reject(err);
			});

			return deferred.promise;
		}

		/**
		 * Changes the name (ID) of the given collection (from oldCollectionName to newCollectionName)
		 */
		databaseService.changeCollectionId = function(oldCollectionId, newCollectionId) {
			var deferred = $q.defer();

			var httpPromise = $http.get('http://localhost:3103/' + oldCollectionId + '/config');

			httpPromise.then(function(result) {
				var putData = result.data.data;
				putData.id = newCollectionId;

				var req = {
					method: 'PUT',
					url: 'http://localhost:3104/__resources/' + oldCollectionId,
					headers: {
						'Content-Type': 'application/json',
						'dpd-ssh-key': '98asuhjnd'
					},
					data: putData
				};

				$http(req)
					.then(function(result) {
						deferred.resolve(result.data);
					}, function(err) {
						deferred.reject(err);
					});
			}, function(err) {
				deferred.reject(err);
			});

			return deferred.promise;
		}

		databaseService.insertNewDocument = function(collectionId, documentToBeInserted) {
			var deferred = $q.defer();

			$http.post('http://localhost:3104/' + collectionId, documentToBeInserted)
				.then(function(result) {
					deferred.resolve(result.data);
				}, function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}

		databaseService.sortProperties = function(properties) {
			var sortedProperties = [];

			for (var i = 0; i < properties.length; i++) {
				var property = properties[i];

				sortedProperties.push(property);
			}

			sortedProperties.sort(function(a, b) {
				if (a.default_name > b.default_name) {
					return 1;
				} else if (a.default_name < b.default_name) {
					return -1;
				}

				// a must be equal to b
				return 0;
			});

			return sortedProperties;
		}

		databaseService.addNewColumn = function(collectionId, column) {
			var deferred = $q.defer();

			var newProperty = {
				"name": column.default_name,
				"type": column.type,
				"typeLabel": column.type,
				"required": false,
				"id": column.default_name
			};

			var putData = {};
			putData[column.default_name] = newProperty;

			var httpPromise = $http.put('http://localhost:3103/resources/' + collectionId, putData);

			httpPromise.then(function(result) {
				deferred.resolve(result.data);
			}, function(err) {
				deferred.reject(err);
			});			

			return deferred.promise;
		}

		/*
		 * Gets the last collection created by the user.
		 * This will be needed to fill out the database tab.
		 */ 
		databaseService.getLastCollection = function() {
			var deferred = $q.defer();

			var getData = {
				method: 'GET',
				url: 'http://localhost:3103/resources',
				headers: {
					'Content-Type': 'application/json'
				}
			};

			/*
			 * Firstly, we get all the collections created by the user and
			 * use only the last one.
			 */
			$http(getData)
				.then(function(result) {
					var collectionId = result.data.data[0];

					/*
					 * Now that we have the last collection created, we'll get its
					 * configuration in order to resolve the pending promise.
					 */
					$http.get('http://localhost:3103/' + collectionId + '/config')
						.then(function(result) {
							var config = result.data.data;
							var collection = {
								collectionId: collectionId,
								properties: []
							};

							/*
							 * config looks like the following:
							 *
								 {
									"type": "Collection",
									"properties": {
										"<property-name>": {
											"name": "<property-name>",
											"type": "<property-type>",
											"typeLabel": "<property-type>",
											"required": <boolean>,
											"id": "<property-name>"
										}
									}
								 }
							 *
							 * But "properties" cannot be like that in $scope.collection.
							 * It needs to be something like:
							 *
							 	{
									"properties": [
										{
											"default_name": "<property-name>", 
											"type": "<property-type>",
											"label": "<property-type>"
										}
									]
							 	}
							 */
							for (var property in config.properties) {
								var finalProperty = {
									default_name: config.properties[property].name,
									type: config.properties[property].type,
									label: config.properties[property].name,
									order: config.properties[property].order
								};

								collection.properties.push(finalProperty);
							}

							deferred.resolve(collection);
						}, function(err) {
							deferred.reject(err);
						});
				}, function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}

		databaseService.getDocumentsOfCollection = function(collectionId) {
			var deferred = $q.defer();

			$http.get('http://localhost:3104/' + collectionId)
				.then(function(result) {
					deferred.resolve(result.data);
				}, function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}

		databaseService.removePropertyFromCollection = function(collectionId, property_name) {
			var deferred = $q.defer();

			var httpPromise = $http.get('http://localhost:3103/' + collectionId + '/config');

			httpPromise.then(function(result) {
				var config = result.data.data;

				// Delete property from the config object.
				delete config.properties[property_name];

				var putData = {};
				putData.properties = config.properties;

				var req = {
					method: 'PUT',
					url: 'http://localhost:3104/__resources/' + collectionId,
					headers: {
						'Content-Type': 'application/json',
						'dpd-ssh-key': '98asuhjnd'
					},
					data: putData
				};

				$http(req)
					.then(function(result) {
						deferred.resolve();
					}, function(err) {
						deferred.reject(err);
					});
			}, function(err) {
				deferred.reject(err);
			});

			return deferred.promise;
		}

		databaseService.removeDocumentFromCollection = function(documentIndex, collectionId, data) {
			var deferred = $q.defer();

			var documentId = undefined;

			// This for loop gets the ID of the document to be removed
			for (var i = 0; i < data[documentIndex].length; i++) {
				var obj = data[documentIndex][i];

				if (obj.property_name === "id") {
					documentId = obj.property_value;
				}
			}

			var req = {
				method: 'DELETE',
				url: 'http://localhost:3104/' + collectionId + '/' + documentId,
				headers: {
					'Content-Type': 'application/json',
					'dpd-ssh-key': '98asuhjnd'
				}
			};

			$http(req)
				.then(function(result) {
					deferred.resolve();
				}, function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}

		/*
		 * Gets all the collections that were created.
		 * The response looks like the following:
		 *
		 	[
				{
					"type": "Collection",
					"id": "<collection-name>",
					"properties": { <properties> }
				},
				{ ... }
		 	]
		 */
		databaseService.getCollections = function() {
			var deferred = $q.defer();

			$http.get('http://localhost:3103/resources/config')
				.then(function(result) {
					deferred.resolve(result.data.data);
				}, function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}

		return databaseService;
	}
])

.factory('DataService', function() {
	var dataService = {};
	var data = [];

	/*
	 * Find the ID of the given doc.
	 * Here's an example of what doc should look like:
	 *
	 	[
			{"<property_name>": "<property_value>"},
			{"<property_name>": "<property_value>"},
			{"<property_name>": "<property_value>"},
			{...}
	 	]
	 */
	var findDocumentId = function(doc) {
		var documentId = undefined;

		doc.forEach(function(property) {
			if (property.property_name === "id") {
				documentId = property.property_value;
			}
		});

		return documentId;
	}

	dataService.pushDocument = function(doc, properties) {
		/*
		 * When a user removes a property from a collection, Deployd only removes this
		 * property from the config.json file. It does not remove the property from the
		 * database. This means that when you hit the endpoint of a collection, Deployd returns
		 * all the documents and each document still has the data for the property that should've
		 * been removed. So what we need to do firstly is to match the properties in the properties
		 * parameters with the doc parameters, which means that if the "doc" has 4 properties and "properties" 
		 * has only one, "doc" should have just 1 property as well.
		 */
		var existingProperties = [];

		properties.forEach(function(element) {
			existingProperties.push(element.default_name);
		});

		for (var prop in doc) {
			// The only property we cannot delete is the "id", because although it's
			// not displayed to the user, we use it everywhere.
			if ((existingProperties.indexOf(prop) < 0) &&
				(prop !== "id")) {
				delete doc[prop];
			}
		}

		/*
		 * Firstly, we'll need to sort the incoming doc's properties
		 * in alphabetical order. To do that, we'll iterate through
		 * the doc's properties and push them into the sortedProperties
		 * array. Then we'll sort it using the sort() native javascript array function.
		 */
		var sortedProperties = [];

		for (var property in doc) {
			sortedProperties.push(property);
		}

		/*
		 * properties looks like the following:
		 *
		 	[
				{
					default_name: "...",
					type: "...",
					label: "...",
					order: <Number>
				},
				{ ... }
		 	]
		 *
		 * Since we want to order the properties, we'll use
		 * the order key in the properties variable. This order key
		 * is the one used in the config.json file of each collection
		 * and is used for telling deployd the order of the properties.
		 */ 
		sortedProperties.sort(function(x, y) {
			var orderX = 0;
			var orderY = 1;

			properties.forEach(function(el) {
				if (el.default_name === x) {
					orderX = el.order;
				} else if (el.default_name === y) {
					orderY = el.order;
				}
			});

			if (orderX < orderY)
				return -1;
			else if (orderX > orderY)
				return 1;

			return 0;
		});

		/*
		 * Now, we'll iterate through sortedProperties and will
		 * add the properties to the data array following this schema:
		 *
		 	data = [
				[{"property_nameA": "<name>", "property_valueB": "<value>"}, ...],
				[{"property_nameA": "<name>", "property_valueB": "<value>"}, ...],
				[{"property_nameA": "<name>", "property_valueB": "<value>"}, ...],
			]
		 * 
		 * Each element of data is a document (a row in the table). Each
		 * element of a document is a property of this document. Note that
		 * instead of just using the schema:
		 *
		 	[<value>, <value>, <value>, <value>, ...]
		 *
		 * The following schema was used:
		 *
		 	[{"property_name": "<name>", "property_value": "<value>"}, ...]
		 *
		 * But why? When the user clicks the button "edit" in a row, we'll
		 * allow her to change the values of a document. As soon as she clicks
		 * "save" how we'll we know the "id" of that document so we can find
		 * it in our database? That's why the data property has not just the
		 * values but the name of the properties. And that's not the only reason
		 * we should do that. The other reason is: in the table we do not
		 * want to show the document's ID to the user. Why? Because she does not
		 * need to know what the hell are those crazy numbers and letters! And
		 * to do that, we should hide it right? How are you going to know what's
		 * an "id" if you don't know the property's name, just its value?
		 * That's why we need "property_name", in order to know where is the damn
		 * "id" so we can hide it.
		 * 
		 * The topmost element in the data array is the first document the user
		 * inserted. The bottommost element is the latest document the user inserted.
		 * Within each document, we'll have an array where we guarantee that
		 * property_nameA's order is less than property_nameB's order (this "order"
		 * is the order key that each property has in the config.json file).
		 */ 
		var arrayToBeInserted = [];

		for (var i = 0; i < sortedProperties.length; i++) { 
			var obj = {};
			obj["property_name"] = sortedProperties[i];
			obj["property_value"] = doc[sortedProperties[i]];

			arrayToBeInserted.push(obj);
		}

		/*
		 * Before we move on, there is a possibility the the incoming doc might already
		 * exist in data. If that's the case we won't be pushing arrayToBeInserted. we'll
		 * firstly need to find out the index at which the document to be replaced is, and then
		 * use this index to replace it with arrayToBeInserted.
		 * If at the end of the iteration documentToBeReplacedIndex is -1, it means the incoming doc
		 * should not be replaced.
		 */
		var documentToBeReplacedIndex = -1;

		/*
		 * The replace algorithm will work like the following:
		 *
		 * For each document in data, we'll:
		 *
		 * 1 - Get the current document's ID
		 * 2 - Compare it with the incoming doc's ID
		 * 3 - If they're equal, we'll assign the variable i to documentToBeReplacedIndex
		 */
		for (var i = 0; i < data.length; i++) {
			var currentDocumentId = findDocumentId(data[i]);

			if (currentDocumentId === doc.id) {
				documentToBeReplacedIndex = i;
			}
		}

		// Now, we'll just replace a document with the incoming one
		// if documentToBeReplacedIndex is not -1.
		if (documentToBeReplacedIndex != -1) {
			// replace document
			data[documentToBeReplacedIndex] = arrayToBeInserted;
		} else {
			// Push the built array into data
			data.push(arrayToBeInserted);
		}

		return data;
	}

	return dataService;
})