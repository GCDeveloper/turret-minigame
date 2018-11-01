/*This file stores calculation functions used in the App program*/
/* module AppCalc */
var AppCalc  = (function () {
	"use strict";
	//private code
	//no private items yet, but to make the code more maintainable, modules will need to contain more private items.
	var AppCalc = {
		//public code
		pointHitsLineSegment: function(point, lineA, lineB, radius){
			var blnHit = false;
			var posADist = this.dist(point, lineA);
			var posBDist = this.dist(point, lineB);
			var lineLength = this.dist(lineA, lineB);
			var distToLineCrude = ((posADist+posBDist)-lineLength);
			var distToLine = this.distToLine(point, lineA, lineB);
			point.radius = radius || 2;
			if(distToLineCrude < point.radius){
				if(distToLine < point.radius){
					blnHit = true;
				}
			}
			return blnHit;
		},
		distToLine: function (point, lineA, lineB){
			return Math.abs((lineB.y-lineA.y)*point.x-(lineB.x-lineA.x)*point.y+lineB.x*lineA.y-lineB.y*lineA.x)/Math.sqrt(Math.pow(lineB.y-lineA.y, 2)+Math.pow(lineB.x-lineA.x, 2));
		},
		distToLineRel: function (point, lineA, lineB){
			return ((lineB.y-lineA.y)*point.x-(lineB.x-lineA.x)*point.y+lineB.x*lineA.y-lineB.y*lineA.x)/Math.sqrt(Math.pow(lineB.y-lineA.y, 2)+Math.pow(lineB.x-lineA.x, 2));
		},
		//checks if point is within a rectangle
		pointHitsRect: function(objPoint, objRect){
			var blnHit = false;
			if(objPoint.x>=objRect.x && objPoint.x<=objRect.x+objRect.width){
				if(objPoint.y>=objRect.y && objPoint.y<=objRect.y+objRect.height){
					blnHit = true;
				}
			}
			return blnHit;
		},
		//checks if two rectangles intersect
		rectsIntersect: function(r1, r2){
			return !((r2.x > (r1.x+r1.width)) || 
		   ((r2.x+r2.width) < r1.x) || 
		   (r2.y > (r1.y+r1.height)) ||
		   ((r2.y+r2.height) < r1.y));
		},
		//checks if two rectangles intersect + forcetextarea
		rectsIntersectTextarea: function(r1, r2, delta){
			var x1 = r1.x;
			var x2 = r2.x;
			var y1 = r1.y;
			var y2 = r2.y;
			var w1 = r1.width;
			var w2 = r2.width;
			var h1 = r1.height;
			var h2 = r2.height;
				h1 += r1.forceTextarea.height || 0;
				h2 += r2.forceTextarea.height || 0;
				w1 += r1.forceTextarea.width || 0;
				w2 += r2.forceTextarea.width || 0;
				if(typeof delta != 'undefined'){
					x1 += delta.x;
					y1 += delta.y;
					w1 += delta.width;
					h1 += delta.height;
					x2 += delta.x;
					y2 += delta.y;
					w2 += delta.width;
					h2 += delta.height;
				}
			return !((x2 > (x1+w1)) || 
		   ((x2+w2) < x1) || 
		   (y2 > (y1+h1)) ||
		   ((y2+h2) < y1));
		},
		//segment x1,y1 to x2,y2 check if intersects rect minX,minY,maxX,maxY which are coordinates.
		segmentIntersectsRect: function(x1, y1, x2, y2, minX, minY, maxX, maxY){  
			// Completely outside.
			if ((x1 <= minX && x2 <= minX) || (y1 <= minY && y2 <= minY) || (x1 >= maxX && x2 >= maxX) || (y1 >= maxY && y2 >= maxY))
				return false;
			
			var m = (y2 - y1) / (x2 - x1);
			var y = m * (minX - x1) + y1;
			if (y > minY && y < maxY) return true;
			y = m * (maxX - x1) + y1;
			if (y > minY && y < maxY) return true;
			var x = (minY - y1) / m + x1;
			if (x > minX && x < maxX) return true;
			x = (maxY - y1) / m + x1;
			if (x > minX && x < maxX) return true;
			return false;
		},
		// checks if a point is within a circle
		pointHitsCircle: function(objPoint, objCircle) {
			var distSq = (((objPoint.x - objCircle.x) * (objPoint.x - objCircle.x)) + ((objPoint.y - objCircle.y) * (objPoint.y - objCircle.y)));
			var radiusSq =  (objCircle.radius * objCircle.radius);
			return (distSq < radiusSq);
		},
		// checks if two circles are touching
		circleHitsCircle: function(circleA, circleB) {
			var distSq = (((circleA.x - circleB.x) * (circleA.x - circleB.x)) + ((circleA.y - circleB.y) * (circleA.y - circleB.y)));
			var radiiSq = ((circleA.radius + circleB.radius) * (circleA.radius + circleB.radius));
			return (distSq < radiiSq);
		},
		// checks if a point is within an oval
		pointHitsOval: function(objPoint, objOval) {
			var x = objPoint.x;
			var y = objPoint.y;
			var h = objOval.x;
			var k = objOval.y;
			var rx = Math.pow(objOval.radiusX, 2);
			var ry = Math.pow(objOval.radiusY, 2);
			return ((Math.pow(x-h, 2)/rx)+(Math.pow(y-k, 2)/ry) <= 1);
		},
		//p = point, p0,p1,p2 = triangle corners
		pointHitsTriangle: function(p, p0, p1, p2){
			var A = 1/2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
			var sign = A < 0 ? -1 : 1;
			var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
			var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

			return s > 0 && t > 0 && (s + t) < 2 * A * sign;
		},
		//vector includes: x, y, angle in radians, distance
		vectorHitsCircle: function(objVector, objCircle){

		},
		//get the x,y coords at the end of a vector (provide start x,y,angle, and distance in pixels and radians)
		getVectorEnd: function(objVector){
			return {
				x: objVector.x+Math.sin(objVector.angle)*objVector.dist,
				y: objVector.y+Math.cos(objVector.angle)*objVector.dist
			};
		},
		//check if a point is touching a vector
		pointHitsVector: function(objVector, objPoint){
			var newVector = objVector;
			newVector.dist = this.dist(objVector, objPoint);
			if(Math.abs(newVector.dist) < (Math.abs(objVector.dist))){
				return (getVectorEnd(newVector) == objPoint);
			} else {
				return false;	
			}
		},
		toRadians: function(numDegrees){
			   return (((numDegrees)/180)*Math.PI);
		},
		toDegrees: function(numRadians){
			   return (((numRadians)*180)/Math.PI);
		},
		dist: function(pointA, pointB){
				return Math.sqrt(((pointA.x-pointB.x)*(pointA.x-pointB.x))+((pointA.y-pointB.y)*(pointA.y-pointB.y)));
		},
		distSq: function(pointA, pointB){
				return (((pointA.x-pointB.x)*(pointA.x-pointB.x))+((pointA.y-pointB.y)*(pointA.y-pointB.y)));
		},
		/*@point {x,y} @coords [{x,y},{x,y},...]*/
		getClosestCoords: function(point, coords){
			var smallest;
			var i = 0;
			var len = coords.length;
			for(i=0;i<len;i++){
				if(typeof smallest == 'undefined' || this.distSq(point, coords[i]) < smallest){
					smallest = coords[i];
				}
			}
			return smallest;
		},
		//get angle in radians between two points
		getAngle: function(pointA, pointB){
			  return Math.atan2(pointB.x - pointA.x, pointB.y - pointA.y);
		},
		Bezier: {
			B0: function(t) { return t*t*t;},
			B1: function(t) { return 3*t*t*(1-t);},
			B2: function(t) { return 3*t*(1-t)*(1-t);},
			B3: function(t) { return (1-t)*(1-t)*(1-t);},
			getAngle: function(t,C0,C1,C2,C3){
				var posA = this.getPosition(Math.max((t-0.02), 0),C0,C1,C2,C3);
				var posB = this.getPosition(Math.min((t+0.02), 1),C0,C1,C2,C3);
				return -AppCalc.getAngle(posA, posB);
			},
			getPosition: function(multiplier,C0,C1,C2,C3) {
			  var pos = {x: 0, y: 0};
			  pos.x = C0.x*this.B0(multiplier) + C1.x*this.B1(multiplier) + C2.x*this.B2(multiplier) + C3.x*this.B3(multiplier);
			  pos.y = C0.y*this.B0(multiplier) + C1.y*this.B1(multiplier) + C2.y*this.B2(multiplier) + C3.y*this.B3(multiplier);
			  return pos;
			}
		}
	}
	return AppCalc;
}());