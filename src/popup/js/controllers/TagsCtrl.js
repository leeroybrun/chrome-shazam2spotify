angular.module('Shazam2Spotify').controller('TagsCtrl', function($scope, $location, $timeout, ShazamService, SpotifyService, TagsService) {
	$scope.updating = true;

	$scope.tags = TagsService.list;

	$scope.updateTags = function(callback) {
		$scope.updating = true;

		ShazamService.updateTags(function(err) {
			$scope.updating = false;

			if(err) {
				$scope.$apply(function() {
					$location.path('/settings');
				});
			}
			
			callback();
		});
	};

	$scope.newSearch = {
		show: false,
		tag: null,
		error: null,
		query: {
			artist: '',
			track: ''
		},
		send: function() {
			var query = SpotifyService.genQuery($scope.newSearch.query.track, $scope.newSearch.query.artist);

			SpotifyService.playlist.searchAndAddTag($scope.newSearch.tag, query, true, function(error) {
				if(error) {
					$scope.newSearch.error = chrome.i18n.getMessage('noTrackFoundQuery');
				} else {
					$scope.newSearch.error = null;
					$scope.newSearch.tag = null;
					$scope.newSearch.show = false;
				}
			});
		},
		cancel: function() {
			$scope.newSearch.error = null;
			$scope.newSearch.tag = null;
			$scope.newSearch.show = false;
		}
	};

	$scope.retryTagSearch = function(tag) {
		$scope.newSearch.query.artist = tag.artist;
		$scope.newSearch.query.track = tag.name;
		$scope.newSearch.tag = tag;
		$scope.newSearch.show = true;
	};

	function checkLogin(callback) {
		ShazamService.loginStatus(function(status) {
			if(status === false) {
				return callback(false);
			}

			SpotifyService.loginStatus(function(status) {
				if(status === false) {
					return callback(false);
				}

				callback(true);
			});
		});
	}

	var refreshTags = function() {
		checkLogin(function(status) {
			if(status === true) {
				SpotifyService.playlist.get(function(err) {
					TagsService.load(function() {
						$scope.tags = TagsService.list;

						$scope.updateTags(function() {
							SpotifyService.playlist.searchAndAddTags(function() {
								// Tags added
							});
						});
					});
				});
			} else {
				$location.path('/settings');
				$scope.$apply();
			}
		});
	};

	$scope.refreshTags = refreshTags;

	refreshTags();
});