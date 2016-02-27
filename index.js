var Q = require('q');
var request = require("request");

var rarbg_url = 'https://torrentapi.org';

module.exports = {
	search: function(query, cat) {
		if (cat) {
			if (cat.match(/movie/i)) {
				cat = 'category=movies&';
			} else if (cat.match(/tv/i) !== null) {
				cat = 'category=tv&';
			} else if (cat.match(/anime/i) !== null) {
				cat = 'category=14;48;17;44;45;47;42;46;18;41&';
			} else {
				cat = '';
			}
		} else {
			cat = '';
		}
		var deferred = Q.defer();
		request(rarbg_url + "/pubapi_v2.php?get_token=get_token", function(m, b, c) {
			token = JSON.parse(c);
			var torrent_search = query;
			var search_query = torrent_search.split(' ').join('+');
			var search_url = rarbg_url + "/pubapi_v2.php?mode=search&" + cat + "search_string=" + search_query + "&order=seeders&by=DESC&format=json_extended&token=" + token.token;


			var data_content = {};
			var torrent_content = {
				results: []
			};

			var theJar = request.jar();
			var options = {
				url: search_url,
				headers: {
					'Referer': rarbg_url + '/pubapi_v2.php',
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:43.0) Gecko/20100101 Firefox/43.0'
				},
				jar: theJar
			};

			theJar.setCookie('7fAY799j=VtdTzG69', rarbg_url, {
				"ignoreError": true
			});

			var now = Date.now();
			console.log('rarbg URL:', search_url);
			request(options, function(err, response, body) {

				if (!err && response.statusCode === 200) {
					torrent_content.response_time = Date.now() - now;

					var data = JSON.parse(body);


					if (typeof data.torrent_results == 'object') {
						var results = data.torrent_results;

						var l = results.length;
						var i = 0;
						for (i = 0; i < l; i++) {

							data_content = {
								category: cat.match(/tv/i) === null ? "Movies" : "TV",
								title: results[i].title,
								seeds: results[i].seeders,
								leechs: results[i].leechers,
								size: results[i].size,
								torrentLink: results[i].download,
								link: results[i].download,
								date_added: results[i].pubdate
							};


							torrent_content.results.push(data_content);

							deferred.resolve(torrent_content);
						}

					} else {
						deferred.reject("No torrents found");
					}
				} else {
					deferred.reject("There was a problem loading Rarbg");
				}

			});
		});

		return deferred.promise;

	}
};
