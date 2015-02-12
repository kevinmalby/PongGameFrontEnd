var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var canvasOffset = $("#canvas").offset();
var offsetX = canvasOffset.left;
var offsetY = canvasOffset.top;

//
var rect = (function () {

    // constructor
    function rect(id, x, y, width, height, fill, stroke, strokewidth) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.width = width;
        this.height = height;
        this.fill = fill || "gray";
        this.stroke = stroke || "skyblue";
        this.strokewidth = strokewidth || 2;
        this.redraw(this.x, this.y);
        return (this);
    }
    rect.prototype.redraw = function (x, y) {
        this.x = x || this.x;
        this.y = y || this.y;
        this.draw(this.stroke);
        return (this);
    }
    //
    rect.prototype.highlight = function (x, y) {
        this.x = x || this.x;
        this.y = y || this.y;
        this.draw("orange");
        return (this);
    }
    //
    rect.prototype.draw = function (stroke) {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = this.strokewidth;
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.stroke();
        ctx.fill();
        ctx.restore();
    }
    //
    rect.prototype.isPointInside = function (x, y) {
        return (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height);
    }


    return rect;
})();

var circle = (function () {

    // constructor
    function circle(id, x, y, radius, startAngle, endAngle, fill, stroke, strokewidth) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.fill = fill || "gray";
        this.stroke = stroke || "skyblue";
        this.strokewidth = strokewidth || 2;
        this.redraw(this.x, this.y);
        return (this);
    }
    circle.prototype.redraw = function (x, y) {
        this.x = x || this.x;
        this.y = y || this.y;
        this.draw(this.stroke);
        return (this);
    }
    //
    circle.prototype.highlight = function (x, y) {
        this.x = x || this.x;
        this.y = y || this.y;
        this.draw("orange");
        return (this);
    }
    //
    circle.prototype.draw = function (stroke) {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = this.strokewidth;
        ctx.arc(this.x, this.y, this.radius, this.startAngle, this.endAngle, true);
        ctx.stroke();
        ctx.fill();
        ctx.restore();
    }
    //
    circle.prototype.isPointInside = function (x, y) {
        return (x >= this.x && x <= this.x + this.radius*2 && y >= this.y && y <= this.y + this.radius*2);
    }


    return circle;
})();