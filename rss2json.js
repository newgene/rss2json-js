const CACHE_MAX_AGE = 604800;

var express = require('express');
var request = require('request');
var app = express();
var router = express.Router();
var port = process.env.PORT || 8854;

var parser = new require('xml2js').Parser({
    "explicitArray": false
});

app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "false");
    res.header("Access-Control-Max-Age", "60");
    res.header("Cache-Control", "max-age=" + CACHE_MAX_AGE +", public")
    next();
});

function convert_result(result){
    var out = {
        "status": "ok",
        "feed": {
            "url": result.rss.channel['atom:link'].$.href  || '',
            "title": result.rss.channel.title || '',
            "link": result.rss.channel.link  || '',
            "author": result.rss.channel.author || '',
            "description": result.rss.channel.description || '',
            "image":  result.rss.channel.image || '',
        },
        "items": []
    };
    result.rss.channel.item.forEach(function(i){
        i.content = i["content:encoded"];
        delete i["content:encoded"];
        i.author = i["dc:creator"];
        delete i["dc:creator"];
        i.categories = i.category;
        delete i.category
        i.guid = i.guid._;
        i.thumbnail = '';
        i.enclosure = [];
        out.items.push(i);
    });
    return out;
};

router.get('/rss2json', function(req, res) {
    if (req.query.feed == undefined)
        return res.json({error:"You must specify a feed parameter"});

    request(req.query.feed, function (error, response, body){
        if (!error && response.statusCode == 200) {
            body = body.replace("html_content");
            parser.parseString(body, function (err, result) {
                if (err != undefined)
                    return res.json(err);
                if (!req.query.raw == "1")
                    result = convert_result(result);
                return res.json(result);
        });
    }
    else
        return res.json({error:"unable to reach url"})
    });
});

app.use('/', router);
app.listen(port);
console.log('Listening on port ' + port);
