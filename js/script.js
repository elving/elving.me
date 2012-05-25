$(function() {
    $.ajaxSetup({ timeout: 8000 });

    var services = {
            instagram: $.getJSON('https://api.instagram.com/v1/users/2353945/media/recent/?callback=?', {
                access_token: keys.instagram.access_token,
                client_id: keys.instagram.client_id
            }),
            twitter: $.getJSON('https://api.twitter.com/1/statuses/user_timeline.json?callback=?', {
                include_entities: true,
                screen_name: 'elving',
                count: 40
            }),
            foursquare: $.getJSON('https://api.foursquare.com/v2/users/self/checkins?callback=?', {
                oauth_token: keys.foursquare.oauth_token,
                limit: 40
            })
        },

        templates = {
            instagram: _.template($('#instagram-template').html()),
            twitter: _.template($('#twitter-template').html()),
            foursquare: _.template($('#foursquare-template').html())
        },

        linkify = function(text) {
            text = text.replace(/[A-Za-z]+:\/\/[A\-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/gim, function(url) {
                return '<a rel="nofollow" href="'+ url +'\">' + url +'</a>';
            });

            text = text.replace(/[@]+[A-Za-z0-9-_]+/gim, function(mention) {
                var username = mention.replace('@', '');
                return '<a rel="nofollow" href="http:\/\/twitter.com\/' + username +'" alt="' + username + '">' + mention + '</a>';
            });

            text = text.replace(/[#]+[A-Za-z0-9-_]+/gim, function(hash) {
                var hashtag = hash.replace('#', '%23');
                return '<a rel="nofollow" href="http:\/\/search.twitter.com\/search?q=' + hashtag + '" alt="' + hash + '">' + hash + '</a>';
            });

            return text;
        },

        $stream = $('ul.stream'),

        $bio = $('section.bio');

    $.when(services.instagram, services.twitter, services.foursquare).done(function(instagram,  twitter, foursquare) {
        var data = [];

        _.each(instagram[0].data, function(instagram) {
            data.push({
                service: 'instagram',
                time: new Date(parseInt(instagram.created_time * 1000, 10)),
                timeAgo: $.timeago(new Date(parseInt(instagram.created_time * 1000, 10))),
                content: instagram.images.low_resolution.url,
                caption: instagram.caption !== null && instagram.caption !== 'undefined' ? instagram.caption.text : '',
                link: instagram.link
            });
        });

        _.each(twitter[0], function(twitter) {
            data.push({
                service: 'twitter',
                time: new Date(twitter.created_at),
                timeAgo: $.timeago(new Date(twitter.created_at)),
                content: linkify(twitter.text),
                img: twitter.user.profile_image_url_https
            });
        });

        _.each(foursquare[0].response.checkins.items, function(foursquare) {
            data.push({
                service: 'foursquare',
                time: new Date(parseInt(foursquare.createdAt * 1000, 10)),
                timeAgo: $.timeago(new Date(parseInt(foursquare.createdAt * 1000, 10))),
                content: foursquare.venue.name,
                link: 'https://foursquare.com/elving/checkin/' + foursquare.id,
                location: {
                    lat: foursquare.venue.location.lat,
                    lng: foursquare.venue.location.lng
                }
            });
        });

        data = _.sortBy(data, function(item) {
            return item.time;
        });

        _.each(data, function(item) {
            $bio.removeClass('is-hidden');

            if (item.service === 'instagram') {
                $stream.prepend(templates.instagram({
                    content: item.content,
                    url: item.link,
                    caption: item.caption,
                    timeAgo: item.timeAgo
                })).removeClass('is-loading');
            } else if (item.service === 'twitter') {
                $stream.prepend(templates.twitter({
                    content: item.content,
                    timeAgo: item.timeAgo
                })).removeClass('is-loading');
            } else {
                $stream.prepend(templates.foursquare({
                    content: item.content,
                    location: item.location,
                    timeAgo: item.timeAgo
                })).removeClass('is-loading');
            }
        });
    }).fail(function() {
        $bio.removeClass('is-hidden');
    });
});
