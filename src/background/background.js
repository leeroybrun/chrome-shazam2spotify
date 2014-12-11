window.s2s = {};

$(document).ready(function() {
	s2s.Logger.info('[init] Welcome ! '+ (new Date()));
	s2s.Logger.info('[init] Loading tags from storage...');

	s2s.Tags.load(function() {
		s2s.Logger.info('[init] '+ s2s.Tags.list.length +' tags loaded.');
	});

	s2s.CanvasIcon.load();

	s2s.updating = false;

	s2s.updateTags = function(callback) {
		if(s2s.updating) {
			s2s.Logger.info('[core] Tags update already in progress.');
			return callback('already_in_progress');
		}

		s2s.Logger.info('[core] Starting tags update...');

		s2s.updating = true;
		s2s.CanvasIcon.startRotation();

		s2s.Spotify.playlist.get(function(err) {
			if(err) {
				s2s.Logger.info('[core] Error getting playlist. Tags update aborted.');
				s2s.updating = false;
				s2s.CanvasIcon.stopRotation();
				return callback(err);
			}

			s2s.Logger.info('[core] Spotify playlist got.');
			s2s.Logger.info('[core] Updating tags...');

			s2s.Tags.update(function(err) {
				if(err) {
					s2s.Logger.info('[core] Error updating tags.');
				} else {
					s2s.Logger.info('[core] All done ! Tags updated.');
				}

				s2s.updating = false;
				s2s.CanvasIcon.stopRotation();

				callback(err);
			});
		});
	};

	s2s.searchTag = function(trackName, artist, tag, callback) {
		tag.name = trackName;
		tag.artist = artist;
		tag.query = null; // Will be regenerated by Tags.add

		s2s.Tags.add(tag, function() {
			if(tag.status > 2) {
				s2s.Tags.updatePlaylist(callback);
			} else {
				callback(new Error('Not found'));
			}
		});
	};

	// When we receive a "clearStorage" message, we need to close popup and then clear storage
	chrome.extension.onMessage.addListener(function(request,sender,sendResponse)
	{
	    if(request.greeting === 'clearStorage')
	    {
	    	// Close popup before cleaning storage if we don't want Chrome to crash on Windows
	        var popup = chrome.extension.getViews({type: 'popup'})[0];
	        popup.window.close();

	        s2s.Logger.info('[core] Cleaning extension\'s background data.');

	        s2s.ChromeHelper.clearStorage();

	        // Reload background script - disabled for now, it crash Chrome on Windows
	        //window.location.reload();

	        // Clear cached data from background script
	        s2s.Tags.data.clearCache();
	        s2s.Spotify.data.clearCache();
	        s2s.CanvasIcon.stopRotation();

	        // Reload tags, will reset list & lastUpdate
	        s2s.Tags.load();
	    }
	});

	// Check for install/update
	chrome.runtime.onInstalled.addListener(function(details) {
	    if(details.reason == 'install') {
	        s2s.Logger.info('[core] Extension installed.');
	    } else if(details.reason == 'update') {
	        var thisVersion = chrome.runtime.getManifest().version;
	        s2s.Logger.info('[core] Extension updated from '+ details.previousVersion +' to '+ thisVersion +'.');
	        
	        s2s.UpdateService.update(details.previousVersion, thisVersion);
	    }
	});
});