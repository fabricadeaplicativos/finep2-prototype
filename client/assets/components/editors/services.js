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

		return databaseService;
	}
])

.factory('DataService', function() {
	var dataService = {};
	var data = [];

	dataService.pushDocument = function(doc) {
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

		sortedProperties.sort();

		/*
		 * Now, we'll iterate through sortedProperties and will
		 * add the properties to the data array following this schema:
		 *
		 	data = [
				[<property-A>, <property-B>, <property-C>, ...],
				[<property-A>, <property-B>, <property-C>, ...],
				[<property-A>, <property-B>, <property-C>, ...]
		 	]
		 * 
		 * The topmost element in the data array is the first document the user
		 * inserted. The bottommost element is the latest document the user inserted.
		 * Within each element, we'll have an array where we guarantee that, alphabetically, 
		 * property-A < property-B < property-C.
		 */ 
		var arrayToBeInserted = [];

		for (var i = 0; i < sortedProperties.length; i++) { 
			arrayToBeInserted.push(doc[sortedProperties[i]]);
		}

		// Push the built array into data
		data.push(arrayToBeInserted);

		return data;
	}

	return dataService;
})