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