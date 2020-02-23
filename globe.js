Globe = (function(){
    const earthRadius = 6371.0
    const graticuleLineStep = 1.0
    const linePointInterval = 500.0

    var defaultStyle = {
        graticuleColor: 'lightgrey',
        lineColor: 'black',
        dotColor: 'red',
        bgColor: 'white',
        lineWidth: 0.1,
        scale: 0.7
    }

    function Globe(){
        this.pinhole = new Pinhole()
        this.style = defaultStyle
    }

    Globe.prototype._colorize = function(color, fn){
        this.pinhole.begin()
        fn(this)
        if (color) {
            this.pinhole.colorize(color)
        }
        this.pinhole.end()
    }

    Globe.prototype.centerOn = function(lat, lng){
        this.pinhole.rotate(0, 0, -degreeToRadian(lng)-Math.PI/2)
	    this.pinhole.rotate(Math.PI/2-degreeToRadian(lat), 0, 0)
    }

    Globe.prototype.drawParallel = function(lat, color){
        this.pinhole.begin()
        for (var lng = -180.0; lng < 180.0; lng += graticuleLineStep) {
            var a = cartestian(lat, lng)
            var b = cartestian(lat, lng+graticuleLineStep)
            this.pinhole.drawLine(a.x, a.y, a.z, b.x, b.y, b.z)
        }
        this.pinhole.colorize(color || this.style.graticuleColor)
        this.pinhole.end()
    }

    Globe.prototype.drawParallels = function(interval, color){
        this.drawParallel(0)
        for (var lat = interval; lat < 90.0; lat += interval) {
            this.drawParallel(lat, color)
            this.drawParallel(-lat, color)
        }
    }

    Globe.prototype.drawMeridian = function(lng, color){
        this.pinhole.begin()
        for (var lat = -90.0; lat < 90.0; lat += graticuleLineStep) {
            var a = cartestian(lat, lng)
            var b = cartestian(lat+graticuleLineStep, lng)
            this.pinhole.drawLine(a.x, a.y, a.z, b.x, b.y, b.z)
        }
        this.pinhole.colorize(color || this.style.graticuleColor)
        this.pinhole.end()
    }

    Globe.prototype.drawMeridians = function(interval, color){
        for (var lng = -180.0; lng < 180.0; lng += interval) {
            this.drawMeridian(lng, color)
        }
    }

    Globe.prototype.drawGraticule = function(interval, color){
        this.drawParallels(interval, color)
        this.drawMeridians(interval, color)
    }

    Globe.prototype.drawDot = function(lat, lng, radius, color){
        this.pinhole.begin()
        var c = cartestian(lat, lng)
        this.pinhole.drawDot(c.x, c.y, c.z, radius)
        this.pinhole.colorize(color || this.style.dotColor)
        this.pinhole.end()
    }

    Globe.prototype.drawLandBoundaries = function(color){
        this._drawPreparedPaths(land, color)
    }

    Globe.prototype.drawCountryBoundaries = function(color){
        this._drawPreparedPaths(countries, color)
    }

    Globe.prototype.render = function(canvas){
        this.pinhole.render(canvas, this.style)
    }

    Globe.prototype._drawPreparedPaths = function(paths, color){
        this.pinhole.begin()
        for (var path = 0; path < paths.length; path++) {
            for (var i = 0; i+1 < paths[path].length; i++) {
                var p1 = paths[path][i]
                var p2 = paths[path][i+1]
                
                var a = cartestian(p1.lat, p1.lng)
                var b = cartestian(p2.lat, p2.lng)
                
                this.pinhole.drawLine(a.x, a.y, a.z, b.x, b.y, b.z)
            }
        }
        this.pinhole.colorize(color || this.style.lineColor)
        this.pinhole.end()
    }

    function cartestian(lat, lng) {
        return {
            x: cos(lat) * cos(lng),
            y: cos(lat) * sin(lng),
            z: -sin(lat)
        }
    }

    function haversine(lat1, lng1, lat2, lng2) {
        var dlat = lat2 - lat1
        var dlng = lng2 - lng1
        var a = (sin(dlat/2)*sin(dlat/2)) + (cos(lat1)*cos(lat2)*sin(dlng/2)*sin(dlng/2))
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return earthRadius * c
    }

    function intermediate(lat1, lng1, lat2, lng2, f) {
        var dr = haversine(lat1, lng1, lat2, lng2) / earthRadius
        var a = Math.sin((1-f)*dr) / Math.sin(dr)
        var b = Math.sin(f*dr) / Math.sin(dr)
        var x = a*cos(lat1)*cos(lng1) + b*cos(lat2)*cos(lng2)
        var y = a*cos(lat1)*sin(lng1) + b*cos(lat2)*sin(lng2)
        var z = a*sin(lat1) + b*sin(lat2)
        var phi = Math.atan2(z, Math.sqrt(x*x+y*y))
        var lambda = Math.atan2(y, x)
        
        return {
            lat: radianToDegree(phi),
            lng: degreeToRadian(lambda)
        }
    }

    function degreeToRadian(degree) { return Math.PI * degree / 180.0 }
    
    function radianToDegree(radian) { return 180.0 * radian / Math.PI }
    
    function sin(degree) { return Math.sin(degreeToRadian(degree)) }
    
    function cos(degree) { return Math.cos(degreeToRadian(degree)) }

    return Globe
}())