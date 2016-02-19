var Q = require('q');
var request = require("request");
var cheerio = require('cheerio');
var moment = require('moment');

var official = 'https://rarbg.to';
var mirror = 'https://rarbgunblock.com';
var rarbg_url = mirror;

module.exports = {
  search: function(query, cat) {
	if (cat) {
		if (cat.match(/movie/i)) {
			cat = 'category=14;48;17;44;45;47;42;46&';
		} else if (cat.match(/tv/i) !== null) {
			cat = 'category=18;41&';
		} else if (cat.match(/anime/i) !== null) {
			cat = 'category=14;48;17;44;45;47;42;46;18;41&';
		} else {
			cat = ''
		}
	} else {
		cat = '';
	}

    var torrent_search = query;
    var search_query = torrent_search.split(' ').join('+');
    var search_url = rarbg_url + "/torrents.php?" + cat + "search=" + search_query + "&order=seeders&by=DESC";

    var deferred = Q.defer();
    var data_content = {};
    var torrent_content = { 
		results: []
	};

    var theJar = request.jar();
    var options = {
        url: search_url,
        headers: {
            'Referer': rarbg_url + '/index6.php',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:43.0) Gecko/20100101 Firefox/43.0'
        },
        jar: theJar
    };

    theJar.setCookie('7fAY799j=VtdTzG69', rarbg_url, {"ignoreError":true});

	var now = Date.now();
    console.log('rarbg URL:', search_url);
    request(options, function(err, response, body){

      if(!err && response.statusCode === 200){
		torrent_content.response_time = Date.now() - now;

        var torrent_link, torrent_title, torrent_seeds, torrent_leech, torrent_size, torrent_date;

        $ = cheerio.load(body);

        var title = $("title").text();

        if(title === "Bot check !"){
          deferred.reject("Can't search Rarbg, It thinks you are a bot :(, Try again later.");
        }

        if($('.lista2t tr').length > 1){

          $('.lista2t tr').each(function(index, torrents){
              var d = $(this);
              var td = d.children('td.lista');

              links = $(torrents).find('a');

              $(links).each(function(i, link){

                if($(link).attr('href').indexOf("/torrent/") > -1 && $(link).attr('href').indexOf("#comments") < 1) {

                  rarbg_link = $(link).attr('href');
                  torrent_title = $(link).text();
                  torrent_size = $(td).eq(3).text();
                  torrent_seeds = $(td).eq(4).text();
                  torrent_leech = $(td).eq(5).text();
                  date_added = moment(Date.parse($(td).eq(2).text())).format('dddd DD MMM YYYY hh:mm:ss') + ' +0000';

				  // bytes size
				  if (torrent_size.match(/g/i) !== null) {
					  torrent_size = parseFloat(torrent_size) * 1024 * 1024 * 1024;
				  } else if (torrent_size.match(/m/i) !== null) {
					  torrent_size = parseFloat(torrent_size) * 1024 * 1024;
				  } else if (torrent_size.match(/k/i) !== null) {
					  torrent_size = parseFloat(torrent_size) * 1024;
				  }

                  var rarbg_id = rarbg_link.split('/torrent/').join('');
                  var rarbg_file = encodeURIComponent(torrent_title) + "-[rarbg.com].torrent";

                  var torrent_link = rarbg_url + "/download.php?id=" + rarbg_id + "&f=" +rarbg_file;

                  data_content = {
					category: cat.match(/tv/i) === null ? "Movies" : "TV",
                    title: torrent_title,
                    seeds: torrent_seeds,
                    leechs: torrent_leech,
                    size: torrent_size,
                    torrentLink: torrent_link,
                    link: rarbg_url + rarbg_link,
                    date_added: date_added
                  };

                  torrent_content.results.push(data_content);

                  deferred.resolve(torrent_content);
                }

              });

          });

        } else {
            deferred.reject("No torrents found");
        }
      } else {
        deferred.reject("There was a problem loading Rarbg");
      }

    });

    return deferred.promise;

  }
};