import turf, { Units, Position } from "@turf/turf";
import polylineDescriptor from "@mapbox/polyline";
import h3 from "h3-js";
import { latLngCoordinates } from "../../../types/types";

type polylineCoordsArray = latLngCoordinates[];

class PolylineUtils {
  private h3level: number;

  constructor() {
    this.h3level = 9;
  }

  async convertPolylineToLineString(polyline: polylineCoordsArray) {
    const lineString = turf.lineString(polyline);
    return lineString;
  }

  convertPolylineToCoordinates(polyline: string): Position[] {
    const coordinatesArray = polylineDescriptor.decode(polyline, 7);
    return coordinatesArray;
  }

  convertCoordinatesToLineString(coordsArray: polylineCoordsArray) {
    const line = turf.lineString(coordsArray);
    const length = turf.length(line);

    return { line, length };
  }

  async getPointsAtDistance(
    polyline: polylineCoordsArray,
    percentages: number[]
  ) {
    const decodedLine = turf.lineString(polyline);

    // Calculate line length
    const lineLength = turf.length(decodedLine);

    const points = [];

    // Calculate target distances for each percentage
    for (const percentage of percentages) {
      const targetDistance = lineLength * percentage;

      // Interpolate point at target distance
      const interpolatedPoint = turf.along(decodedLine, targetDistance);
      const [lon, lat] = turf.getCoord(interpolatedPoint);
      points.push([lat, lon]);
    }

    return points;
  }

  //   async chunkPolyline(lineString : string , distance : number) {
  //     const chunkedPolyline = turf.lineChunk(lineString, parseInt(distance), {
  //       units: "kilometres",
  //     });

  //     return chunkedPolyline;
  //   }

  //   async splitPolylineByNearestPoint(refCoordinates, lineString) {
  //     const referencePoint = turf.point(refCoordinates);

  //     const closestPointToCoordinates = turf.nearestPointOnLine(
  //       lineString,
  //       referencePoint
  //     );

  //     // Split the line at the closest point
  //     const splitResult = turf.lineSplit(lineString, closestPointToCoordinates);

  //     // Return the coordinates of the points after the split
  //     const newPolylineCoordinates = splitResult.features[1].geometry.coordinates;

  //     //TODO : Decode this back into a polyline using the mapbox/polyline decode

  //     const newPolyline = await polylineDescriptor.encode(
  //       newPolylineCoordinates,
  //       7
  //     );

  //     return newPolyline;

  //     //TODO : Store this back as the new driver location
  //   }

  //   async getDistanceTravelledAlongPolyline(polyline : string, currentLocation : [number , number] ) {
  //     const decodedPolyline  = turf.lineString(this.convertPolylineToCoordinates(polyline))

  //     //Get the nearest point on the polyline to the coordinates
  //     const location = turf.point([currentLocation[0], currentLocation[1]]);

  //     const nearestPointOnLine = turf.nearestPointOnLine(
  //      decodedPolyline,
  //       location,
  //     );

  //     const closestPointIndex = decodedPolyline.findIndex((coord) =>
  //       turf.booleanEqual(turf.point(coord), nearestPointOnLine)
  //     );

  //     const segmentCoordinates = decodedPolyline.slice(0, closestPointIndex + 1);

  //     const distanceTravelled = turf.length(
  //       turf.lineString([...segmentCoordinates], { units: "meters" })
  //     );

  //     return distanceTravelled;
  //   }

  calculateDistanceBetweenPoints(
    start: latLngCoordinates,
    end: latLngCoordinates,
    units: Units
  ) {
    const startPoint = turf.point([start[0], start[1]]);
    const endPoint = turf.point([end[0], end[1]]);

    const distance = turf.distance(startPoint, endPoint, { units });

    return distance;
  }

  //   async convertPolylineToH3CoveringCellsArray(polyline) {
  //     //Decode Polyline into array of coordinates

  //     const polylineArray = await this.convertPolylineToCoordinates(polyline);

  //     const coveringH3Indexes = h3.polyfill(polylineArray);

  //     return coveringH3Indexes;
  //   }

  convertCoordinatesToH3CellId(coordinates: latLngCoordinates, level?: number) {
    const h3CellData = h3.latLngToCell(
      coordinates[0],
      coordinates[1],
      level ?? this.h3level
    );

    return h3CellData;
  }

  getParentCell(cellId: string, level: number) {
    return h3.cellToParent(cellId, level);
  }

  //   getParentChildrenCells(parent, level) {
  //     return h3.cellToChilderen(parent, parseInt(level));
  //   }

  async getNeighbouringCellsInDistance(originCell: string, distance: number) {
    const cellsInVicinity = h3.gridDisk(originCell, distance);

    return cellsInVicinity;
  }

  async getParentCellAtUpperLevel(originCell: string, level: number) {
    const parentCellId = h3.cellToParent(originCell, level);

    return parentCellId;
  }

  //   async checkPointInsideH3Covering(polyline, point) {
  //     const covering = await this.convertPolylineToH3CoveringCellsArray(polyline);

  //     const h3Cell = this.convertCoordinatesToH3CellId(point);

  //     const isPointInPolygon = covering.includes(h3Cell);

  //     return isPointInPolygon;
  //   }

  //   async snapToRoads(rrouteArray, timestampArray) {
  //     //send request to our OSRM server to get the reconstructed route
  //     const reconstructedRoute = [];

  //     return await reconstructedRoute;
  //   }
}

const polylineUtilities = new PolylineUtils();

export default polylineUtilities;
