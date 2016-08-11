var Moostaka = function(opts){
    this.routes = [];

    // define the defaults
    this.defaultRoute = '/';
    this.viewLocation = '/views';

    // redirect to default route if none defined
    if(location.pathname === ''){
        history.pushState('data', this.defaultRoute, this.defaultRoute);
    }

    // override the defaults
    if(opts){
        this.defaultRoute = typeof opts.defaultRoute !== 'undefined' ? opts.defaultRoute : this.defaultRoute;
        this.viewLocation = typeof opts.viewLocation !== 'undefined' ? opts.viewLocation : this.viewLocation;
    }

    var moostaka = this;

    // hook up events
    $(document).on('click', 'a', function(e){
        e.preventDefault();
        if(e.target.href){
            var url = e.target.href.replace('http://', '').replace('https://', '').replace(e.target.host, '');
            history.pushState('data', e.target.textContent, url);
            moostaka.navigate(url);
        }else{
            // go to default route
            history.pushState('data', 'home', this.defaultRoute);
            moostaka.navigate(this.defaultRoute);
        }
    });

    // pop state
    window.onpopstate = function(e){
        moostaka.navigate(location.pathname);
    };

    // hook onload event
    window.onload = function(){
        moostaka.navigate(location.pathname);
    };
};

Moostaka.prototype.navigate = function(pathname){
    if(this.onnavigate){
        this.onnavigate(pathname);
    }

    // if no path, go to default
    if(!pathname || pathname === '/'){
        pathname = this.defaultRoute;
    }
    
    var routeMatch = false;
    for(var i = 0; i < this.routes.length; i++){
        var params = {};
        var hashParts = pathname.split('/');

        if(typeof this.routes[i].pattern === 'string'){
            var routeParts = this.routes[i].pattern.split('/');
            var thisRouteMatch = true;

            for(var x = 0; x < routeParts.length; x++){
                // A wildcard is found, lets break and return what we have already
                if(routeParts[x] === '*'){
                    break;
                }

                // check if segment length differs for strict matching
                if(routeParts.length !== hashParts.length){
                    thisRouteMatch = false;
                }

                // if not optional params we check it
                if(routeParts[x].substring(0, 1) !== ':'){
                    if(lowerCase(routeParts[x]) !== lowerCase(hashParts[x])){
                        thisRouteMatch = false;
                    }
                }else{
                    // this is an optional param that the user will want
                    var partName = routeParts[x].substring(1);
                    params[partName] = hashParts[x];
                }
            }

            // if route is matched
            if(thisRouteMatch === true){
                routeMatch = true;
                this.routes[i].handler(params);
                return;
            }
        }else{
            if(pathname.substring(1).match(this.routes[i].pattern)){
                this.routes[i].handler({'hash': pathname.substring(1).split('/')});
                return;
            }
        }
    }

    // no routes were matched. Redirect to a server side 404 for best SEO
    if(routeMatch === false){
        history.pushState('data', 'home', this.defaultRoute);
    }
};

function lowerCase(value){
    if(value){
        return value.toLowerCase();
    }
    return value;
}

function loadScript(url, callback){
    $.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        cache: true,
        async: true
    });
}

Moostaka.prototype.render = function(element, view, params, options, callback){
    if(!options){ options = {}; };
    if(!params){ params = {}; };
    if(options && typeof options.tags === 'undefined'){ Mustache.tags = [ '{{', '}}' ]; }
    if(options && typeof options.append === 'undefined'){ options.append = false; };

    $.ajax({
        url: this.viewLocation + '/' + view.replace('.mst', '') + '.mst',
        dataType: 'text'
    }).done(function (template){
        if(options.append === true){
            $(element).append(window.Mustache.to_html($(template).html(), params));
        }else{
            $(element).empty();
            $(element).html(window.Mustache.to_html($(template).html(), params));
        }
        if(typeof callback !== 'undefined'){
            callback();
        };
    });
};

Moostaka.prototype.getHtml = function(view, params, options, callback){
    if(!options){ options = {}; };
    if(!params){ params = {}; };
    if(typeof options.tags === 'undefined'){ Mustache.tags = [ '{{', '}}' ]; }else{ Mustache.tags = options.tags; }
    if(typeof options.markdown === 'undefined'){ options.markdown = false; }

    $.ajax({
        url: this.viewLocation + '/' + view.replace('.mst', '') + '.mst',
        dataType: 'text'
    }).done(function (template){
        if(options.markdown === true){
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/7.0.0/markdown-it.min.js', function(){
                var md = window.markdownit();
                var html = '<script id="template" type="text/template">' + md.render(template) + '</script>';
                callback(window.Mustache.render($(html).html(), params));
            });
        }else{
            callback(window.Mustache.render($(template).html(), params));
        }
    });
};

Moostaka.prototype.route = function(pattern, handler){
    this.routes.push({pattern: pattern, handler: handler});
};
